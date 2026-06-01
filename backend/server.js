const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');
const alerts = require('./routes/alerts');

const connectDB = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Database connect
connectDB();

app.get('/', (req, res) => {
    res.send("Server is running");
});

app.use('/api/products', productRoutes);
app.use("/api/alerts",alerts);


const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

