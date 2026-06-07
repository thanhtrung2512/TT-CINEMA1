/**
 * patchMovieCategories.js
 * Gán ngẫu nhiên 1-2 categories cho các phim chưa có categories
 */

const mongoose = require('mongoose');
const Movie = require('./models/movies.model');
const Category = require('./models/category.model');
require('dotenv').config({ path: __dirname + '/../.env' });

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    const dbUri = process.env.CONNECT_DB || 'mongodb://localhost:27017/movie2';
    console.log(`🔗 Kết nối MongoDB: ${dbUri}`);
    await mongoose.connect(dbUri);
    console.log('✅ Kết nối thành công!\n');

    const categories = await Category.find().lean();
    if (categories.length === 0) {
        console.error('❌ Không có thể loại nào. Hãy chạy seed.js trước.');
        process.exit(1);
    }
    console.log(`📂 Tìm thấy ${categories.length} thể loại.`);

    // Lấy tất cả phim chưa có categories
    const movies = await Movie.find({ $or: [{ categories: { $size: 0 } }, { categories: { $exists: false } }] });
    console.log(`🎬 Tìm thấy ${movies.length} phim cần gán thể loại.\n`);

    let updated = 0;
    for (const movie of movies) {
        const catIds = [
            pickRandom(categories)._id,
            pickRandom(categories)._id
        ];
        // Loại trùng
        const uniqueIds = [...new Set(catIds.map(String))].map(id => new mongoose.Types.ObjectId(id));

        await Movie.updateOne({ _id: movie._id }, { $set: { categories: uniqueIds } });
        console.log(`  ✅ [${movie.title}] → ${uniqueIds.length} thể loại`);
        updated++;
    }

    console.log(`\n✅ Đã cập nhật ${updated} phim.`);
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối.');
}

main().catch(err => {
    console.error('💥 Lỗi:', err);
    process.exit(1);
});
