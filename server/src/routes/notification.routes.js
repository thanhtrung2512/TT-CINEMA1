const express = require('express');
const router = express.Router();
const { asyncHandler, authUser } = require('../auth/checkAuth');
const notificationController = require('../controller/notification.controller');

// Tất cả routes đều yêu cầu đăng nhập
router.get('/', authUser, asyncHandler(notificationController.getNotifications));
router.patch('/read-all', authUser, asyncHandler(notificationController.markAllAsRead));
router.patch('/:id/read', authUser, asyncHandler(notificationController.markAsRead));
router.delete('/:id', authUser, asyncHandler(notificationController.deleteNotification));

module.exports = router;
