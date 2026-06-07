const mongoose = require('mongoose');
const Movie = require('./models/movies.model');
const Showtime = require('./models/showtime.model');
require('dotenv').config({ path: __dirname + '/../.env' });

const CONNECT_URL = process.env.CONNECT_DB || 'mongodb://127.0.0.1:27017/movie2';

async function clearOldMovies() {
    try {
        console.log('🔗 Đang kết nối MongoDB...');
        await mongoose.connect(CONNECT_URL);
        console.log('✅ Kết nối MongoDB thành công!');

        console.log('🧹 Đang xóa toàn bộ dữ liệu phim cũ...');
        const moviesResult = await Movie.deleteMany({});
        console.log(`❌ Đã xóa ${moviesResult.deletedCount} phim.`);

        console.log('🧹 Đang xóa toàn bộ suất chiếu cũ...');
        const showtimesResult = await Showtime.deleteMany({});
        console.log(`❌ Đã xóa ${showtimesResult.deletedCount} suất chiếu.`);

        console.log('🎉 Hoàn tất xóa dữ liệu phim và suất chiếu cũ!');
        mongoose.connection.close();
    } catch (err) {
        console.error('💥 Lỗi khi xóa dữ liệu:', err);
        mongoose.connection.close();
        process.exit(1);
    }
}

clearOldMovies();
