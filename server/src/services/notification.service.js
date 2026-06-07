const Notification = require('../models/notification.model');

class NotificationService {
    /**
     * Tạo một thông báo mới cho người dùng
     */
    async createNotification({ userId, type, title, message, link = null, metadata = {} }) {
        if (!userId) return null;
        const notif = await Notification.create({ userId, type, title, message, link, metadata });
        return notif;
    }

    /**
     * Lấy danh sách thông báo của user (mới nhất trước, giới hạn 30)
     */
    async getNotifications(userId) {
        return Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();
    }

    /**
     * Đếm số thông báo chưa đọc
     */
    async countUnread(userId) {
        return Notification.countDocuments({ userId, isRead: false });
    }

    /**
     * Đánh dấu một thông báo là đã đọc
     */
    async markAsRead(notifId, userId) {
        return Notification.findOneAndUpdate(
            { _id: notifId, userId },
            { isRead: true },
            { new: true }
        );
    }

    /**
     * Đánh dấu TẤT CẢ thông báo của user là đã đọc
     */
    async markAllAsRead(userId) {
        return Notification.updateMany({ userId, isRead: false }, { isRead: true });
    }

    /**
     * Xóa một thông báo
     */
    async deleteNotification(notifId, userId) {
        return Notification.findOneAndDelete({ _id: notifId, userId });
    }

    // ─── Helpers để gọi từ các service khác ─────────────────────────

    async notifyBookingSuccess(userId, booking, movieTitle) {
        return this.createNotification({
            userId,
            type: 'booking_success',
            title: '🎉 Đặt vé thành công!',
            message: `Vé xem phim "${movieTitle}" đã được xác nhận. Ghế: ${(booking.seats || []).join(', ')}. Tổng tiền: ${booking.totalPrice?.toLocaleString()}đ`,
            link: '/user/tickets',
            metadata: { bookingId: booking._id },
        });
    }

    async notifyCheckin(userId, movieTitle, seats) {
        return this.createNotification({
            userId,
            type: 'checkin',
            title: '✅ Soát vé thành công!',
            message: `Vé phim "${movieTitle}" (ghế ${seats.join(', ')}) đã được soát. Chúc bạn xem phim vui vẻ!`,
            link: '/user/tickets',
        });
    }

    async notifyPromotion(userId, title, message, link = '/vouchers') {
        return this.createNotification({ userId, type: 'promotion', title, message, link });
    }
}

module.exports = new NotificationService();
