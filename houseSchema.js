const mongoose = require("mongoose");

const houseSchema = new mongoose.Schema({
    title: String,
    location: String,
    price: Number,
    bedrooms: Number,
    bathrooms: Number,
    squareFootage: Number,
    yearBuilt: Number,
    description: String,
    contactInfo: String,
    images: [String] // Assuming you store image URLs
});

module.exports = mongoose.model("House", houseSchema);


