const Booking = require('../models/booking.model');
const Showtime = require('../models/showtime.model');

class BookingService {
    async createBooking(data, userId) {
        const { showtimeId, seats, services, totalPrice, paymentMethod } = data;

        // 1. Kiểm tra suất chiếu
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) throw new Error('Suất chiếu không tồn tại');

        // 2. Kiểm tra xem các ghế yêu cầu có còn trống không
        const unavailableSeats = [];
        showtime.seats.forEach(seat => {
            const seatCode = `${seat.row}${seat.number}`;
            if (seats.includes(seatCode) && seat.status !== 'Available') {
                unavailableSeats.push(seatCode);
            }
        });

        if (unavailableSeats.length > 0) {
            throw new Error(`Ghế ${unavailableSeats.join(', ')} đã có người đặt. Vui lòng chọn ghế khác!`);
        }

        // 3. Khóa ghế (chuyển sang Booked)
        showtime.seats.forEach(seat => {
            const seatCode = `${seat.row}${seat.number}`;
            if (seats.includes(seatCode)) {
                seat.status = 'Booked';
                seat.userId = userId;
            }
        });

        // 4. Lưu lại suất chiếu (để cập nhật trạng thái ghế)
        await showtime.save();

        // 5. Tạo đơn đặt vé
        const booking = await Booking.create({
            userId,
            showtimeId,
            seats,
            services,
            totalPrice,
            paymentMethod,
            status: paymentMethod === 'Cash' ? 'Paid' : 'Pending' // Tạm thời Cash là thanh toán tại quầy
        });

        return booking;
    }

    async createOfflineBooking(data, employeeId) {
        const { showtimeId, seats, services, totalPrice } = data;

        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) throw new Error('Suất chiếu không tồn tại');

        const unavailableSeats = [];
        showtime.seats.forEach(seat => {
            const seatCode = `${seat.row}${seat.number}`;
            if (seats.includes(seatCode) && seat.status !== 'Available') {
                unavailableSeats.push(seatCode);
            }
        });

        if (unavailableSeats.length > 0) {
            throw new Error(`Ghế ${unavailableSeats.join(', ')} đã có người đặt. Vui lòng chọn ghế khác!`);
        }

        showtime.seats.forEach(seat => {
            const seatCode = `${seat.row}${seat.number}`;
            if (seats.includes(seatCode)) {
                seat.status = 'Booked';
                // Khách offline nên không có userId
            }
        });

        await showtime.save();

        const booking = await Booking.create({
            showtimeId,
            seats,
            services,
            totalPrice,
            paymentMethod: 'Cash',
            status: 'Paid',
            employeeId
        });

        return booking;
    }

    async getBookingsByUser(userId) {
        return await Booking.find({ userId })
            .populate({
                path: 'showtimeId',
                populate: [
                    { path: 'movieId', select: 'title posterUrl' },
                    { path: 'roomId', select: 'name cinemaId', populate: { path: 'cinemaId', select: 'name address' } }
                ]
            })
            .populate('services.serviceId')
            .sort({ createdAt: -1 });
    }

    async getBookingById(id) {
        return await Booking.findById(id)
            .populate({
                path: 'showtimeId',
                populate: [
                    { path: 'movieId', select: 'title posterUrl' },
                    { path: 'roomId', select: 'name cinemaId', populate: { path: 'cinemaId', select: 'name address' } }
                ]
            })
            .populate('services.serviceId', 'name price imageUrl')
            .populate('voucherId', 'code discountType discountValue')
            .populate('userId', 'fullName email');
    }

    async getAllBookings() {
        return await Booking.find()
            .populate({
                path: 'showtimeId',
                populate: [
                    { path: 'movieId', select: 'title posterUrl' },
                    { path: 'roomId', select: 'name', populate: { path: 'cinemaId', select: 'name' } }
                ]
            })
            .populate('userId', 'fullName email')
            .populate('voucherId', 'code')
            .sort({ createdAt: -1 });
    }

    async checkInBooking(id, employeeId) {
        const booking = await Booking.findById(id);
        if (!booking) throw new Error('Không tìm thấy vé này');
        
        if (booking.status === 'CheckedIn') {
            throw new Error('Vé này đã được quét và in trước đó!');
        }
        
        if (booking.status !== 'Paid') {
            throw new Error('Vé này chưa được thanh toán thành công!');
        }

        booking.status = 'CheckedIn';
        booking.checkedInBy = employeeId;
        await booking.save();
        return booking;
    }

    async getEmployeeReport(employeeId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookings = await Booking.find({
            $or: [
                { employeeId: employeeId, createdAt: { $gte: today } },
                { checkedInBy: employeeId, updatedAt: { $gte: today } }
            ]
        });

        let offlineSales = 0;
        let offlineCount = 0;
        let scannedCount = 0;

        bookings.forEach(b => {
            if (b.employeeId?.toString() === employeeId && new Date(b.createdAt) >= today) {
                offlineSales += b.totalPrice;
                offlineCount++;
            }
            if (b.checkedInBy?.toString() === employeeId && b.status === 'CheckedIn' && new Date(b.updatedAt) >= today) {
                scannedCount++;
            }
        });

        return { offlineSales, offlineCount, scannedCount };
    }
}

module.exports = new BookingService();
