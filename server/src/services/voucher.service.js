const Voucher = require('../models/voucher.model');

class VoucherService {
    async createVoucher(data) {
        return await Voucher.create(data);
    }

    async getAllVouchers() {
        return await Voucher.find().sort({ createdAt: -1 });
    }

    async getActiveVouchers() {
        const now = new Date();
        return await Voucher.find({
            isActive: true,
            validFrom: { $lte: now },
            validTo: { $gte: now },
            $expr: { $lt: ["$usedCount", "$usageLimit"] }
        }).sort({ minOrderValue: 1 });
    }

    async getVoucherById(id) {
        return await Voucher.findById(id);
    }

    async updateVoucher(id, data) {
        return await Voucher.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteVoucher(id) {
        return await Voucher.findByIdAndDelete(id);
    }

    async applyVoucher(code, orderValue) {
        const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });

        if (!voucher) throw new Error('Mã giảm giá không tồn tại hoặc đã bị khóa');

        const now = new Date();
        if (now < voucher.validFrom) throw new Error('Mã giảm giá chưa đến thời gian áp dụng');
        if (now > voucher.validTo) throw new Error('Mã giảm giá đã hết hạn');

        if (voucher.usedCount >= voucher.usageLimit) throw new Error('Mã giảm giá đã hết lượt sử dụng');
        if (orderValue < voucher.minOrderValue) throw new Error(`Đơn hàng tối thiểu để áp dụng là ${voucher.minOrderValue.toLocaleString('vi-VN')}đ`);

        let discountAmount = 0;
        if (voucher.discountType === 'fixed') {
            discountAmount = voucher.discountValue;
        } else if (voucher.discountType === 'percent') {
            discountAmount = (orderValue * voucher.discountValue) / 100;
            if (voucher.maxDiscount > 0 && discountAmount > voucher.maxDiscount) {
                discountAmount = voucher.maxDiscount;
            }
        }

        return { discountAmount, voucherId: voucher._id };
    }
}
module.exports = new VoucherService();
