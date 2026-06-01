const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    email:       { type: String, required: true },
    status:      { type: String, enum: ["active", "triggered", "deleted"], default: "active" },
    lowestPrice: { type: Number, default: null },
    lowestSite:  { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);
