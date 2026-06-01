const cron           = require("node-cron");
const Alert          = require("../models/Alert");
const scrapeCroma    = require("../services/cromaService");
const scrapeFlipkart = require("../services/flipkartService");
const scrapeAmazon   = require("../services/scrapeService");
const { sendPriceAlert } = require("../utils/mailer");

const checkPrices = async () => {
  console.log(`[CRON] Price check started at ${new Date().toLocaleTimeString("en-IN")}`);

  // Sirf active alerts fetch karo
  const alerts = await Alert.find({ status: "active" });

  if (alerts.length === 0) {
    console.log("[CRON] No active alerts.");
    return;
  }

  for (const alert of alerts) {
    try {
      console.log(`[CRON] Checking: "${alert.productName}" | Target: Rs.${alert.targetPrice}`);

      // Teeno sites se parallel scrape
      const [cromaRes, flipkartRes, amazonRes] = await Promise.allSettled([
        scrapeCroma(alert.productName),
        scrapeFlipkart(alert.productName),
        scrapeAmazon(alert.productName),
      ]);

      const allProducts = [
        ...(cromaRes.status    === "fulfilled" ? cromaRes.value    : []),
        ...(flipkartRes.status === "fulfilled" ? flipkartRes.value : []),
        ...(amazonRes.status   === "fulfilled" ? amazonRes.value   : []),
      ].filter((p) => p.price > 0);

      if (allProducts.length === 0) {
        console.log(`[CRON] No products found for: ${alert.productName}`);
        continue;
      }

      // Sabse sasta dhundo
      const cheapest = allProducts.reduce((min, p) => p.price < min.price ? p : min);
      console.log(`[CRON] Lowest: Rs.${cheapest.price} on ${cheapest.website}`);

      if (cheapest.price <= alert.targetPrice) {
        console.log(`[CRON] TRIGGERED for: ${alert.productName}`);

        // Email bhejo
        await sendPriceAlert({
          to:           alert.email,
          productName:  alert.productName,
          targetPrice:  alert.targetPrice,
          currentPrice: cheapest.price,
          site:         cheapest.website,
          url:          cheapest.url,
        });

        // DB update
        await Alert.findByIdAndUpdate(alert._id, {
          status:      "triggered",
          lowestPrice: cheapest.price,
          lowestSite:  cheapest.website,
        });

        console.log(`[CRON] Alert triggered and updated: ${alert._id}`);
      } else {
        console.log(`[CRON] Not triggered. Rs.${cheapest.price} > Rs.${alert.targetPrice}`);
      }

    } catch (err) {
      console.error(`[CRON] Error for alert ${alert._id}:`, err.message);
    }
  }

  console.log("[CRON] Check complete.");
};

// Har 30 minute mein run
const startCron = () => {
  cron.schedule("*/30 * * * *", checkPrices);
  console.log("[CRON] Scheduled — runs every 30 minutes.");
};

module.exports = { startCron, checkPrices };
