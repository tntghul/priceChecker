const express = require("express");
const router  = express.Router();
const Alert   = require("../models/Alert");
const { checkPrices } = require("../jobs/priceChecker");

// POST /api/alerts — naya alert set karo
router.post("/", async (req, res) => {
  try {
    const { productName, targetPrice, email } = req.body;

    if (!productName || !targetPrice || !email)
      return res.status(400).json({ error: "productName, targetPrice, email required" });

    const alert = await Alert.create({ productName, targetPrice, email });
    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts — saare alerts (deleted ke bina)
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find({ status: { $ne: "deleted" } }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alerts/:id — alert soft delete
router.delete("/:id", async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, { status: "deleted" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/test-run — manually cron chalao (dev ke liye)
router.post("/test-run", async (req, res) => {
  try {
    await checkPrices();
    res.json({ success: true, message: "Price check complete" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
