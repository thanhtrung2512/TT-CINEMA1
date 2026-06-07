const express = require('express');
const router = express.Router();
const voucherController = require('../controller/voucher.controller');
const { authAdmin, authUser, asyncHandler } = require('../auth/checkAuth');

// Routes cho User (Booking)
router.post('/apply', authUser, asyncHandler(voucherController.applyVoucher));
router.get('/active', asyncHandler(voucherController.getActiveVouchers));

// Routes cho Admin (CRUD)
router.post('/', authAdmin, asyncHandler(voucherController.createVoucher));
router.get('/', authAdmin, asyncHandler(voucherController.getAllVouchers));
router.get('/:id', authAdmin, asyncHandler(voucherController.getVoucherById));
router.put('/:id', authAdmin, asyncHandler(voucherController.updateVoucher));
router.delete('/:id', authAdmin, asyncHandler(voucherController.deleteVoucher));

module.exports = router;
