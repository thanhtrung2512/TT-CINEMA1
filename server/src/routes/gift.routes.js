const express = require('express');
const router = express.Router();
const giftController = require('../controller/gift.controller');
const { authAdmin, authUser, asyncHandler } = require('../auth/checkAuth');

// User: xem quà của mình
router.get('/my-gifts', authUser, asyncHandler(giftController.getMyGifts));

// Admin: CRUD
router.post('/', authAdmin, asyncHandler(giftController.createGift));
router.get('/', authAdmin, asyncHandler(giftController.getAllGifts));
router.get('/:id', authAdmin, asyncHandler(giftController.getGiftById));
router.put('/:id', authAdmin, asyncHandler(giftController.updateGift));
router.delete('/:id', authAdmin, asyncHandler(giftController.deleteGift));

module.exports = router;
