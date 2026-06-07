const cron = require('node-cron');
const Booking = require('../models/booking.model');
const Showtime = require('../models/showtime.model');

// Chạy mỗi 5 phút
cron.schedule('*/5 * * * *', async () => {
    try {
        console.log('[CRON] Đang chạy tác vụ kiểm tra vé hết hạn thanh toán...');
        
        // Tìm các vé Pending và được tạo hơn 15 phút trước
        const expirationTime = new Date(Date.now() - 15 * 60 * 1000);
        
        const expiredBookings = await Booking.find({
            status: 'Pending',
            createdAt: { $lte: expirationTime }
        });

        if (expiredBookings.length === 0) {
            console.log('[CRON] Không có vé hết hạn.');
            return;
        }

        console.log(`[CRON] Tìm thấy ${expiredBookings.length} vé hết hạn. Tiến hành giải phóng ghế...`);

        for (const booking of expiredBookings) {
            const showtime = await Showtime.findById(booking.showtimeId);
            
            if (showtime) {
                // Nhả ghế
                showtime.seats.forEach(seat => {
                    const code = `${seat.row}${seat.number}`;
                    if (booking.seats.includes(code)) {
                        seat.status = 'Available';
                    }
                });
                await showtime.save();
            }

            // Cập nhật trạng thái Booking
            booking.status = 'Cancelled';
            await booking.save();
            
            console.log(`[CRON] Đã hủy booking ${booking._id} và giải phóng ghế ${booking.seats.join(', ')}`);
        }
        
        console.log('[CRON] Hoàn tất giải phóng ghế.');
    } catch (error) {
        console.error('[CRON ERROR] Lỗi khi chạy cron job:', error);
    }
});

console.log('[CRON] Đã khởi động tác vụ kiểm tra vé (Mỗi 5 phút).');
