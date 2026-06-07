const crypto = require('crypto');
const https = require('https');
const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');
const Booking = require('../models/booking.model');
const Voucher = require('../models/voucher.model');
const Showtime = require('../models/showtime.model');
const { sendBookingConfirmationEmail } = require('./email.service');
const GiftService = require('./gift.service');
const UserService = require('./users.service');
const NotificationService = require('./notification.service');
const { BadRequestError } = require('../core/error.response');

const MOMO_ERROR_MESSAGES = {
    40: 'Yêu cầu thanh toán bị trùng. Vui lòng thử lại sau vài giây.',
    41: 'Mã đơn hàng MoMo đã tồn tại. Hệ thống sẽ tạo link thanh toán mới.',
};

// =========================================================
// Cấu hình Momo & VNPay (Sandbox / Test)
// =========================================================
const MOMO_CONFIG = {
    accessKey: 'F8BBA842ECF85',
    secretKey: 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    partnerCode: 'MOMO',
    hostname: 'test-payment.momo.vn',
};

const VNPAY_CONFIG = {
    tmnCode: 'DH2F13SW',
    secureSecret: '7VJPG70RGPOWFO47VSBT29WPDYND0EJG',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
    loggerFn: ignoreLogger,
};

// Client URL cho redirect sau thanh toán
const CLIENT_URL = process.env.URL_CLIENT || 'http://localhost:5173';
const SERVER_URL = process.env.URL_SERVER || 'http://localhost:3000';

function generatePayID() {
    const now = new Date();
    return `TT${now.getTime()}${now.getSeconds().toString().padStart(2, '0')}`;
}

class BookingPaymentService {
    /**
     * Tạo URL thanh toán Momo và lưu đơn vé với status='Pending'
     * @param {Object} bookingData - { showtimeId, seats, services, totalPrice, voucherId, discountAmount }
     * @param {String} userId
     */
    async createMomoPayment(bookingData, userId) {
        const booking = await this._createPendingBooking(bookingData, userId, 'Momo');
        return this._buildMomoPayUrl(booking, { resume: false });
    }

    /**
     * Tạo đơn đặt vé giả lập và xác nhận thanh toán thành công ngay lập tức (Demo bypass)
     */
    async createMockPayment(bookingData, userId) {
        const booking = await this._createPendingBooking(bookingData, userId, 'MockPayment');
        return await this.markBookingAsPaid(booking._id, `MOCK_TRANS_${Date.now()}`);
    }

    /**
     * Tạo lại link MoMo cho đơn Pending (thanh toán tiếp)
     */
    async resumeMomoPayment(bookingId, userId) {
        const booking = await Booking.findById(bookingId);
        if (!booking) throw new BadRequestError('Không tìm thấy đơn đặt vé');
        if (String(booking.userId) !== String(userId)) {
            throw new BadRequestError('Bạn không có quyền thanh toán đơn này');
        }
        if (booking.status !== 'Pending') {
            throw new BadRequestError('Đơn đặt vé không còn ở trạng thái chờ thanh toán');
        }
        if (booking.paymentMethod !== 'Momo') {
            throw new BadRequestError('Đơn này không thanh toán qua MoMo');
        }

        return this._buildMomoPayUrl(booking, { resume: true });
    }

