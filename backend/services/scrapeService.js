const puppeteer = require("puppeteer");

const scrapeAmazon = async (query) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  try {
    await page.goto(
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    await new Promise((r) => setTimeout(r, 2000));

    const products = await page.evaluate(() => {
      const items = [];
      const seen = new Set();

      document
        .querySelectorAll(".s-main-slot .s-result-item[data-asin]")
        .forEach((el) => {
          const asin = el.getAttribute("data-asin");
          if (!asin || asin === "") return;

          const name =
            el.querySelector("h2 span")?.innerText?.trim() ||
            el.querySelector("h2 a span")?.innerText?.trim();

          const priceWhole = el.querySelector(".a-price-whole")?.innerText;
          const price = priceWhole
            ? Number(priceWhole.replace(/[,\.]/g, ""))
            : null;

          // ✅ Image
          const image = el.querySelector("img.s-image")?.src || null;

          // ✅ Rating
          const ratingText = el
            .querySelector("span.a-icon-alt")
            ?.innerText?.trim();
          const rating = ratingText
            ? parseFloat(ratingText.split(" ")[0])
            : null;

          // ✅ URL
          const relUrl = el
            .querySelector("a.a-link-normal[href*='/dp/']")
            ?.getAttribute("href");
          const url = relUrl
            ? `https://www.amazon.in${relUrl.split("?")[0]}`
            : null;

          if (name && price && !seen.has(name)) {
            seen.add(name);
            items.push({
              name,
              price,
              image,
              rating: isNaN(rating) ? null : rating, // ✅
              url,
              website: "Amazon",
            });
          }
        });

      return items;
    });

    console.log("AMAZON PRODUCTS:", products.length);
    await browser.close();
    return products;

  } catch (err) {
    console.log("AMAZON ERROR:", err.message);
    await browser.close();
    return [];
  }
};

module.exports = scrapeAmazon;