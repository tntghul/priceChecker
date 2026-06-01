const axios = require('axios');

const getProducts = async (query) => {

    try {

        // Yahan future me product source/API call jayega
        // const response = await axios.get(...)

        return [

            {
                name: query,
                website: "Amazon",
                price: 79999
            },

            {
                name: query,
                website: "Flipkart",
                price: 77999
            },

            {
                name: query,
                website: "Croma",
                price: 78500
            }

        ];

    } catch(error){

        console.log(error);
        return [];
    }
};

module.exports = getProducts;