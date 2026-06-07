const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./models/service.model');

// Kết nối database
mongoose.connect(process.env.CONNECT_DB || 'mongodb://127.0.0.1:27017/movie2', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Đã kết nối MongoDB để tạo dịch vụ đi kèm...'))
.catch(err => console.error('Lỗi kết nối:', err));

const servicesData = [
    { name: 'Bắp Ngọt', description: 'Bắp rang bơ phủ lớp caramel ngọt lịm', price: 45000, imageUrl: '/uploads/services/popcorn.png' },
    { name: 'Bắp Phô Mai', description: 'Bắp rang bơ lắc phô mai mặn mà đậm vị', price: 49000, imageUrl: '/uploads/services/popcorn.png' },
    { name: 'Nước Ngọt Cola', description: 'Ly Cola mát lạnh cỡ lớn, sảng khoái', price: 35000, imageUrl: '/uploads/services/soda.png' },
    { name: 'Nước Trái Cây', description: 'Nước ép trái cây tươi ngon, thanh mát', price: 40000, imageUrl: '/uploads/services/soda.png' },
    { name: 'Combo Solo', description: 'Dành cho 1 người: 1 Bắp nhỏ (Ngọt/Phô Mai) + 1 Nước', price: 75000, imageUrl: '/uploads/services/combo.png' },
    { name: 'Combo Couple', description: 'Dành cho 2 người: 1 Bắp lớn + 2 Nước', price: 95000, imageUrl: '/uploads/services/combo.png' },
    { name: 'Combo VIP Couple', description: 'Dành cho 2 người: 1 Bắp lớn + 2 Nước + 2 Snack khoai tây', price: 135000, imageUrl: '/uploads/services/combo.png' },
    { name: 'Combo Family', description: 'Dành cho gia đình: 2 Bắp lớn + 4 Nước + 2 Kẹo dẻo', price: 195000, imageUrl: '/uploads/services/combo.png' },
    { name: 'Snack Khoai Tây', description: 'Khoai tây lát mỏng chiên giòn tan', price: 30000, imageUrl: '/uploads/services/snack.png' },
    { name: 'Kẹo Dẻo Trái Cây', description: 'Gói kẹo dẻo gấu mềm dai, hương trái cây tự nhiên', price: 25000, imageUrl: '/uploads/services/snack.png' }
];

const seedServices = async () => {
    try {
        // Xóa dữ liệu cũ (Tùy chọn, nếu muốn clear trước)
        await Service.deleteMany({});
        console.log('Đã xóa dữ liệu dịch vụ cũ.');

        // Insert dữ liệu mới
        const inserted = await Service.insertMany(servicesData);
        console.log(`Đã chèn thành công ${inserted.length} dịch vụ đi kèm.`);

        mongoose.connection.close();
        console.log('Hoàn thành quá trình seed.');
    } catch (error) {
        console.error('Lỗi khi seed dịch vụ:', error);
        mongoose.connection.close();
    }
};

seedServices();
