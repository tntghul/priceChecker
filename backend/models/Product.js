const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    productName: {
        type: String,
        required: true
    },

    brand: {
        type: String
    },

    price: {
        type: Number,
        required: true
    },

    website: {
        type: String
    },

    image: {
        type: String
    },

    rating: {
        type: Number
    }

}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;