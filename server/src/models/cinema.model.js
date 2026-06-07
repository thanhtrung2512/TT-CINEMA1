const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cinemaSchema = new Schema(
    {
        name: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        hotline: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('cinema', cinemaSchema);
