import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, MapPin, Clock, Film, Armchair, Coffee, Tag, CreditCard, Star, AlertCircle } from 'lucide-react';
import { Button, Divider, Modal, Rate, Input, message } from 'antd';
import { requestConfirmMomoReturn, requestConfirmVNPayReturn, requestResumeMomoPayment } from '@/config/PaymentRequest';
import { toast } from 'react-toastify';
import { requestGetBookingById } from '@/config/BookingRequest';
import { requestCreateReview, requestGetMyReviews } from '@/config/ReviewRequest';
import dayjs from 'dayjs';
import QRCode from 'react-qr-code';

export default function BookingResultPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [booking, setBooking] = useState(null);
    const [hasReviewed, setHasReviewed] = useState(false);

    // Review state
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isResumingPayment, setIsResumingPayment] = useState(false);

    const loadReviewStatus = async (bookingData) => {
        if (!bookingData?.showtimeId?.movieId) return;
        const reviewsRes = await requestGetMyReviews().catch(() => null);
        if (reviewsRes?.metadata) {
            const movieId = bookingData.showtimeId.movieId._id;
            const isRev = reviewsRes.metadata.some((r) => r.movieId === movieId);
            setHasReviewed(isRev);
        }
    };

    const resolveStatusFromBooking = (bookingData) => {
        if (bookingData.status === 'Paid' || bookingData.status === 'CheckedIn') return 'success';
        if (bookingData.status === 'Pending') return 'pending';
        return 'failed';
    };

    const parseBookingIdFromExtraData = (extraData) => {
        if (!extraData) return null;
        try {
            const decoded = JSON.parse(atob(extraData));
            return decoded.bookingId || null;
        } catch {
            return null;
        }
    };

    const fetchAndApplyBookingStatus = async (bookingId) => {
        const bookingRes = await requestGetBookingById(bookingId);
        const bookingData = bookingRes?.metadata;
        if (!bookingData) {
            setStatus('failed');
            return;
        }

        setBooking(bookingData);
        const nextStatus = resolveStatusFromBooking(bookingData);
        setStatus(nextStatus);

        if (nextStatus === 'success') {
            setTimeout(() => window.dispatchEvent(new Event('notification:refresh')), 1500);
        }

        await loadReviewStatus(bookingData);
    };

    useEffect(() => {
        const confirmPayment = async () => {
            const resultCode = searchParams.get('resultCode');
            const extraData = searchParams.get('extraData');
            const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
            const vnp_TxnRef = searchParams.get('vnp_TxnRef');
            let bookingId = searchParams.get('bookingId') || parseBookingIdFromExtraData(extraData);

            try {
                if (resultCode !== null) {
                    if (resultCode === '0') {
                        const allParams = {};
                        searchParams.forEach((value, key) => {
                            allParams[key] = value;
                        });
                        const res = await requestConfirmMomoReturn(allParams);
                        bookingId = res?.metadata?._id || bookingId;
                    } else {
                        // Bấm "Quay về" / hủy trên cổng MoMo — không xác nhận thanh toán, chỉ hiện lại vé
                        if (!bookingId) {
                            setStatus('failed');
                            return;
                        }
                        await fetchAndApplyBookingStatus(bookingId);
                        return;
                    }
                } else if (vnp_ResponseCode !== null) {
                    if (vnp_ResponseCode === '00') {
                        const allParams = {};
                        searchParams.forEach((value, key) => {
                            allParams[key] = value;
                        });
                        const res = await requestConfirmVNPayReturn(allParams);
                        bookingId = res?.metadata?._id || bookingId;
                    } else {
                        if (!bookingId && vnp_TxnRef) {
                            bookingId = vnp_TxnRef.split('_')[1] || null;
                        }
                        if (!bookingId) {
                            setStatus('failed');
                            return;
                        }
                        await fetchAndApplyBookingStatus(bookingId);
                        return;
                    }
                }

                if (!bookingId) {
                    setStatus('failed');
                    return;
                }

                await fetchAndApplyBookingStatus(bookingId);
            } catch (err) {
                console.error('Confirm error:', err);

                if (!bookingId) {
                    bookingId = parseBookingIdFromExtraData(extraData);
                }

                if (bookingId) {
                    try {
                        await fetchAndApplyBookingStatus(bookingId);
                        return;
                    } catch (fetchErr) {
                        console.error('Fetch booking error:', fetchErr);
                    }
                }

                setStatus('failed');
            }
        };

        confirmPayment();
    }, []);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-[#E50914] mx-auto mb-4" size={48} />
                    <p className="text-gray-400 text-lg">Đang xác nhận giao dịch...</p>
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
                            <XCircle className="text-red-500" size={52} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3">Thanh toán thất bại</h1>
                    <p className="text-gray-400 mb-8">Giao dịch bị hủy hoặc có lỗi xảy ra. Vé của bạn chưa được xác nhận.</p>
                    <div className="flex gap-3 justify-center">
                        <Button size="large" onClick={() => navigate(-2)}>Thử lại</Button>
                        <Button size="large" onClick={() => navigate('/user/tickets')}>Vé của tôi</Button>
                    </div>
                </div>
            </div>
        );
    }

    const isPending = status === 'pending';
    const showtime = booking?.showtimeId;
    const movie = showtime?.movieId;
    const room = showtime?.roomId;
    const cinema = room?.cinemaId;
    const voucher = booking?.voucherId;
    const ticketPrice = (booking?.totalPrice || 0) + (booking?.discountAmount || 0);
    const serviceTotal = booking?.services?.reduce((sum, s) => {
        return sum + (s.serviceId?.price || 0) * (s.quantity || 1);
    }, 0) || 0;

    const payMethodLabel = {
        Momo: (
            <span className="flex items-center gap-2">
                <img src="https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png" alt="MoMo" className="w-5 h-5 rounded" />
                MoMo
            </span>
        ),
        VNPay: (
            <span className="flex items-center gap-2">
                <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png" alt="VNPay" className="w-5 h-5 object-contain rounded" />
                VNPay
            </span>
        ),
        MockPayment: (
            <span className="flex items-center gap-2">
                <span className="text-sm">🧪</span>
                Giả lập (Demo)
            </span>
        ),
        Cash: <span className="flex items-center gap-2">💵 Tiền mặt tại quầy</span>,
    };

    const handleResumeMomoPayment = async () => {
        if (!booking?._id) return;
        setIsResumingPayment(true);
        try {
            const res = await requestResumeMomoPayment(booking._id);
            if (res?.metadata?.payUrl) {
                window.location.href = res.metadata.payUrl;
            } else {
                toast.error('Không lấy được link thanh toán MoMo');
            }
        } catch (error) {
            toast.error(error?.message || 'Không thể tạo link thanh toán. Vui lòng thử lại!');
        } finally {
            setIsResumingPayment(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewRating || !reviewText.trim()) {
            message.warning('Vui lòng chọn số sao và nhập bình luận!');
            return;
        }
        try {
            setSubmittingReview(true);
            await requestCreateReview(movie._id, { rating: reviewRating, comment: reviewText });
            message.success('Cảm ơn bạn đã đánh giá!');
            setHasReviewed(true);
            setIsReviewModalOpen(false);
        } catch (error) {
            message.error(error.message || 'Lỗi khi gửi đánh giá');
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-20 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        {isPending ? (
                            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center ring-4 ring-yellow-500/30">
                                <AlertCircle className="text-yellow-500" size={44} />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center ring-4 ring-green-500/30">
                                <CheckCircle className="text-green-500" size={44} />
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-white">
                        {isPending ? 'Chờ thanh toán' : 'Đặt vé thành công! 🎉'}
                    </h1>
                    <p className="text-gray-400 mt-2">
                        {isPending
                            ? 'Đơn đặt vé chưa được thanh toán. Vui lòng hoàn tất thanh toán để nhận vé.'
                            : 'Cảm ơn bạn đã sử dụng TT CINEMA'}
                    </p>
                    {booking?._id && (
                        <div className="mt-3 inline-block bg-[#1a1a1a] px-4 py-1.5 rounded-full border border-white/10">
                            <span className="text-gray-500 text-xs">Mã đặt vé:</span>{' '}
                            <span className={`font-mono font-bold text-sm ${isPending ? 'text-yellow-500' : 'text-[#E50914]'}`}>
                                {booking._id}
                            </span>
                        </div>
                    )}
                </div>

                {/* Ticket Card */}
                <div className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                    {/* Movie Header */}
                    <div className="flex gap-4 p-6 bg-gradient-to-r from-[#1a1a1a] to-[#111111] border-b border-white/5">
                        {movie?.posterUrl && (
                            <img
                                src={`${import.meta.env.VITE_API_URL}${movie.posterUrl}`}
                                alt={movie?.title}
                                className="w-20 h-28 object-cover rounded-lg shrink-0 shadow-lg"
                            />
                        )}
                        <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-[#E50914] text-xs font-bold uppercase tracking-widest mb-1">
                                <Film size={12} />
                                Vé Xem Phim
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight">
                                {movie?.title || 'TT CINEMA'}
                            </h2>
                            {cinema && (
                                <div className="flex items-center gap-1.5 mt-2 text-gray-400 text-sm">
                                    <MapPin size={13} />
                                    {cinema.name} — {room?.name}
                                </div>
                            )}
                            {showtime?.startTime && (
                                <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm">
                                    <Clock size={13} />
                                    {dayjs(showtime.startTime).format('HH:mm — dddd, DD/MM/YYYY')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Seat & Details */}
                    <div className="p-6 space-y-5">
                        {/* Seats */}
                        {booking?.seats?.length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#E50914]/10 flex items-center justify-center shrink-0">
                                    <Armchair size={16} className="text-[#E50914]" />
                                </div>
                                <div>
                                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Ghế đã đặt ({booking.seats.length} ghế)</div>
                                    <div className="flex flex-wrap gap-2">
                                        {booking.seats.map(seat => (
                                            <span
                                                key={seat}
                                                className="bg-[#E50914]/10 text-[#E50914] border border-[#E50914]/30 rounded-md px-2.5 py-0.5 text-sm font-bold font-mono"
                                            >
                                                {seat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Services */}
                        {booking?.services?.filter(s => s.quantity > 0).length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                                    <Coffee size={16} className="text-yellow-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Dịch vụ đi kèm</div>
                                    <div className="space-y-1.5">
                                        {booking.services.filter(s => s.quantity > 0).map((s, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <span className="text-white text-sm">
                                                    {s.serviceId?.name || 'Dịch vụ'} × {s.quantity}
                                                </span>
                                                <span className="text-gray-400 text-sm">
                                                    {((s.serviceId?.price || 0) * s.quantity).toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Voucher */}
                        {voucher && booking?.discountAmount > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                    <Tag size={16} className="text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Mã giảm giá đã áp dụng</div>
                                    <div className="flex justify-between items-center">
                                        <span className="bg-green-500/10 text-green-400 border border-green-500/30 rounded-md px-2.5 py-0.5 text-sm font-bold font-mono">
                                            {voucher.code}
                                        </span>
                                        <span className="text-green-400 font-bold">
                                            - {booking.discountAmount.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment Method */}
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <CreditCard size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phương thức thanh toán</div>
                                <span className="text-white text-sm font-medium">
                                    {payMethodLabel[booking?.paymentMethod] || booking?.paymentMethod}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Dashed Divider (Ticket Tear Effect) */}
                    <div className="relative flex items-center px-6">
                        <div className="w-5 h-5 rounded-full bg-[#050505] absolute -left-3 border-r border-white/10"></div>
                        <div className="flex-1 border-t border-dashed border-white/15"></div>
                        <div className="w-5 h-5 rounded-full bg-[#050505] absolute -right-3 border-l border-white/10"></div>
                    </div>

                    {/* Price Summary */}
                    <div className="p-6 space-y-2">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Tiền vé ({booking?.seats?.length || 0} ghế)</span>
                            <span>{(ticketPrice - serviceTotal).toLocaleString('vi-VN')}đ</span>
                        </div>
                        {serviceTotal > 0 && (
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Dịch vụ đi kèm</span>
                                <span>{serviceTotal.toLocaleString('vi-VN')}đ</span>
                            </div>
                        )}
                        {booking?.discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-400">
                                <span>Giảm giá (Voucher)</span>
                                <span>- {booking.discountAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                        )}
                        <Divider className="border-white/10 my-3" />
                        <div className="flex justify-between items-center">
                            <span className="text-white font-bold text-lg">
                                {isPending ? 'Tổng cần thanh toán' : 'Tổng đã thanh toán'}
                            </span>
                            <span className={`font-black text-2xl ${isPending ? 'text-yellow-500' : 'text-[#E50914]'}`}>
                                {(booking?.totalPrice || 0).toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>

                    {/* QR Code — chỉ hiện khi đã thanh toán */}
                    {!isPending && (booking?.status === 'Paid' || booking?.status === 'CheckedIn') && (
                        <div className="p-6 border-t border-white/5 bg-white flex flex-col items-center justify-center">
                            <QRCode value={booking._id} size={150} />
                            <p className="mt-3 text-black font-bold text-sm">Đưa mã này cho nhân viên soát vé</p>
                            {booking?.status === 'CheckedIn' && <p className="text-green-600 font-bold mt-1 uppercase">Đã soát vé</p>}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    {isPending ? (
                        <>
                            {booking?.paymentMethod === 'Momo' && (
                                <Button
                                    type="primary"
                                    size="large"
                                    className="bg-[#E50914] border-none hover:bg-red-700 font-bold"
                                    loading={isResumingPayment}
                                    onClick={handleResumeMomoPayment}
                                >
                                    <span className="flex items-center gap-2">
                                        <img
                                            src="https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png"
                                            alt="MoMo"
                                            className="w-5 h-5 rounded"
                                        />
                                        Thanh toán MoMo
                                    </span>
                                </Button>
                            )}
                            <Button size="large" onClick={() => navigate('/user/tickets')}>
                                Vé của tôi
                            </Button>
                            <Button size="large" onClick={() => navigate('/')}>
                                Về trang chủ
                            </Button>
                        </>
                    ) : (
                        <>
                            {!hasReviewed && (
                                <Button
                                    type="primary"
                                    size="large"
                                    className="bg-yellow-500 hover:bg-yellow-600 border-none text-black font-bold"
                                    onClick={() => setIsReviewModalOpen(true)}
                                    icon={<Star size={18} />}
                                >
                                    Đánh giá phim ngay
                                </Button>
                            )}
                            <Button size="large" onClick={() => navigate('/')}>
                                Về trang chủ
                            </Button>
                            <Button
                                type="primary"
                                size="large"
                                className="bg-[#E50914]"
                                onClick={() => navigate('/')}
                            >
                                Đặt vé tiếp
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Modal Đánh Giá */}
            <Modal
                title={`Đánh giá phim: ${movie?.title}`}
                open={isReviewModalOpen}
                onCancel={() => setIsReviewModalOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsReviewModalOpen(false)}>
                        Hủy
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={submittingReview} 
                        onClick={handleSubmitReview}
                        className="bg-[#E50914] border-none hover:bg-red-700"
                    >
                        Gửi đánh giá
                    </Button>,
                ]}
            >
                <div className="py-4 space-y-4">
                    <div className="text-center">
                        <Rate value={reviewRating} onChange={setReviewRating} className="text-[#E50914] text-3xl" />
                    </div>
                    <Input.TextArea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Bạn nghĩ gì về bộ phim này? (Cốt truyện, diễn xuất, kỹ xảo...)"
                        rows={4}
                    />
                </div>
            </Modal>
        </div>
    );
}
