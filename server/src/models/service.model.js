const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema(
    {
        name: { type: String, required: true }, // VD: Combo 1 Bắp 1 Nước
        description: { type: String, default: '' },
        price: { type: Number, required: true },
        imageUrl: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('service', serviceSchema);
