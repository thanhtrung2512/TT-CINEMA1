const express = require('express');
const router = express.Router();
const paymentController = require('../controller/payment.controller');
const { authUser, asyncHandler } = require('../auth/checkAuth');

// Routes người dùng (cần đăng nhập)
router.post('/momo', authUser, asyncHandler(paymentController.createMomoPayment));
router.post('/momo/resume/:bookingId', authUser, asyncHandler(paymentController.resumeMomoPayment));
router.post('/vnpay', authUser, asyncHandler(paymentController.createVNPayPayment));
router.post('/mock', authUser, asyncHandler(paymentController.createMockPayment));

// Callback từ cổng thanh toán (KHÔNG cần auth)
router.post('/momo/callback', asyncHandler(paymentController.momoCallback));
router.get('/vnpay/callback', asyncHandler(paymentController.vnpayCallback));

// Client xác nhận kết quả sau khi redirect (cần auth)
router.post('/momo/confirm-return', authUser, asyncHandler(paymentController.confirmMomoReturn));
router.post('/vnpay/confirm-return', authUser, asyncHandler(paymentController.confirmVNPayReturn));

module.exports = router;
