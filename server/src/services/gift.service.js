const Gift = require('../models/gift.model');
const UserGift = require('../models/userGift.model');
const Voucher = require('../models/voucher.model');
const Booking = require('../models/booking.model');
const moment = require('moment');

class GiftService {
    // ─── ADMIN: CRUD ────────────────────────────────────────────────

    async createGift(data) {
        return await Gift.create(data);
    }

    async getAllGifts() {
        return await Gift.find().sort({ createdAt: -1 });
    }

    async getGiftById(id) {
        const gift = await Gift.findById(id);
        if (!gift) throw new Error('Không tìm thấy chương trình quà tặng');
        return gift;
    }

    async updateGift(id, data) {
        const gift = await Gift.findByIdAndUpdate(id, data, { new: true });
        if (!gift) throw new Error('Không tìm thấy chương trình quà tặng');
        return gift;
    }

    async deleteGift(id) {
        const gift = await Gift.findByIdAndDelete(id);
        if (!gift) throw new Error('Không tìm thấy chương trình quà tặng');
        return { message: 'Đã xóa chương trình quà tặng' };
    }

    // ─── USER: Xem quà của mình ─────────────────────────────────────

    async getMyGifts(userId) {
        return await UserGift.find({ userId })
            .populate('giftId', 'name image rewardType description triggerType')
            .populate('voucherId', 'code discountType discountValue validTo minOrderValue')
            .populate('bookingId', 'totalPrice createdAt')
            .sort({ createdAt: -1 });
    }

    // ─── CORE: Trao quà sau khi đơn hàng hoàn thành ─────────────────

    /**
     * Điểm vào chính — gọi sau khi Booking chuyển sang "Paid"
     */
    async processGiftsForBooking(booking) {
        const now = new Date();

        const activeGifts = await Gift.find({
            isActive: true,
            $or: [{ startDate: null }, { startDate: { $lte: now } }],
            $and: [
                { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
            ],
        });

        const awarded = [];

        for (const gift of activeGifts) {
            // Kiểm tra giới hạn tổng
            if (gift.totalLimit > 0 && gift.issuedCount >= gift.totalLimit) continue;

            let eligible = false;

            // ── Kiểm tra điều kiện theo triggerType ──────────────────
            if (gift.triggerType === 'per_order') {
                // Mỗi đơn đủ điều kiện → tặng
                eligible = booking.totalPrice >= gift.minOrderAmount;

            } else if (gift.triggerType === 'nth_booking') {
                // Sau N lần đặt thành công (tính cả lần này)
                const count = await Booking.countDocuments({
                    userId: booking.userId,
                    status: 'Paid',
                });
                eligible = count === gift.nthBooking;
                // Chỉ tặng đúng lần thứ N, không tặng lại
                if (eligible) {
                    const alreadyGot = await UserGift.findOne({
                        userId: booking.userId,
                        giftId: gift._id,
                    });
                    if (alreadyGot) eligible = false;
                }

            } else if (gift.triggerType === 'cumulative_spend') {
                // Tổng chi tiêu tích lũy vượt mốc → tặng 1 lần
                const alreadyGot = await UserGift.findOne({
                    userId: booking.userId,
                    giftId: gift._id,
                });
                if (!alreadyGot) {
                    const totalSpent = await Booking.aggregate([
                        { $match: { userId: booking.userId, status: 'Paid' } },
                        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
                    ]);
                    const spent = totalSpent[0]?.total || 0;
                    eligible = spent >= gift.minOrderAmount;
                }
            }

            if (!eligible) continue;

            // ── Tặng quà ────────────────────────────────────────────
            try {
                let voucherId = null;

                if (gift.rewardType === 'voucher') {
                    const cfg = gift.voucherConfig;
                    const code = `GIFT${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
                    const validTo = moment().add(cfg.validDays || 30, 'days').toDate();

                    const newVoucher = await Voucher.create({
                        code,
                        discountType:  cfg.discountType,
                        discountValue: cfg.discountValue,
                        maxDiscount:   cfg.maxDiscount || 0,
                        minOrderValue: cfg.minOrderValue || 0,
                        validFrom: now,
                        validTo,
                        usageLimit: 1,
                        usedCount: 0,
                        isActive: true,
                    });
                    voucherId = newVoucher._id;
                }

                await UserGift.create({
                    userId: booking.userId,
                    giftId: gift._id,
                    bookingId: booking._id,
                    voucherId,
                    status: 'sent',
                    giftSnapshot: {
                        name:          gift.name,
                        rewardType:    gift.rewardType,
                        triggerType:   gift.triggerType,
                        discountType:  gift.voucherConfig?.discountType,
                        discountValue: gift.voucherConfig?.discountValue,
                        validDays:     gift.voucherConfig?.validDays,
                    },
                });

                await Gift.findByIdAndUpdate(gift._id, { $inc: { issuedCount: 1 } });
                awarded.push(gift.name);

            } catch (err) {
                if (err.code !== 11000) {
                    console.error('[Gift] Award error:', err.message);
                }
            }
        }

        return awarded;
    }
}

module.exports = new GiftService();