    _buildMomoPayUrl(booking, { resume = false } = {}) {
        return new Promise((resolve, reject) => {
            const { accessKey, secretKey, partnerCode, hostname } = MOMO_CONFIG;
            const bookingId = booking._id.toString();
            // MoMo từ chối orderId trùng (mã 41) — mỗi lần thanh toán tiếp cần orderId mới
            const orderId = resume
                ? `${partnerCode}${bookingId}R${Date.now()}`
                : `${partnerCode}${bookingId}`;
            const requestId = `${orderId}_${Date.now()}`;
            const orderInfo = `Dat ve xem phim TT CINEMA - ${booking._id}`;
            const redirectUrl = `${CLIENT_URL}/booking/result?bookingId=${booking._id}`;
            const ipnUrl = `${SERVER_URL}/api/payment/momo/callback`;
            const requestType = 'payWithMethod';
            const amount = Math.round(booking.totalPrice);
            const extraData = Buffer.from(JSON.stringify({ bookingId: booking._id })).toString('base64');

            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = JSON.stringify({
                partnerCode,
                partnerName: 'TT CINEMA',
                storeId: 'TTCinemaStore',
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                lang: 'vi',
                requestType,
                autoCapture: true,
                extraData,
                orderGroupId: '',
                signature,
            });

            const options = {
                hostname,
                port: 443,
                path: '/v2/gateway/api/create',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestBody),
                },
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        const resultCode = Number(parsed.resultCode);
                        if (resultCode !== 0 || !parsed.payUrl) {
                            const message =
                                MOMO_ERROR_MESSAGES[resultCode] ||
                                parsed.message ||
                                'Không tạo được link thanh toán MoMo';
                            reject(new BadRequestError(message));
                            return;
                        }
                        resolve({ payUrl: parsed.payUrl, bookingId: booking._id });
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('error', (e) => reject(e));
            req.write(requestBody);
            req.end();
        });
    }

    /**
     * Tạo URL thanh toán VNPay và lưu đơn vé với status='Pending'
     */
    async createVNPayPayment(bookingData, userId, ipAddr) {
        const booking = await this._createPendingBooking(bookingData, userId, 'VNPay');

        const vnpay = new VNPay(VNPAY_CONFIG);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const payUrl = await vnpay.buildPaymentUrl({
            vnp_Amount: Math.round(bookingData.totalPrice),
            vnp_IpAddr: ipAddr || '127.0.0.1',
            vnp_TxnRef: `TT${booking._id}_${generatePayID()}`,
            vnp_OrderInfo: `Dat ve xem phim TT CINEMA - ${booking._id}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: `${SERVER_URL}/api/payment/vnpay/callback`,
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date()),
            vnp_ExpireDate: dateFormat(tomorrow),
        });

        return { payUrl, bookingId: booking._id };
    }

    /**
     * Callback từ Momo sau khi thanh toán xong (IPN URL - server to server)
     */
    async momoCallback(query) {
        // resultCode = 0: Thành công
        if (query.resultCode === '0' || query.resultCode === 0) {
            return await this._confirmMomoSuccess(query);
        }
        // Thất bại: mở khóa ghế
        await this._releaseSeatsByMomoExtraData(query.extraData);
        throw new Error('Thanh toán Momo thất bại');
    }

    /**
     * Xác nhận kết quả khi user bị redirect về từ Momo (client gọi lên server)
     */
    async confirmMomoReturn(query) {
        if (query.resultCode === '0' || query.resultCode === 0) {
            return await this._confirmMomoSuccess(query);
        }
        // Thất bại: mở khóa ghế
        await this._releaseSeatsByMomoExtraData(query.extraData);
        throw new Error('Thanh toán Momo thất bại');
    }

    async _confirmMomoSuccess(query) {
        let bookingId = null;
        try {
            const extraData = JSON.parse(Buffer.from(query.extraData, 'base64').toString('utf8'));
            bookingId = extraData.bookingId;
        } catch (e) {
            throw new Error('Không thể đọc thông tin đơn hàng từ Momo');
        }

        return this.markBookingAsPaid(bookingId, query.transId);
    }

    /**
     * Xác nhận đơn Pending → Paid (dùng cho MoMo/VNPay callback hoặc admin xác nhận thủ công)
     */
    async markBookingAsPaid(bookingId, paymentTransactionId = 'ADMIN_MANUAL') {
        const existing = await Booking.findById(bookingId);
        if (!existing) throw new BadRequestError('Không tìm thấy đơn hàng');
        if (existing.status === 'Paid') return existing;
        if (existing.status !== 'Pending') {
            throw new BadRequestError('Chỉ có thể xác nhận đơn đang chờ thanh toán');
        }

        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { status: 'Paid', paymentTransactionId: String(paymentTransactionId) },
            { new: true },
        );

        await this._runPostPaymentActions(booking);
        return booking;
    }

    async _runPostPaymentActions(booking) {
        if (booking.voucherId) {
            await Voucher.findByIdAndUpdate(booking.voucherId, { $inc: { usedCount: 1 } });
        }

        try {
            const fullBooking = await Booking.findById(booking._id)
                .populate({
                    path: 'showtimeId',
                    populate: [
                        { path: 'movieId', select: 'title' },
                        { path: 'roomId', select: 'name', populate: { path: 'cinemaId', select: 'name' } },
                    ],
                })
                .populate('services.serviceId', 'name price')
                .populate('voucherId', 'code')
                .populate('userId', 'fullName email');
            sendBookingConfirmationEmail(fullBooking);
        } catch (_) {}

        GiftService.processGiftsForBooking(booking).catch((err) =>
            console.error('[Gift] processGifts error:', err.message),
        );

        if (booking.userId) {
            UserService.addTotalSpentAndCheckTier(booking.userId, booking.totalPrice).catch((err) =>
                console.error('[User] Update tier error:', err.message),
            );
        }

        if (booking.userId) {
            try {
                const populated = await Booking.findById(booking._id).populate({
                    path: 'showtimeId',
                    populate: { path: 'movieId', select: 'title' },
                });
                const movieTitle = populated?.showtimeId?.movieId?.title || 'phim';
                NotificationService.notifyBookingSuccess(booking.userId, booking, movieTitle).catch(() => {});
            } catch (_) {}
        }
    }

    async vnpayCallback(query) {
        const vnpay = new VNPay(VNPAY_CONFIG);
        const isValid = vnpay.verifyReturnUrl(query);

        if (isValid && query.vnp_ResponseCode === '00') {
            return await this._confirmVNPaySuccess(query);
        }
        // Thất bại: mở khóa ghế
        await this._releaseSeatsByVNPayTxnRef(query.vnp_TxnRef);
        throw new Error('Thanh toán VNPay thất bại hoặc chữ ký không hợp lệ');
    }

    /**
     * Xác nhận kết quả khi client gọi lên sau redirect VNPay
     */
    async confirmVNPayReturn(query) {
        if (query.vnp_ResponseCode === '00') {
            return await this._confirmVNPaySuccess(query);
        }
        // Thất bại: mở khóa ghế
        await this._releaseSeatsByVNPayTxnRef(query.vnp_TxnRef);
        throw new Error('Thanh toán VNPay thất bại');
    }

    async _confirmVNPaySuccess(query) {
        const parts = query.vnp_TxnRef.split('_');
        const bookingId = parts[1];
        return this.markBookingAsPaid(bookingId, query.vnp_TransactionNo);
    }

    async _createPendingBooking(bookingData, userId, paymentMethod) {
        const { showtimeId, seats, services, totalPrice, voucherId, discountAmount } = bookingData;

        // Kiểm tra ghế và khóa ghế
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) throw new Error('Suất chiếu không tồn tại');

        const unavailableSeats = showtime.seats.filter((seat) => {
            const code = `${seat.row}${seat.number}`;
            return seats.includes(code) && seat.status !== 'Available';
        });

        if (unavailableSeats.length > 0) {
            const codes = unavailableSeats.map((s) => `${s.row}${s.number}`).join(', ');
            throw new Error(`Ghế ${codes} đã có người đặt. Vui lòng chọn ghế khác!`);
        }

        // Khóa ghế
        showtime.seats.forEach((seat) => {
            if (seats.includes(`${seat.row}${seat.number}`)) {
                seat.status = 'Booked';
                seat.userId = userId;
            }
        });
        await showtime.save();

        // Tạo booking
        const booking = await Booking.create({
            userId,
            showtimeId,
            seats,
            services: services || [],
            totalPrice,
            voucherId: voucherId || null,
            discountAmount: discountAmount || 0,
            paymentMethod,
            status: 'Pending',
        });

        return booking;
    }

    /**
     * PRIVATE: Mở khóa ghế khi thanh toán thất bại
     */
    async _releaseSeats(bookingId) {
        const booking = await Booking.findById(bookingId);
        if (!booking || booking.status === 'Paid') return; // Đã paid rồi thì không release

        // Đánh dấu booking là Cancelled
        booking.status = 'Cancelled';
        await booking.save();

        // Trả ghế về Available
        const showtime = await Showtime.findById(booking.showtimeId);
        if (showtime) {
            showtime.seats.forEach((seat) => {
                if (booking.seats.includes(`${seat.row}${seat.number}`)) {
                    seat.status = 'Available';
                    seat.userId = null;
                }
            });
            await showtime.save();
        }
    }

    async _releaseSeatsByMomoExtraData(extraData) {
        try {
            const data = JSON.parse(Buffer.from(extraData, 'base64').toString('utf8'));
            if (data.bookingId) await this._releaseSeats(data.bookingId);
        } catch (_) {}
    }

    async _releaseSeatsByVNPayTxnRef(txnRef) {
        try {
            const parts = (txnRef || '').split('_');
            const bookingId = parts[1];
            if (bookingId) await this._releaseSeats(bookingId);
        } catch (_) {}
    }
}

module.exports = new BookingPaymentService();
