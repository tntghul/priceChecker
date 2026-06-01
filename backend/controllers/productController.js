const Product = require('../models/Product');

const SearchHistory = require('../models/SearchHistory');

const scrapeAmazon = require("../services/scrapeService");
const scrapeFlipkart = require("../services/flipkartService");
const scrapeCroma = require("../services/cromaService");


// Add Product
const createProduct = async (req, res) => {

  try {

    const product = await Product.create(req.body);

    res.status(201).json(product);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// Search Product (MULTI WEBSITE)
const searchProduct = async (req, res) => {

  try {

    const query = req.query.name;

     console.log("🔍 SEARCH QUERY:", query);

    // save history
    await SearchHistory.create({
      productName: query
    });

    // 🔥 PARALLEL SCRAPING
    const [amazonProducts, flipkartProducts, cromaProducts] =
      await Promise.all([
        scrapeAmazon(query),
        scrapeFlipkart(query),
        scrapeCroma(query)
      ]);

        // 👇 DEBUG LOGS (IMPORTANT)
  

    // combine all
    const allProducts = [
      ...amazonProducts,
      ...flipkartProducts,
      ...cromaProducts
    ];

console.log("📦 AMAZON:", amazonProducts.length);
console.log("📦 FLIPKART:", flipkartProducts.length);
console.log("📦 CROMA:", cromaProducts.length);
console.log("📦 TOTAL:", allProducts.length);
  console.log("✅ TOTAL PRODUCTS:", allProducts.length);

    // best deal
    const bestDeal = allProducts.reduce(
      (min, item) =>
        item.price < min.price ? item : min
    );

    res.json({
      products: allProducts,
      bestDeal
    });

  } catch (error) {

  console.error("❌ SEARCH ERROR:", error);

  res.status(500).json({
    message: error.message
  });

}

};

module.exports = {
  createProduct,
  searchProduct
};