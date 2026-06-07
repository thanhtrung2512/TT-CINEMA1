const BookingService = require('../services/booking.service');
const PaymentService = require('../services/payment.service');
const { OK } = require('../core/success.response');

class BookingController {
    async createBooking(req, res) {
        const userId = req.user.id; 
        const booking = await BookingService.createBooking(req.body, userId);
        new OK({ message: 'Đặt vé thành công', metadata: booking }).send(res);
    }

    async createOfflineBooking(req, res) {
        const employeeId = req.user.id;
        const booking = await BookingService.createOfflineBooking(req.body, employeeId);
        // Sau khi bán trực tiếp thì đánh dấu luôn là đã checkin để đỡ phải quét lại bằng máy
        // Hoặc giữ nguyên 'Paid', khách cầm vé quét lại cũng ok, nhưng thường bán tại quầy thì xuất vé luôn.
        // Đã cập nhật ở service status là 'Paid'.
        new OK({ message: 'Bán vé thành công', metadata: booking }).send(res);
    }

    async getMyBookings(req, res) {
        const userId = req.user.id;
        const bookings = await BookingService.getBookingsByUser(userId);
        new OK({ message: 'Lấy lịch sử đặt vé thành công', metadata: bookings }).send(res);
    }

    async getBookingById(req, res) {
        const booking = await BookingService.getBookingById(req.params.id);
        new OK({ message: 'Lấy chi tiết đơn đặt vé thành công', metadata: booking }).send(res);
    }

    async getAllBookings(req, res) {
        const bookings = await BookingService.getAllBookings();
        new OK({ message: 'Lấy tất cả đơn đặt vé', metadata: bookings }).send(res);
    }

    async verifyBooking(req, res) {
        const booking = await BookingService.getBookingById(req.params.id);
        if (!booking) throw new Error('Không tìm thấy vé này');
        new OK({ message: 'Lấy chi tiết vé thành công', metadata: booking }).send(res);
    }

    async checkInBooking(req, res) {
        const employeeId = req.user.id;
        const booking = await BookingService.checkInBooking(req.params.id, employeeId);
        new OK({ message: 'Xác nhận vé thành công', metadata: booking }).send(res);
    }

    async getEmployeeReport(req, res) {
        const employeeId = req.user.id;
        const report = await BookingService.getEmployeeReport(employeeId);
        new OK({ message: 'Lấy báo cáo thành công', metadata: report }).send(res);
    }

    async adminConfirmPayment(req, res) {
        const booking = await PaymentService.markBookingAsPaid(req.params.id, 'ADMIN_MANUAL');
        new OK({ message: 'Xác nhận thanh toán thành công', metadata: booking }).send(res);
    }
}

module.exports = new BookingController();
