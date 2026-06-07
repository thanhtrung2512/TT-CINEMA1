const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Cinema = require('./models/cinema.model');
const Room = require('./models/room.model');
const Showtime = require('./models/showtime.model');
const Voucher = require('./models/voucher.model');
const User = require('./models/users.model');
const Movie = require('./models/movies.model');

require('dotenv').config({ path: __dirname + '/../.env' });

const CONNECT_URL = process.env.CONNECT_DB || 'mongodb://127.0.0.1:27017/movie2';

// Danh sách các rạp chiếu
const cinemasData = [
    { name: 'TT Cinema Hùng Vương', address: 'Tầng 5, Hùng Vương Plaza, 126 Hùng Vương, Q.5', city: 'Hồ Chí Minh', hotline: '1900 6017' },
    { name: 'TT Cinema Landmark 81', address: 'Tầng B1, Vincom Landmark 81, 772 Điện Biên Phủ, Bình Thạnh', city: 'Hồ Chí Minh', hotline: '1900 6018' },
    { name: 'TT Cinema Aeon Mall Long Biên', address: 'Tầng 3, Aeon Mall Long Biên, 27 Cổ Linh, Q. Long Biên', city: 'Hà Nội', hotline: '1900 6019' },
    { name: 'TT Cinema Trần Duy Hưng', address: 'Tầng 5, Vincom Trần Duy Hưng, Cầu Giấy', city: 'Hà Nội', hotline: '1900 6020' }
];

// Sinh danh sách ghế tự động cho phòng chiếu (10 hàng x 12 ghế = 120 ghế)
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

async function seedData() {
    try {
        console.log('🔗 Đang kết nối MongoDB...');
        await mongoose.connect(CONNECT_URL);
        console.log('✅ Kết nối MongoDB thành công!');

        // 1. Kiểm tra phim trong database
        const movies = await Movie.find();
        if (movies.length === 0) {
            console.log('❌ Lỗi: Không tìm thấy bộ phim nào trong cơ sở dữ liệu. Vui lòng chạy kịch bản đồng bộ phim trước (node src/syncMoviesFromApi.js --pages=2)');
            process.exit(1);
        }
        console.log(`🎬 Tìm thấy ${movies.length} phim trong DB để tạo suất chiếu.`);

        // 2. Xóa dữ liệu cũ
        console.log('🧹 Đang dọn dẹp dữ liệu cũ (Cinema, Room, Showtime, Voucher, Users test)...');
        await Cinema.deleteMany({});
        await Room.deleteMany({});
        await Showtime.deleteMany({});
        await Voucher.deleteMany({});
        // Chỉ xóa các user test đặc biệt
        await User.deleteMany({ email: { $in: ['admin@gmail.com', 'employee@gmail.com', 'user@gmail.com'] } });
        console.log('✨ Đã xóa dữ liệu cũ thành công!');

        // 3. Tạo Rạp chiếu (Cinemas)
        console.log('🏢 Đang tạo Rạp chiếu...');
        const cinemas = await Cinema.insertMany(cinemasData);
        console.log(`🏢 Đã chèn ${cinemas.length} rạp chiếu.`);

        // 4. Tạo Phòng chiếu (Rooms) cho mỗi Rạp
        console.log('🚪 Đang tạo Phòng chiếu...');
        const roomsToInsert = [];
        const seatLayout = generateSeatLayout();

        for (const cinema of cinemas) {
            roomsToInsert.push(
                { name: 'Phòng 1 (Standard)', cinemaId: cinema._id, capacity: 120, seatLayout },
                { name: 'Phòng 2 (IMAX 3D)', cinemaId: cinema._id, capacity: 120, seatLayout },
                { name: 'Phòng 3 (VIP Lounge)', cinemaId: cinema._id, capacity: 120, seatLayout }
            );
        }
        const rooms = await Room.insertMany(roomsToInsert);
        console.log(`🚪 Đã chèn ${rooms.length} phòng chiếu.`);

        // 5. Tạo Suất chiếu (Showtimes) cho các phim đang chiếu và sắp chiếu
        console.log('⏰ Đang tạo Suất chiếu trong 7 ngày tới...');
        const showtimesToInsert = [];
        const today = new Date();

        // Lấy danh sách phim đang/sắp chiếu
        const activeMovies = movies.filter(m => m.status === 'Đang chiếu' || m.status === 'Sắp chiếu');

        for (const movie of activeMovies) {
            // Random 3 phòng chiếu ngẫu nhiên cho mỗi phim
            const selectedRooms = [
                rooms[Math.floor(Math.random() * rooms.length)],
                rooms[Math.floor(Math.random() * rooms.length)]
            ];

            for (const room of selectedRooms) {
                // Tạo 3 suất chiếu ở mỗi phòng vào các ngày khác nhau
                for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
                    const startTime = new Date(today);
                    startTime.setDate(today.getDate() + dayOffset);
                    
                    // Giờ chiếu ngẫu nhiên: 9h00, 14h00, 19h00
                    const hours = [9, 14, 19, 21];
                    const selectedHour = hours[Math.floor(Math.random() * hours.length)];
                    startTime.setHours(selectedHour, 0, 0, 0);

                    const endTime = new Date(startTime);
                    endTime.setHours(startTime.getHours() + 2); // Thời lượng 2 tiếng

                    // Giá vé ngẫu nhiên từ 75.000đ - 120.000đ
                    const prices = [75000, 85000, 95000, 120000];
                    const price = prices[Math.floor(Math.random() * prices.length)];

                    // Clone seatLayout của phòng chiếu sang showtime seats
                    const showtimeSeats = room.seatLayout.map(seat => ({
                        row: seat.row,
                        number: seat.number,
                        type: seat.type,
                        status: 'Available',
                        userId: null
                    }));

                    // Random 5-10 ghế đã được đặt trước để sinh động hơn
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
        console.log(`⏰ Đã tạo ${showtimes.length} suất chiếu thành công.`);

        // 6. Tạo Vouchers ưu đãi
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
        console.log(`🎫 Đã chèn ${vouchers.length} mã vouchers.`);

        // 7. Tạo tài khoản mẫu
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
                typeLogin: 'email'
            }
        ];
        const users = await User.insertMany(usersData);
        console.log(`👤 Đã chèn ${users.length} tài khoản mẫu thành công.`);
        console.log('\n--- THÔNG TIN TÀI KHOẢN ĐỂ TEST ---');
        console.log('1. Admin:      admin@gmail.com    / mật khẩu: 123456');
        console.log('2. Nhân viên:  employee@gmail.com / mật khẩu: 123456');
        console.log('3. Khách hàng: user@gmail.com     / mật khẩu: 123456');
        console.log('-----------------------------------\n');

        console.log('🎉 Hoàn thành quá trình Seed dữ liệu ứng dụng thành công!');
        mongoose.connection.close();
    } catch (err) {
        console.error('💥 Lỗi nghiêm trọng khi seed data:', err);
        mongoose.connection.close();
        process.exit(1);
    }
}

seedData();
