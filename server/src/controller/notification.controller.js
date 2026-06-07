const { OK } = require('../core/success.response');
const NotificationService = require('../services/notification.service');

class NotificationController {
    // GET /api/notifications — Lấy danh sách thông báo
    async getNotifications(req, res) {
        const userId = req.user.id;
        const notifications = await NotificationService.getNotifications(userId);
        const unreadCount = await NotificationService.countUnread(userId);
        return new OK({
            message: 'Lấy thông báo thành công',
            metadata: { notifications, unreadCount },
        }).send(res);
    }

    // PATCH /api/notifications/:id/read — Đánh dấu đã đọc 1 thông báo
    async markAsRead(req, res) {
        const userId = req.user.id;
        const notif = await NotificationService.markAsRead(req.params.id, userId);
        return new OK({ message: 'Đã đọc thông báo', metadata: notif }).send(res);
    }

    // PATCH /api/notifications/read-all — Đánh dấu tất cả đã đọc
    async markAllAsRead(req, res) {
        const userId = req.user.id;
        await NotificationService.markAllAsRead(userId);
        return new OK({ message: 'Đã đánh dấu tất cả đã đọc' }).send(res);
    }

    // DELETE /api/notifications/:id — Xóa thông báo
    async deleteNotification(req, res) {
        const userId = req.user.id;
        await NotificationService.deleteNotification(req.params.id, userId);
        return new OK({ message: 'Đã xóa thông báo' }).send(res);
    }
}

module.exports = new NotificationController();
