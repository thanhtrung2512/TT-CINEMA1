const Review = require('../models/review.model');
const Booking = require('../models/booking.model');
const Showtime = require('../models/showtime.model');
const Movie = require('../models/movies.model');
const mongoose = require('mongoose');
const chatbotService = require('./chatbot.service');

class ReviewService {
    async createReview(userId, movieId, data) {
        // Kiểm tra xem user đã từng bình luận phim này chưa
        const existingReview = await Review.findOne({ userId, movieId });
        if (existingReview) {
            throw new Error('Bạn đã đánh giá bộ phim này rồi.');
        }

        // Kiểm tra xem User đã mua vé xem phim này chưa
        let isVerified = false;
        
        // Tìm các booking đã thanh toán của user
        const bookings = await Booking.find({ userId, status: 'Paid' }).populate('showtimeId');
        
        for (const booking of bookings) {
            if (booking.showtimeId && booking.showtimeId.movieId.toString() === movieId) {
                isVerified = true;
                break;
            }
        }

        const review = await Review.create({
            userId,
            movieId,
            rating: data.rating,
            comment: data.comment,
            isVerified
        });

        // Background task: Cập nhật AI Summary nếu số review > 5
        this.updateMovieAISummary(movieId).catch(err => console.error('[AI Summary] Error:', err));

        return review;
    }

    async updateMovieAISummary(movieId) {
        const reviews = await Review.find({ movieId }).select('comment');
        if (reviews.length >= 5) {
            const movie = await Movie.findById(movieId).select('title');
            if (movie) {
                const comments = reviews.map(r => r.comment);
                const aiSummary = await chatbotService.summarizeMovieReviews(movie.title, comments);
                if (aiSummary) {
                    await Movie.findByIdAndUpdate(movieId, { aiSummary });
                    console.log(`[AI Summary] Updated for movie ${movie.title}`);
                }
            }
        }
    }

    async getReviewsByMovie(movieId) {
        const reviews = await Review.find({ movieId })
            .populate('userId', 'fullName avatar')
            .sort({ createdAt: -1 });
            
        // Tính toán số sao trung bình
        let averageRating = 0;
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
            averageRating = (sum / reviews.length).toFixed(1);
        }

        return {
            reviews,
            totalReviews: reviews.length,
            averageRating: parseFloat(averageRating)
        };
    }
    
    async deleteReview(id) {
        return await Review.findByIdAndDelete(id);
    }

    async getMyReviews(userId) {
        return await Review.find({ userId }).sort({ createdAt: -1 });
    }

    async getAllReviews() {
        return await Review.find()
            .populate('userId', 'fullName avatar email')
            .populate('movieId', 'title')
            .sort({ createdAt: -1 });
    }
}

module.exports = new ReviewService();
