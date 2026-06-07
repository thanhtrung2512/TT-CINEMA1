const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'user', required: false },
        showtimeId: { type: Schema.Types.ObjectId, ref: 'showtime', required: true },
        
        // Danh sách các ghế đã chọn (Mã ghế: A1, A2...)
        seats: [{ type: String, required: true }],
        
        // Danh sách bắp nước đi kèm
        services: [
            {
                serviceId: { type: Schema.Types.ObjectId, ref: 'service' },
                quantity: { type: Number, default: 1 }
            }
        ],
        
        // Tổng tiền (Vé + Bắp nước)
        totalPrice: { type: Number, required: true },
        
        // Thông tin mã giảm giá (nếu có)
        voucherId: { type: Schema.Types.ObjectId, ref: 'voucher' },
        discountAmount: { type: Number, default: 0 },
        
        paymentMethod: { type: String, enum: ['Cash', 'VNPay', 'Momo', 'MockPayment'], default: 'Cash' },
        paymentTransactionId: { type: String, default: null }, // Mã giao dịch từ Momo/VNPay
        
        status: { type: String, enum: ['Pending', 'Paid', 'Cancelled', 'CheckedIn'], default: 'Pending' },

        employeeId: { type: Schema.Types.ObjectId, ref: 'user', default: null }, // Người bán vé tại quầy
        checkedInBy: { type: Schema.Types.ObjectId, ref: 'user', default: null } // Người soát vé (quét QR)
    },
    { timestamps: true }
);

module.exports = mongoose.model('booking', bookingSchema);
