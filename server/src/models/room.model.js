const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema(
    {
        name: { type: String, required: true }, // VD: Phòng 1, Phòng IMAX
        cinemaId: { type: Schema.Types.ObjectId, ref: 'cinema', required: true },
        capacity: { type: Number, default: 0 },
        // seatLayout lưu sơ đồ ghế của phòng
        // VD: [{ row: 'A', number: 1, type: 'Thuong' }, { row: 'A', number: 2, type: 'VIP' }]
        seatLayout: [
            {
                row: { type: String, required: true }, // A, B, C...
                number: { type: Number, required: true }, // 1, 2, 3...
                type: { type: String, enum: ['Thuong', 'VIP', 'Sweetbox'], default: 'Thuong' }
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('room', roomSchema);
