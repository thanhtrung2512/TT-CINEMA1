const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const showtimeSchema = new Schema(
    {
        movieId: { type: Schema.Types.ObjectId, ref: 'movie', required: true },
        roomId: { type: Schema.Types.ObjectId, ref: 'room', required: true },
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        price: { type: Number, required: true }, // Giá vé cơ bản
        
        // Trạng thái ghế trong suất chiếu này (được clone từ room.seatLayout)
        seats: [
            {
                row: { type: String, required: true },
                number: { type: Number, required: true },
                type: { type: String, enum: ['Thuong', 'VIP', 'Sweetbox'], default: 'Thuong' },
                status: { type: String, enum: ['Available', 'Booked', 'Holding', 'Maintenance'], default: 'Available' },
                userId: { type: Schema.Types.ObjectId, ref: 'users', default: null } // User nào đang giữ/mua
            }
        ]
    },
    { timestamps: true }
);

module.exports = mongoose.model('showtime', showtimeSchema);
