const ReviewService = require('../services/review.service');
const { OK } = require('../core/success.response');

class ReviewController {
    async createReview(req, res) {
        const userId = req.user.id;
        const { movieId } = req.params;
        const data = req.body;

        const review = await ReviewService.createReview(userId, movieId, data);
        new OK({ message: 'Đánh giá thành công', metadata: review }).send(res);
    }

    async getReviewsByMovie(req, res) {
        const { movieId } = req.params;
        const result = await ReviewService.getReviewsByMovie(movieId);
        new OK({ message: 'Lấy danh sách đánh giá thành công', metadata: result }).send(res);
    }

    async deleteReview(req, res) {
        const { id } = req.params;
        await ReviewService.deleteReview(id);
        new OK({ message: 'Xóa đánh giá thành công' }).send(res);
    }

    async getMyReviews(req, res) {
        const userId = req.user.id;
        const reviews = await ReviewService.getMyReviews(userId);
        new OK({ message: 'Lấy đánh giá cá nhân thành công', metadata: reviews }).send(res);
    }

    async getAllReviews(req, res) {
        const reviews = await ReviewService.getAllReviews();
        new OK({ message: 'Lấy tất cả bình luận thành công', metadata: reviews }).send(res);
    }
}

module.exports = new ReviewController();
