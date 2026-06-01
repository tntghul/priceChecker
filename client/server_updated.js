require("dotenv").config();
const express       = require("express");
const mongoose      = require("mongoose");
const cors          = require("cors");
const { startCron } = require("./jobs/priceChecker");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/alerts",   require("./routes/alerts"));
app.use("/api/products", require("./routes/products"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      startCron();
    });
  })
  .catch((err) => console.error("MongoDB error:", err));
