const PaymentService = require('../services/payment.service');
const { OK } = require('../core/success.response');

class PaymentController {
    // Tạo URL thanh toán Momo
    async createMomoPayment(req, res) {
        const userId = req.user.id;
        const result = await PaymentService.createMomoPayment(req.body, userId);
        new OK({ message: 'Tạo link thanh toán Momo thành công', metadata: result }).send(res);
    }

    // Tạo thanh toán giả lập (Mock/Demo Payment)
    async createMockPayment(req, res) {
        const userId = req.user.id;
        const booking = await PaymentService.createMockPayment(req.body, userId);
        new OK({ message: 'Thanh toán giả lập thành công', metadata: booking }).send(res);
    }

    async resumeMomoPayment(req, res) {
        const userId = req.user.id;
        const result = await PaymentService.resumeMomoPayment(req.params.bookingId, userId);
        new OK({ message: 'Tạo lại link thanh toán MoMo thành công', metadata: result }).send(res);
    }

    // Tạo URL thanh toán VNPay
    async createVNPayPayment(req, res) {
        const userId = req.user.id;
        const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const result = await PaymentService.createVNPayPayment(req.body, userId, ipAddr);
        new OK({ message: 'Tạo link thanh toán VNPay thành công', metadata: result }).send(res);
    }

    // Thanh toán tiền mặt tại quầy
    async createCashBooking(req, res) {
        const userId = req.user.id;
        const booking = await PaymentService.createCashBooking(req.body, userId);
        new OK({ message: 'Đặt vé thành công (Thanh toán tại quầy)', metadata: booking }).send(res);
    }

    // Callback từ Momo (IPN - server to server)
    async momoCallback(req, res) {
        try {
            await PaymentService.momoCallback(req.body);
            res.status(200).json({ message: 'OK' });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Client gọi lên sau khi Momo redirect về để confirm & update booking
    async confirmMomoReturn(req, res) {
        const booking = await PaymentService.confirmMomoReturn(req.body);
        new OK({ message: 'Xác nhận thanh toán Momo thành công', metadata: booking }).send(res);
    }

    // Client gọi lên sau khi VNPay redirect về để confirm & update booking
    async confirmVNPayReturn(req, res) {
        const booking = await PaymentService.confirmVNPayReturn(req.body);
        new OK({ message: 'Xác nhận thanh toán VNPay thành công', metadata: booking }).send(res);
    }

    // Callback từ VNPay (ReturnUrl)
    async vnpayCallback(req, res) {
        try {
            const booking = await PaymentService.vnpayCallback(req.query);
            // Redirect về trang kết quả
            const CLIENT_URL = process.env.URL_CLIENT || 'http://localhost:5173';
            res.redirect(`${CLIENT_URL}/booking/result?bookingId=${booking._id}`);
        } catch (error) {
            const CLIENT_URL = process.env.URL_CLIENT || 'http://localhost:5173';
            res.redirect(`${CLIENT_URL}/booking/result?status=failed`);
        }
    }
}

module.exports = new PaymentController();
