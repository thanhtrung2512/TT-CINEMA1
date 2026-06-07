const mongoose = require('mongoose');

/**
 * UserGift — Lịch sử quà tặng đã được phát cho người dùng
 */
const userGiftSchema = new mongoose.Schema(
    {
        userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'user',    required: true },
        giftId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Gift',    required: true },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },

        // Nếu quà là voucher → lưu ID voucher đã tạo cho user này
        voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'voucher', default: null },

        status: {
            type: String,
            enum: ['pending', 'sent', 'failed'],
            default: 'sent',
        },

        // Snapshot thông tin quà tại thời điểm trao (để tránh mất data nếu gift bị xóa)
        giftSnapshot: {
            name:           { type: String },
            rewardType:     { type: String },
            discountType:   { type: String },
            discountValue:  { type: Number },
            validDays:      { type: Number },
        },
    },
    { timestamps: true }
);

// Index để tránh tặng quà 2 lần cho cùng 1 đơn hàng + cùng 1 gift
userGiftSchema.index({ bookingId: 1, giftId: 1 }, { unique: true });

module.exports = mongoose.model('UserGift', userGiftSchema);
