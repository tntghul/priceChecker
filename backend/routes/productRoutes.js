const express = require('express');

const router = express.Router();

const SearchHistory = require('../models/SearchHistory');

const {
    createProduct,
    searchProduct
} = require('../controllers/productController');


// Add Product
router.post('/add', createProduct);


// Search Product
router.get('/search', searchProduct);


// Search History
router.get('/history', async (req, res) => {

    try {

        const history = await SearchHistory.find()
        .sort({ searchedAt: -1 });

        res.json(history);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

});

module.exports = router;