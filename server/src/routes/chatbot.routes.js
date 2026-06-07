const express = require('express');
const router = express.Router();
const chatbotController = require('../controller/chatbot.controller');
const { authUser, authOptional, asyncHandler } = require('../auth/checkAuth');

// Public — chat không cần đăng nhập (lưu theo sessionId)
// Có đăng nhập → middleware gắn req.user nếu token hợp lệ (optional auth)
router.post('/chat', authOptional, asyncHandler(chatbotController.chat));

// Các route bên dưới yêu cầu đăng nhập
router.get('/sessions',           authUser, asyncHandler(chatbotController.getMySessions));

// Chi tiết session cho phép public nếu có ID hợp lệ (để hỗ trợ khách xem lại lịch sử sau f5)
router.get('/sessions/:id',       authOptional, asyncHandler(chatbotController.getSession));
router.delete('/sessions/:id',    authUser, asyncHandler(chatbotController.deleteSession));

module.exports = router;
