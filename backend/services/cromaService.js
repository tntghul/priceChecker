const { chromium } = require("playwright-extra");
const stealth = require("puppeteer-extra-plugin-stealth");
chromium.use(stealth());
const fs = require("fs");

// ✅ Croma image URL properly build karna
const buildCromaImageUrl = (item) => {
  // ✅ Priority 1: plpImage — direct full URL
  if (item.plpImage) return item.plpImage;

  // Priority 2: images array
  if (Array.isArray(item.images) && item.images.length > 0) {
    const img = item.images[0];
    const raw = img.url || img.imageURL || img.src || img.path || null;
    if (raw) {
      if (raw.startsWith("http")) return raw;
      if (raw.startsWith("/medias/")) {
        return `https://media.croma.com/image/upload/v1/${raw.replace("/medias/", "")}`;
      }
      return `https://media.croma.com${raw}`;
    }
  }

  // Priority 3: direct fields
  const direct = item.image || item.thumbnail || item.imageUrl || item.imgUrl || null;
  if (direct) {
    if (direct.startsWith("http")) return direct;
    return `https://media.croma.com${direct}`;
  }

  return null;
};

const scrapeCroma = async (query) => {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    extraHTTPHeaders: {
      "Accept-Language": "en-IN,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
  });

  let interceptedProducts = [];

  await context.route("**/*", async (route) => {
    const url = route.request().url();
    const resourceType = route.request().resourceType();

    if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
      await route.abort();
      return;
    }

    const blockedDomains = [
      "bat.bing.com", "google-analytics.com", "doubleclick.net",
      "facebook.com", "analytics", "hotjar.com", "clarity.ms",
      "adservice.google.com",
    ];
    if (blockedDomains.some((d) => url.includes(d))) {
      await route.abort();
      return;
    }

    let response;
    try {
      response = await route.fetch();
    } catch (e) {
      await route.abort();
      return;
    }

    try {
      const contentType = response.headers()["content-type"] || "";
      if (contentType.includes("application/json")) {
        const text = await response.text();
        const json = JSON.parse(text);

        const results =
          json?.results ||
          json?.products ||
          json?.data?.results ||
          json?.data?.products ||
          [];

        if (results.length > 0 && results[0]?.name) {
          interceptedProducts = results
            .map((item) => ({
              name: item.name || item.title || "",
              price: item.price?.value || item.offerPrice || item.price || 0,
              image: buildCromaImageUrl(item), // ✅ plpImage se aayegi ab
              rating: item.averageRating || item.rating?.average || null,
              url: item.url ? `https://www.croma.com${item.url}` : null,
              website: "Croma",
            }))
            .filter((p) => p.name && p.price);

          console.log("CROMA: Intercepted", interceptedProducts.length, "products");
          console.log("CROMA: Sample image URL:", interceptedProducts[0]?.image);
        }
      }
    } catch (e) {}

    await route.fulfill({ response });
  });

  const page = await context.newPage();

  try {
    await page.goto(
      `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle", timeout: 60000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 3000 + Math.random() * 2000));

    if (interceptedProducts.length > 0) {
      console.log("CROMA PRODUCTS (intercepted):", interceptedProducts.length);
      await browser.close();
      return interceptedProducts;
    }

    // ============ DOM FALLBACK ============
    console.log("CROMA: No intercept, trying DOM...");

    const html = await page.content();
    fs.writeFileSync("croma_debug.html", html);

    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const products = await page.evaluate(() => {
      const items = [];
      const seen = new Set();

      const allLi = document.querySelectorAll("ul li");

      allLi.forEach((li) => {
        if (li.querySelectorAll("a").length === 0) return;

        const title =
          li.querySelector("[class*='title']")?.innerText ||
          li.querySelector("[class*='name']")?.innerText ||
          li.querySelector("h3")?.innerText ||
          li.querySelector("h4")?.innerText ||
          li.querySelector("a")?.getAttribute("title") ||
          li.querySelector("a")?.innerText;

        let price = null;
        const allEls = li.querySelectorAll("span, div, p, strong");
        for (const el of allEls) {
          const text = el.textContent.trim();
          if (el.childElementCount === 0 && text.startsWith("₹") && text.length < 15) {
            price = text;
            break;
          }
        }

        const imgEl = li.querySelector("img");
        let image = null;
        if (imgEl) {
          const candidates = [
            imgEl.getAttribute("data-src"),
            imgEl.getAttribute("data-lazy-src"),
            imgEl.getAttribute("data-original"),
            imgEl.getAttribute("data-img-src"),
            imgEl.getAttribute("data-srcset")?.split(" ")[0],
            imgEl.getAttribute("srcset")?.split(" ")[0],
            imgEl.src,
          ];
          image = candidates.find(
            (c) => c && c.length > 10 && !c.includes("placeholder") && !c.includes("data:image")
          ) || null;
        }

        const url =
          li.querySelector("a[href*='/p/']")?.href ||
          li.querySelector("a")?.href;

        const ratingText =
          li.querySelector("[class*='rating'] span")?.innerText?.trim() ||
          li.querySelector("[class*='review'] span")?.innerText?.trim() ||
          null;
        const rating = ratingText ? parseFloat(ratingText) : null;

        const cleanTitle = title?.trim();

        if (cleanTitle && price && cleanTitle.length > 5 && !seen.has(cleanTitle)) {
          seen.add(cleanTitle);
          items.push({
            name: cleanTitle,
            price: Number(price.replace(/[₹,\s]/g, "")),
            image: image || null,
            rating: isNaN(rating) ? null : rating,
            url: url || null,
            website: "Croma",
          });
        }
      });

      return items;
    });

    const seen = new Set();
    const unique = products.filter((p) => {
      if (seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    });

    console.log("CROMA PRODUCTS (DOM):", unique.length);
    console.log("CROMA: Sample image (DOM):", unique[0]?.image);
    await browser.close();
    return unique;

  } catch (err) {
    console.log("CROMA ERROR:", err.message);
    await browser.close();
    return [];
  }
};

module.exports = scrapeCroma;