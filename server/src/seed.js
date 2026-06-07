const mongoose = require('mongoose');
const Category = require('./models/category.model');
require('dotenv').config({ path: '../.env' }); // Load .env file

const categories = [
    { categoryName: 'Hành động' },
    { categoryName: 'Viễn tưởng' },
    { categoryName: 'Tâm lý' },
    { categoryName: 'Kinh dị' },
    { categoryName: 'Hài hước' },
    { categoryName: 'Phiêu lưu' },
    { categoryName: 'Hoạt hình' },
    { categoryName: 'Lãng mạn' },
    { categoryName: 'Tài liệu' },
    { categoryName: 'Gia đình' },
    { categoryName: 'Trinh thám' },
    { categoryName: 'Giật gân' }
];

async function seedData() {
    try {
        console.log('Đang kết nối MongoDB...');
        await mongoose.connect(process.env.CONNECT_DB || 'mongodb://localhost:27017/movie2', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Kết nối thành công!');

        console.log('Đang xóa dữ liệu cũ (nếu có)...');
        await Category.deleteMany({});

        console.log('Đang tạo 12 danh mục mới...');
        await Category.insertMany(categories);
        console.log('Thêm danh mục thành công!');

        mongoose.connection.close();
    } catch (error) {
        console.error('Lỗi khi seed data:', error);
        process.exit(1);
    }
}

seedData();
