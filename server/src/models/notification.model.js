const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },

        // Loại thông báo
        type: {
            type: String,
            enum: ['booking_success', 'booking_cancelled', 'checkin', 'promotion', 'system'],
            default: 'system',
        },

        title: { type: String, required: true },
        message: { type: String, required: true },

        // Link điều hướng khi click
        link: { type: String, default: null },

        // Dữ liệu bổ sung (bookingId, movieTitle...)
        metadata: { type: Schema.Types.Mixed, default: {} },

        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('notification', notificationSchema);
