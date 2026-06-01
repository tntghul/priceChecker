const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({

    productName:{
        type:String,
        required:true
    },

    searchedAt:{
        type:Date,
        default:Date.now
    }

});

module.exports=mongoose.model(
'SearchHistory',
searchHistorySchema
);