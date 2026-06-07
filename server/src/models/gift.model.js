const mongoose = require('mongoose');

/**
 * Gift — Chương trình quà tặng / khuyến mãi tự động
 *
 * triggerType:
 *   'per_order'        → Mỗi đơn hàng đạt minOrderAmount → tặng quà
 *   'nth_booking'      → Sau khi đặt đủ nthBooking lần thành công → tặng quà 1 lần
 *   'cumulative_spend' → Tổng chi tiêu tích lũy ≥ minOrderAmount → tặng quà 1 lần
 *
 * rewardType:
 *   'voucher'  → Tặng mã giảm giá (tạo Voucher tự động)
 */
const giftSchema = new mongoose.Schema(
    {
        // ── Thông tin chương trình ─────────────────────────────────
        name:        { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        image:       { type: String, default: '' },

        // ── Điều kiện kích hoạt ────────────────────────────────────
        triggerType: {
            type: String,
            enum: ['per_order', 'nth_booking', 'cumulative_spend'],
            default: 'per_order',
        },

        /**
         * per_order & cumulative_spend → minOrderAmount là số tiền (VNĐ)
         * nth_booking                  → nthBooking là số lần đặt vé
         */
        minOrderAmount: { type: Number, default: 0 },  // dùng cho per_order / cumulative_spend
        nthBooking:     { type: Number, default: 5 },  // dùng cho nth_booking

        // ── Loại quà và cấu hình ───────────────────────────────────
        rewardType: {
            type: String,
            enum: ['voucher'],
            default: 'voucher',
        },

        voucherConfig: {
            discountType:  { type: String, enum: ['percent', 'fixed'], default: 'percent' },
            discountValue: { type: Number, default: 10 },
            maxDiscount:   { type: Number, default: 0 },   // 0 = không giới hạn
            validDays:     { type: Number, default: 30 },
            minOrderValue: { type: Number, default: 0 },   // Điều kiện dùng voucher này
        },

        // ── Giới hạn phát ─────────────────────────────────────────
        totalLimit:  { type: Number, default: 0 },  // 0 = không giới hạn
        issuedCount: { type: Number, default: 0 },

        // ── Thời gian chương trình ─────────────────────────────────
        startDate: { type: Date, default: null },
        endDate:   { type: Date, default: null },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Gift', giftSchema);
