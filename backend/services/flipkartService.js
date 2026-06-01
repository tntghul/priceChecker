const { chromium } = require("playwright");
const fs = require("fs");

const scrapeFlipkart = async (query) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  try {
    await page.goto(
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
      { waitUntil: "networkidle", timeout: 60000 }
    );

    try {
      await page.click('button[class*="close"], form + button', { timeout: 3000 });
    } catch (e) {
      console.log("No popup found");
    }

    await page.waitForLoadState("networkidle");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await page.screenshot({ path: "flipkart.png", fullPage: true });
    fs.writeFileSync("flipkart.html", await page.content());

    const products = await page.evaluate(() => {
      const results = [];
      const nameMap = {};

      try {
        const scriptTag = document.querySelector('script[type="application/ld+json"]');
        if (scriptTag) {
          const data = JSON.parse(scriptTag.textContent);
          const itemList = Array.isArray(data) ? data[0] : data;
          (itemList?.itemListElement || []).forEach((item) => {
            const pidMatch = item.url?.match(/pid=([A-Z0-9]+)/);
            if (pidMatch) {
              nameMap[pidMatch[1]] = { name: item.name, url: item.url };
            }
          });
        }
      } catch (e) {}

      const cards = document.querySelectorAll("div[data-id]");

      cards.forEach((card) => {
        const dataId = card.getAttribute("data-id");
        const jsonEntry = nameMap[dataId];
        const name =
          jsonEntry?.name || card.querySelector("img")?.getAttribute("alt");

        if (!name) return;

        let price = null;
        const allDivs = card.querySelectorAll("div");
        for (const div of allDivs) {
          const text = div.textContent.trim();
          if (div.childElementCount === 0 && text.startsWith("₹")) {
            price = text;
            break;
          }
        }

        const image =
          card.querySelector("img")?.src ||
          card.querySelector("img")?.getAttribute("data-src") ||
          null;

        const url =
          jsonEntry?.url ||
          card.querySelector("a[href*='/p/']")?.href ||
          card.querySelector("a[href]")?.href ||
          null;

        // ✅ Rating — div.MKiFS6 se lo (confirmed from HTML)
        const ratingEl = card.querySelector("div.MKiFS6");
        let rating = null;
        if (ratingEl) {
          // MKiFS6 mein text + img hai, sirf first text node lo
          const ratingText = ratingEl.childNodes[0]?.textContent?.trim();
          const parsed = parseFloat(ratingText);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
            rating = parsed;
          }
        }

        if (name && price) {
          results.push({
            name: name.trim(),
            price: Number(price.replace(/[₹,]/g, "")),
            image: image || null,
            rating: rating,
            url: url || null,
            website: "Flipkart",
          });
        }
      });

      const seen = new Set();
      return results.filter((item) => {
        if (seen.has(item.name)) return false;
        seen.add(item.name);
        return true;
      });
    });

    console.log("FLIPKART PRODUCTS:", products.length);
    console.log("FLIPKART SAMPLE RATING:", products[0]?.rating);
    await browser.close();
    return products;

  } catch (err) {
    console.log("FLIPKART ERROR:", err.message);
    await browser.close();
    return [];
  }
};

module.exports = scrapeFlipkart;