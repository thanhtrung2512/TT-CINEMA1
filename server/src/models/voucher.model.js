const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const voucherSchema = new Schema(
    {
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        discountType: { type: String, enum: ['percent', 'fixed'], required: true },
        discountValue: { type: Number, required: true }, // % giảm hoặc số tiền giảm thẳng
        
        minOrderValue: { type: Number, default: 0 }, // Giá trị đơn hàng tối thiểu
        maxDiscount: { type: Number, default: 0 }, // Chỉ áp dụng cho 'percent'. 0 là không giới hạn.
        
        validFrom: { type: Date, required: true },
        validTo: { type: Date, required: true },
        
        usageLimit: { type: Number, default: 100 }, // Số lần tối đa mã này được sử dụng
        usedCount: { type: Number, default: 0 }, // Số lần đã sử dụng
        
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('voucher', voucherSchema);
