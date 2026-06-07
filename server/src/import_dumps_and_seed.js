const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const Category = require('./models/category.model');
const Movie = require('./models/movies.model');
const Cinema = require('./models/cinema.model');
const Room = require('./models/room.model');
const Showtime = require('./models/showtime.model');
const Voucher = require('./models/voucher.model');
const User = require('./models/users.model');
const Service = require('./models/service.model');
const Gift = require('./models/gift.model');
const Booking = require('./models/booking.model');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const CONNECT_URL = process.env.CONNECT_DB || 'mongodb://127.0.0.1:27017/movie2';

// Helper to pick random element
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Recursive function to parse MongoDB JSON ($oid and $date format)
function transformMongoJson(obj) {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
        return obj.map(transformMongoJson);
    }
    if (typeof obj === 'object') {
        if (obj.$oid) {
            return new mongoose.Types.ObjectId(obj.$oid);
        }
        if (obj.$date) {
            return new Date(obj.$date);
        }
        const newObj = {};
        for (const key in obj) {
            newObj[key] = transformMongoJson(obj[key]);
        }
        return newObj;
    }
    return obj;
}

// Seat layout generator
function generateSeatLayout() {
    const layout = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (const row of rows) {
        for (let number = 1; number <= 12; number++) {
            let type = 'Thuong';
            if (row === 'G' || row === 'H' || row === 'I') {
                type = 'VIP';
            } else if (row === 'J') {
                type = 'Sweetbox';
            }
            layout.push({ row, number, type });
        }
    }
    return layout;
}

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

const cinemasData = [
    { name: 'TT Cinema Hùng Vương', address: 'Tầng 5, Hùng Vương Plaza, 126 Hùng Vương, Q.5', city: 'Hồ Chí Minh', hotline: '1900 6017' },
    { name: 'TT Cinema Landmark 81', address: 'Tầng B1, Vincom Landmark 81, 772 Điện Biên Phủ, Bình Thạnh', city: 'Hồ Chí Minh', hotline: '1900 6018' },
    { name: 'TT Cinema Aeon Mall Long Biên', address: 'Tầng 3, Aeon Mall Long Biên, 27 Cổ Linh, Q. Long Biên', city: 'Hà Nội', hotline: '1900 6019' },
    { name: 'TT Cinema Trần Duy Hưng', address: 'Tầng 5, Vincom Trần Duy Hưng, Cầu Giấy', city: 'Hà Nội', hotline: '1900 6020' }
];

