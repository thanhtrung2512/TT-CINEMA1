const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Movie = require('./models/movies.model');
const User = require('./models/users.model');
const Gift = require('./models/gift.model');
const Service = require('./models/service.model');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONNECT_URL = process.env.CONNECT_DB || 'mongodb://127.0.0.1:27017/movie2';
const UPLOAD_DIR_MOVIES = path.join(__dirname, 'uploads', 'movies');

async function fixAllImages() {
    try {
        console.log('🔗 Đang kết nối MongoDB...');
        await mongoose.connect(CONNECT_URL);
        console.log('✅ Kết nối MongoDB thành công!');

        // 1. Quét danh sách file ảnh trên đĩa
        console.log('📁 Đang quét danh sách ảnh trên đĩa...');
        if (!fs.existsSync(UPLOAD_DIR_MOVIES)) {
            console.error('❌ Thư mục ảnh movies không tồn tại!');
            process.exit(1);
        }

        const files = fs.readdirSync(UPLOAD_DIR_MOVIES);
        const diskPosters = files.filter(f => f.toLowerCase().includes('poster') && f.match(/\.(jpg|jpeg|png|webp)$/i));
        const diskBackdrops = files.filter(f => f.toLowerCase().includes('backdrop') && f.match(/\.(jpg|jpeg|png|webp)$/i));

        console.log(`🔍 Tìm thấy trên đĩa: ${diskPosters.length} ảnh poster và ${diskBackdrops.length} ảnh backdrop.`);

        if (diskPosters.length === 0 || diskBackdrops.length === 0) {
            console.error('❌ Không tìm thấy ảnh poster hoặc backdrop nào trên đĩa để gán!');
            process.exit(1);
        }

        // 2. Sửa ảnh Phim (Movies)
        console.log('\n🎬 Bắt đầu sửa ảnh cho Phim...');
        const movies = await Movie.find();
        let moviesUpdated = 0;

        for (const movie of movies) {
            let changed = false;

            // Kiểm tra Poster
            let posterExists = false;
            if (movie.posterUrl) {
                const filename = path.basename(movie.posterUrl);
                const fullPath = path.join(UPLOAD_DIR_MOVIES, filename);
                if (fs.existsSync(fullPath)) {
                    posterExists = true;
                }
            }

            if (!posterExists) {
                const randomPoster = diskPosters[Math.floor(Math.random() * diskPosters.length)];
                movie.posterUrl = `/uploads/movies/${randomPoster}`;
                console.log(`  [POSTER] Gán ảnh mới cho phim: "${movie.title}" -> ${movie.posterUrl}`);
                changed = true;
            }

            // Kiểm tra Backdrop
            let backdropExists = false;
            if (movie.backdropUrl) {
                const filename = path.basename(movie.backdropUrl);
                const fullPath = path.join(UPLOAD_DIR_MOVIES, filename);
                if (fs.existsSync(fullPath)) {
                    backdropExists = true;
                }
            }

            if (!backdropExists) {
                const randomBackdrop = diskBackdrops[Math.floor(Math.random() * diskBackdrops.length)];
                movie.backdropUrl = `/uploads/movies/${randomBackdrop}`;
                console.log(`  [BACKDROP] Gán ảnh mới cho phim: "${movie.title}" -> ${movie.backdropUrl}`);
                changed = true;
            }

            if (changed) {
                await movie.save();
                moviesUpdated++;
            }
        }
        console.log(`✅ Hoàn thành sửa ảnh Phim. Đã cập nhật ${moviesUpdated}/${movies.length} phim.`);

        // 3. Sửa ảnh Người dùng (Users)
        console.log('\n👤 Bắt đầu sửa ảnh đại diện cho Người dùng...');
        const users = await User.find();
        let usersUpdated = 0;

        for (const user of users) {
            if (!user.avatar) {
                user.avatar = '/uploads/avatars/1778659826843.webp';
                await user.save();
                usersUpdated++;
                console.log(`  [AVATAR] Đã gán avatar mặc định cho người dùng: "${user.fullName}" (${user.email})`);
            }
        }
        console.log(`✅ Hoàn thành sửa avatar Người dùng. Đã cập nhật ${usersUpdated}/${users.length} tài khoản.`);

        // 4. Sửa ảnh Chương trình Quà tặng (Gifts)
        console.log('\n🎁 Bắt đầu sửa ảnh cho các Chương trình Quà tặng...');
        const gifts = await Gift.find();
        let giftsUpdated = 0;

        for (const gift of gifts) {
            if (!gift.image) {
                // Gán hình ảnh tương ứng theo triggerType để đẹp mắt
                if (gift.triggerType === 'nth_booking') {
                    gift.image = '/uploads/services/combo.png';
                } else if (gift.triggerType === 'cumulative_spend') {
                    gift.image = '/uploads/services/combo.png';
                } else {
                    gift.image = '/uploads/services/popcorn.png';
                }
                await gift.save();
                giftsUpdated++;
                console.log(`  [GIFT] Đã gán ảnh minh họa cho quà tặng: "${gift.name}" -> ${gift.image}`);
            }
        }
        console.log(`✅ Hoàn thành sửa ảnh Quà tặng. Đã cập nhật ${giftsUpdated}/${gifts.length} chương trình.`);

        // 5. Sửa ảnh Dịch vụ (Services)
        console.log('\n🍿 Bắt đầu kiểm tra ảnh dịch vụ bắp nước...');
        const services = await Service.find();
        let servicesUpdated = 0;

        for (const service of services) {
            if (!service.imageUrl) {
                service.imageUrl = '/uploads/services/popcorn.png';
                await service.save();
                servicesUpdated++;
                console.log(`  [SERVICE] Đã gán ảnh dịch vụ: "${service.name}" -> ${service.imageUrl}`);
            }
        }
        console.log(`✅ Hoàn thành sửa ảnh Dịch vụ. Đã cập nhật ${servicesUpdated}/${services.length} dịch vụ.`);

        console.log('\n🎉 Hoàn thành quá trình sửa đổi và bổ sung ảnh xịn xò thành công!');
        mongoose.connection.close();
    } catch (err) {
        console.error('💥 Lỗi nghiêm trọng:', err);
        mongoose.connection.close();
        process.exit(1);
    }
}

fixAllImages();
