const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Movie = require('./models/movies.model');
const Category = require('./models/category.model');
require('dotenv').config({ path: '../.env' });

const uploadDir = path.join(__dirname, 'uploads', 'movies');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

async function downloadImage(url, filename) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return '';
    try {
        const filePath = path.join(uploadDir, filename);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        
        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(`/uploads/movies/${filename}`));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Lỗi tải ảnh ${url}:`, error.message);
        return '';
    }
}

async function seedData() {
    try {
        console.log('Đang kết nối MongoDB...');
        await mongoose.connect(process.env.CONNECT_DB || 'mongodb://localhost:27017/movie2', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Kết nối thành công!');

        // Lấy danh sách thể loại để random
        const categories = await Category.find();
        if (categories.length === 0) {
            console.log('Không có thể loại nào. Vui lòng chạy seed danh mục trước.');
            process.exit(1);
        }

        console.log('Đang lấy danh sách phim từ API...');
        const response = await axios.get('https://vsmov.com/api/danh-sach/phim-moi-cap-nhat?page=2');
        const items = response.data.items || response.data.data?.items || response.data; // Tùy cấu trúc
        
        // Tìm mảng items thực sự
        let moviesList = [];
        if (Array.isArray(items)) moviesList = items;
        else if (response.data && Array.isArray(response.data)) moviesList = response.data;
        // Trích xuất từ JSON chuỗi (đề phòng)
        for (let key in response.data) {
             if (Array.isArray(response.data[key])) {
                 moviesList = response.data[key];
                 break;
             }
        }

        if (moviesList.length === 0) {
            console.log('Không tìm thấy danh sách phim trong API.');
            process.exit(1);
        }

        console.log(`Tìm thấy ${moviesList.length} phim. Bắt đầu xử lý...`);

        // Xử lý toàn bộ phim trong trang
        const moviesToProcess = moviesList;

        for (let i = 0; i < moviesToProcess.length; i++) {
            const item = moviesToProcess[i];
            console.log(`[${i + 1}/${moviesToProcess.length}] Đang xử lý: ${item.name}...`);

            // Random 2 thể loại
            const randomCategories = [
                categories[Math.floor(Math.random() * categories.length)]._id,
                categories[Math.floor(Math.random() * categories.length)]._id
            ];

            // Tải ảnh
            const timestamp = Date.now() + i;
            let posterUrl = '';
            let backdropUrl = '';
            
            if (item.poster_url && typeof item.poster_url === 'string') {
                const ext = path.extname(item.poster_url).split('?')[0] || '.jpg';
                posterUrl = await downloadImage(item.poster_url, `poster_${timestamp}${ext}`);
            }
            if (item.thumb_url && typeof item.thumb_url === 'string') {
                const ext = path.extname(item.thumb_url).split('?')[0] || '.jpg';
                backdropUrl = await downloadImage(item.thumb_url, `backdrop_${timestamp}${ext}`);
            }

            // Tạo biến thể (details) kiểu mảng name/value
            const details = [
                { name: 'Tên gốc', value: item.origin_name || 'Đang cập nhật' },
                { name: 'Năm sản xuất', value: item.year ? item.year.toString() : '2024' },
                { name: 'Đạo diễn', value: 'Christopher Nolan' },
                { name: 'Diễn viên', value: 'Leonardo DiCaprio, Tom Hardy, Cillian Murphy' },
                { name: 'Quốc gia', value: ['Mỹ', 'Hàn Quốc', 'Anh', 'Trung Quốc'][Math.floor(Math.random() * 4)] },
                { name: 'Thời lượng', value: (Math.floor(Math.random() * 60) + 90) + ' phút' },
                { name: 'Ngôn ngữ', value: 'Vietsub + Thuyết minh' },
                { name: 'Chất lượng', value: 'FHD 1080p' }
            ];

            const statusEnum = ['Đang chiếu', 'Sắp chiếu', 'Ngừng chiếu'];

            // Xóa phim cũ nếu trùng slug
            await Movie.deleteOne({ slug: item.slug || item.name.toLowerCase().replace(/ /g, '-') });

            const newMovie = new Movie({
                title: item.name,
                slug: item.slug || item.name.toLowerCase().replace(/ /g, '-'),
                description: `Đây là mô tả cho bộ phim ${item.name}. Phim mang đến những cảnh quay mãn nhãn và cốt truyện hấp dẫn.`,
                posterUrl,
                backdropUrl,
                trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Link bừa
                status: statusEnum[Math.floor(Math.random() * 3)],
                categories: randomCategories,
                details
            });

            await newMovie.save();
            console.log(`-> Thành công: ${item.name}`);
        }

        console.log('Hoàn tất thêm phim từ API!');
        mongoose.connection.close();
    } catch (error) {
        console.error('Lỗi khi seed data:', error);
        process.exit(1);
    }
}

seedData();
