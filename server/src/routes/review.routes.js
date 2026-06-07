const express = require('express');
const router = express.Router();
const reviewController = require('../controller/review.controller');
const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

// Admin: Lấy tất cả bình luận
router.get('/all', authAdmin, asyncHandler(reviewController.getAllReviews));

// Public: Lấy danh sách review của 1 phim
router.get('/movie/:movieId', asyncHandler(reviewController.getReviewsByMovie));

// Protected: Lấy danh sách review của user hiện tại
router.get('/me', authUser, asyncHandler(reviewController.getMyReviews));

// Protected: Thêm review mới
router.post('/:movieId', authUser, asyncHandler(reviewController.createReview));

// Admin: Xóa review (nếu vi phạm)
router.delete('/:id', authAdmin, asyncHandler(reviewController.deleteReview));

module.exports = router;
