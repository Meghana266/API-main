// landModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const landSchema = new Schema({
    title: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true },
    area: { type: Number, required: true },
    description: { type: String, required: true },
    contactInfo: { type: String, required: true },
    images: [{ type: String}] // Array of image paths
});

module.exports = mongoose.model('Land', landSchema);

 