async function runSeed() {
    try {
        console.log('🔗 Đang kết nối MongoDB...');
        await mongoose.connect(CONNECT_URL);
        console.log('✅ Kết nối MongoDB thành công!');

        // 1. Dọn sạch dữ liệu cũ
        console.log('🧹 Đang dọn sạch toàn bộ dữ liệu cũ...');
        await Category.deleteMany({});
        await Movie.deleteMany({});
        await Service.deleteMany({});
        await Cinema.deleteMany({});
        await Room.deleteMany({});
        await Showtime.deleteMany({});
        await Voucher.deleteMany({});
        await Gift.deleteMany({});
        await Booking.deleteMany({});
        await User.deleteMany({ email: { $in: ['admin@gmail.com', 'employee@gmail.com', 'user@gmail.com'] } });
        console.log('✅ Đã dọn dẹp sạch sẽ!');

        // 2. Nhập Categories từ JSON dump
        console.log('📂 Đang nhập danh sách thể loại từ file JSON...');
        const categoriesPath = path.join(__dirname, '..', '..', 'database', 'movie2.categories.json');
        const rawCategories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
        const cleanCategories = transformMongoJson(rawCategories);
        await Category.insertMany(cleanCategories);
        console.log(`✅ Đã chèn thành công ${cleanCategories.length} danh mục thể loại!`);

        // 3. Nhập Phim từ JSON dump (đã bao gồm link ảnh local hoàn hảo)
        console.log('🎬 Đang nhập danh sách phim từ file JSON...');
        const moviesPath = path.join(__dirname, '..', '..', 'database', 'movie2.movies.json');
        const rawMovies = JSON.parse(fs.readFileSync(moviesPath, 'utf8'));
        const cleanMovies = transformMongoJson(rawMovies);
        await Movie.insertMany(cleanMovies);
        console.log(`✅ Đã chèn thành công ${cleanMovies.length} bộ phim!`);

        // 4. Tạo các dịch vụ đi kèm (Dịch vụ bắp nước combo)
        console.log('🍿 Đang tạo các dịch vụ bắp nước...');
        const services = await Service.insertMany(servicesData);
        console.log(`✅ Đã chèn ${services.length} dịch vụ đi kèm.`);

        // 5. Tạo các Rạp chiếu phim
        console.log('🏢 Đang tạo các rạp chiếu phim...');
        const cinemas = await Cinema.insertMany(cinemasData);
        console.log(`✅ Đã tạo ${cinemas.length} rạp chiếu.`);

        // 6. Tạo các Phòng chiếu phim cho từng rạp
        console.log('🚪 Đang tạo các phòng chiếu...');
        const seatLayout = generateSeatLayout();
        const roomsToInsert = [];
        for (const cinema of cinemas) {
            roomsToInsert.push(
                { name: 'Phòng 1 (Standard)', cinemaId: cinema._id, capacity: 120, seatLayout },
                { name: 'Phòng 2 (IMAX 3D)', cinemaId: cinema._id, capacity: 120, seatLayout },
                { name: 'Phòng 3 (VIP Lounge)', cinemaId: cinema._id, capacity: 120, seatLayout }
            );
        }
        const rooms = await Room.insertMany(roomsToInsert);
        console.log(`✅ Đã chèn thành công ${rooms.length} phòng chiếu.`);

        // 7. Tạo Suất chiếu (Showtimes) tương lai (5 ngày tới) cho các phim Đang/Sắp chiếu
        console.log('⏰ Đang tạo Suất chiếu tương lai...');
        const showtimesToInsert = [];
        const today = new Date();
        const activeMovies = cleanMovies.filter(m => m.status === 'Đang chiếu' || m.status === 'Sắp chiếu');

        for (const movie of activeMovies) {
            const selectedRooms = [
                rooms[Math.floor(Math.random() * rooms.length)],
                rooms[Math.floor(Math.random() * rooms.length)]
            ];

            for (const room of selectedRooms) {
                for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
                    const startTime = new Date(today);
                    startTime.setDate(today.getDate() + dayOffset);
                    const hours = [10, 14, 18, 21];
                    const selectedHour = hours[Math.floor(Math.random() * hours.length)];
                    startTime.setHours(selectedHour, 0, 0, 0);

                    const endTime = new Date(startTime);
                    endTime.setHours(startTime.getHours() + 2);

                    const prices = [75000, 85000, 95000, 120000];
                    const price = prices[Math.floor(Math.random() * prices.length)];

                    const showtimeSeats = room.seatLayout.map(seat => ({
                        row: seat.row,
                        number: seat.number,
                        type: seat.type,
                        status: 'Available',
                        userId: null
                    }));

                    // Đặt trước ngẫu nhiên 5-10 ghế cho sinh động
                    const numBooked = Math.floor(Math.random() * 6) + 5;
                    for (let b = 0; b < numBooked; b++) {
                        const randomIndex = Math.floor(Math.random() * showtimeSeats.length);
                        showtimeSeats[randomIndex].status = 'Booked';
                    }

                    showtimesToInsert.push({
                        movieId: movie._id,
                        roomId: room._id,
                        startTime,
                        endTime,
                        price,
                        seats: showtimeSeats
                    });
                }
            }
        }
        const showtimes = await Showtime.insertMany(showtimesToInsert);
        console.log(`✅ Đã tạo thành công ${showtimes.length} suất chiếu trong tương lai.`);

        // 8. Tạo Vouchers giảm giá
        console.log('🎫 Đang tạo các mã Vouchers giảm giá...');
        const validFrom = new Date(today);
        const validTo = new Date(today);
        validTo.setDate(today.getDate() + 30); // HSD 30 ngày

        const vouchersData = [
            { code: 'GIAM10', discountType: 'percent', discountValue: 10, minOrderValue: 50000, maxDiscount: 20000, validFrom, validTo, isActive: true },
            { code: 'GIAM20', discountType: 'percent', discountValue: 20, minOrderValue: 100000, maxDiscount: 50000, validFrom, validTo, isActive: true },
            { code: 'WELCOME50', discountType: 'fixed', discountValue: 50000, minOrderValue: 120000, maxDiscount: 50000, validFrom, validTo, isActive: true },
            { code: 'TT75K', discountType: 'fixed', discountValue: 75000, minOrderValue: 150000, maxDiscount: 75000, validFrom, validTo, isActive: true },
            { code: 'SIEUDEAL', discountType: 'percent', discountValue: 50, minOrderValue: 80000, maxDiscount: 100000, validFrom, validTo, isActive: true }
        ];
        const vouchers = await Voucher.insertMany(vouchersData);
        console.log(`✅ Đã chèn ${vouchers.length} mã vouchers.`);

        // 9. Tạo Chương trình Quà tặng tự động (Gifts)
        console.log('🎁 Đang tạo các chương trình quà tặng tự động...');
        const giftsData = [
            {
                name: 'Ưu Đãi Bạn Mới - Đặt Vé Đạt Mốc',
                description: 'Tặng voucher giảm 20% (tối đa 50.000đ) khi hoàn thành mốc đặt vé 3 lần.',
                triggerType: 'nth_booking',
                nthBooking: 3,
                rewardType: 'voucher',
                voucherConfig: {
                    discountType: 'percent',
                    discountValue: 20,
                    maxDiscount: 50000,
                    validDays: 15,
                    minOrderValue: 80000
                },
                isActive: true
            },
            {
                name: 'Tri Ân Khách Hàng - Tích Lũy Chi Tiêu',
                description: 'Tặng ngay voucher trị giá 50.000đ khi tổng chi tiêu tích lũy đạt từ 500.000đ.',
                triggerType: 'cumulative_spend',
                minOrderAmount: 500000,
                rewardType: 'voucher',
                voucherConfig: {
                    discountType: 'fixed',
                    discountValue: 50000,
                    maxDiscount: 50000,
                    validDays: 30,
                    minOrderValue: 100000
                },
                isActive: true
            },
            {
                name: 'Quà Tặng Đơn Hàng Lớn',
                description: 'Tặng voucher giảm 10% cho mỗi đơn hàng có trị giá trên 150.000đ.',
                triggerType: 'per_order',
                minOrderAmount: 150000,
                rewardType: 'voucher',
                voucherConfig: {
                    discountType: 'percent',
                    discountValue: 10,
                    maxDiscount: 30000,
                    validDays: 7,
                    minOrderValue: 50000
                },
                isActive: true
            }
        ];
        const gifts = await Gift.insertMany(giftsData);
        console.log(`✅ Đã tạo thành công ${gifts.length} chương trình quà tặng.`);

        // 10. Tạo các tài khoản người dùng mẫu
        console.log('👤 Đang tạo các tài khoản người dùng mẫu...');
        const salt = bcrypt.genSaltSync(10);
        const hashedUserPassword = bcrypt.hashSync('123456', salt);

        const usersData = [
            {
                fullName: 'Quản Trị Viên (Admin)',
                email: 'admin@gmail.com',
                password: hashedUserPassword,
                isAdmin: true,
                isEmployee: false,
                phone: '0901234567',
                address: 'Hà Nội',
                typeLogin: 'email'
            },
            {
                fullName: 'Nhân Viên Soát Vé',
                email: 'employee@gmail.com',
                password: hashedUserPassword,
                isAdmin: false,
                isEmployee: true,
                phone: '0907654321',
                address: 'Hồ Chí Minh',
                typeLogin: 'email'
            },
            {
                fullName: 'Khách Hàng Trải Nghiệm',
                email: 'user@gmail.com',
                password: hashedUserPassword,
                isAdmin: false,
                isEmployee: false,
                phone: '0912233445',
                address: 'Đà Nẵng',
                typeLogin: 'email',
                membershipTier: 'Bạc',
                totalSpent: 450000
            }
        ];
        const users = await User.insertMany(usersData);
        console.log(`✅ Đã chèn ${users.length} tài khoản mẫu thành công.`);

        // 11. Tạo Lịch sử Đặt vé mẫu trong quá khứ cho Khách Hàng Trải Nghiệm (user@gmail.com)
        console.log('🎟️ Đang tạo lịch sử đặt vé quá khứ cho user@gmail.com...');
        const customer = users.find(u => u.email === 'user@gmail.com');
        const pastShowtimesToInsert = [];
        const pastBookingsToInsert = [];

        // Lấy 3 phim đang chiếu làm phim đặt vé trong quá khứ
        const bookingMovies = cleanMovies.filter(m => m.status === 'Đang chiếu').slice(0, 3);
        const pastDays = [5, 3, 1]; // 5 ngày trước, 3 ngày trước, 1 ngày trước

        for (let i = 0; i < bookingMovies.length; i++) {
            const movie = bookingMovies[i];
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const daysAgo = pastDays[i];

            const startTime = new Date();
            startTime.setDate(today.getDate() - daysAgo);
            startTime.setHours(19, 0, 0, 0); // Suất chiếu tối 19h00

            const endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + 2);

            const price = 95000;
            const pastSeats = room.seatLayout.map(seat => ({
                row: seat.row,
                number: seat.number,
                type: seat.type,
                status: 'Available',
                userId: null
            }));

            // Ghế của khách hàng này
            const selectedSeats = [`G${5 + i}`, `G${6 + i}`]; // ví dụ: G5-G6, G6-G7, G7-G8
            selectedSeats.forEach(seatCode => {
                const foundSeat = pastSeats.find(s => `${s.row}${s.number}` === seatCode);
                if (foundSeat) {
                    foundSeat.status = 'Booked';
                    foundSeat.userId = customer._id;
                }
            });

            // Ghế ngẫu nhiên khác cũng đã đặt
            const otherBookings = Math.floor(Math.random() * 20) + 15;
            for (let b = 0; b < otherBookings; b++) {
                const randomIndex = Math.floor(Math.random() * pastSeats.length);
                if (pastSeats[randomIndex].status === 'Available') {
                    pastSeats[randomIndex].status = 'Booked';
                }
            }

            const pastShowtime = new Showtime({
                movieId: movie._id,
                roomId: room._id,
                startTime,
                endTime,
                price,
                seats: pastSeats
            });

            await pastShowtime.save();

            // Tính tiền vé = 2 vé * 95000đ
            let ticketPrice = 2 * price;
            
            // Random dịch vụ kèm theo
            const selectedService = services[Math.floor(Math.random() * services.length)];
            const serviceQty = Math.floor(Math.random() * 2) + 1;
            const serviceCost = selectedService.price * serviceQty;
            const totalPrice = ticketPrice + serviceCost;

            pastBookingsToInsert.push({
                userId: customer._id,
                showtimeId: pastShowtime._id,
                seats: selectedSeats,
                services: [
                    {
                        serviceId: selectedService._id,
                        quantity: serviceQty
                    }
                ],
                totalPrice: totalPrice,
                paymentMethod: pickRandom(['Momo', 'VNPay', 'Cash']),
                paymentTransactionId: 'TXN' + Math.floor(Math.random() * 100000000),
                status: 'Paid',
                createdAt: startTime,
                updatedAt: startTime
            });
        }

        const bookings = await Booking.insertMany(pastBookingsToInsert);
        console.log(`✅ Đã tạo thành công ${bookings.length} lịch sử giao dịch/đặt vé trong quá khứ.`);

        console.log('\n--- THÔNG TIN TÀI KHOẢN ĐỂ TEST DỰ ÁN ---');
        console.log('1. Admin (Quản trị):   admin@gmail.com    / mật khẩu: 123456');
        console.log('2. Nhân viên (Soát vé): employee@gmail.com / mật khẩu: 123456');
        console.log('3. Khách hàng (Member): user@gmail.com     / mật khẩu: 123456 (Đã tích lũy chi tiêu 450.000đ, hạng Bạc, có 3 vé đã đặt)');
        console.log('-----------------------------------------\n');

        console.log('🎉 Hoàn thành quá trình Import dữ liệu xịn xò vào MongoDB thành công!');
        mongoose.connection.close();
    } catch (err) {
        console.error('💥 Lỗi nghiêm trọng khi chạy seeder:', err);
        mongoose.connection.close();
        process.exit(1);
    }
}

runSeed();
