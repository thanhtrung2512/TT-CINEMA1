const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        movieId: { type: Schema.Types.ObjectId, ref: 'movie', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        isVerified: { type: Boolean, default: false } // Đã mua vé xem phim này chưa
    },
    { timestamps: true }
);

module.exports = mongoose.model('review', reviewSchema);
