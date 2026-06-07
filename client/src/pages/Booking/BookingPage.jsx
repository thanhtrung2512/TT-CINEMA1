import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestGetShowtimeById } from '@/config/ShowtimeRequest';
import { requestGetAllServices } from '@/config/ServiceRequest';
import { requestCreateBooking } from '@/config/BookingRequest';
import { requestApplyVoucher, requestGetActiveVouchers } from '@/config/VoucherRequest';
import { requestPayMomo, requestPayVNPay, requestPayCash, requestPayMock } from '@/config/PaymentRequest';
import { Steps, Button, Input, Divider } from 'antd';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import SeatSelection from './components/SeatSelection';
import { useBookingSocket } from '@/hooks/useBookingSocket';
import { useStore } from '@/hooks/useStore';

export default function BookingPage() {
    const { showtimeId } = useParams();
    const navigate = useNavigate();
    const { dataUser } = useStore();
    const myUserId = dataUser?._id || null;

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);

    // Data states
    const [showtime, setShowtime] = useState(null);
    const [services, setServices] = useState([]);

    // Selection states
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedServices, setSelectedServices] = useState({});

    // Realtime: ghế đang bị người KHÁC giữ { seatCode: userId }
    const [heldByOthers, setHeldByOthers] = useState(new Map());

    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
    const [activeVouchers, setActiveVouchers] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('Momo');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Tính toán tiền vé
    const calculateTicketTotal = () => {
        if (!showtime) return 0;
        let total = 0;
        selectedSeats.forEach((seatCode) => {
            // Tìm ghế trong mảng để biết loại ghế
            const seatInfo = showtime.seats.find((s) => `${s.row}${s.number}` === seatCode);
            if (seatInfo) {
                let price = showtime.price || 50000; // Giá cơ bản (nếu chưa có trong DB)
                if (seatInfo.type === 'VIP') price += 10000;
                if (seatInfo.type === 'Sweetbox') price += 25000;
                total += price;
            }
        });
        return total;
    };

    // ── Socket realtime ────────────────────────────────────────────
    const { holdSeat, releaseSeat } = useBookingSocket(showtimeId, {
        onSnapshot: ({ heldSeats }) => {
            const map = new Map();
            heldSeats.forEach(({ seatCode, userId }) => {
                if (String(userId) !== String(myUserId)) map.set(seatCode, userId);
            });
            setHeldByOthers(map);
        },
        onHeld: ({ seatCode, userId }) => {
            if (String(userId) !== String(myUserId)) {
                // Người khác vừa giữ ghế này
                setHeldByOthers(prev => new Map(prev).set(seatCode, userId));
                // Xử lý race condition: nếu mình cũng đã chọn ghế đó (click cùng lúc)
                // thì bị đẩy ra và thông báo
                setSelectedSeats(prev => {
                    if (prev.includes(seatCode)) {
                        toast.warning(`✖ Ghế ${seatCode} vừa bị người khác giữ mất! Vui lòng chọn ghế khác.`);
                        releaseSeat(seatCode); // giải phóng phía server
                        return prev.filter(s => s !== seatCode);
                    }
                    return prev;
                });
            }
        },
        onReleased: ({ seatCode }) => {
            setHeldByOthers(prev => {
                const next = new Map(prev);
                next.delete(seatCode);
                return next;
            });
        },
        onHoldFailed: ({ seatCode, reason }) => {
            // Server từ chối → revert lại UI ngay lập tức
            setSelectedSeats(prev => prev.filter(s => s !== seatCode));
            toast.error(`✖ Ghế ${seatCode} đang bị người khác chọn! Vui lòng chọn ghế khác.`);
        },
    });

    const handleSeatSelect = (seatCode, type) => {
        if (selectedSeats.includes(seatCode)) {
            // Bỏ chọn → thả ghế
            releaseSeat(seatCode);
            setSelectedSeats(prev => prev.filter(code => code !== seatCode));
            if (appliedVoucher) setAppliedVoucher(null);
            return;
        }

        // Kiểm tra trước khi thử giữ
        if (heldByOthers.has(seatCode)) {
            toast.warning('⚠️ Ghế này đang được người khác chọn!');
            return;
        }
        if (selectedSeats.length >= 8) {
            toast.warning('Bạn chỉ được đặt tối đa 8 ghế!');
            return;
        }

        // Optimistic: thêm vào UI ngay
        setSelectedSeats(prev => [...prev, seatCode]);
        // Rồi mới gửi lên server xác nhận
        holdSeat(seatCode);
        if (appliedVoucher) setAppliedVoucher(null);
    };
    // ───────────────────────────────────────────────────────────────

    const handleServiceChange = (serviceId, delta) => {
        setSelectedServices((prev) => {
            const currentQty = prev[serviceId] || 0;
            const newQty = currentQty + delta;
            if (newQty < 0) return prev;
            return { ...prev, [serviceId]: newQty };
        });
        // Hủy voucher nếu đổi dịch vụ
        if (appliedVoucher) setAppliedVoucher(null);
    };

    const calculateServiceTotal = () => {
        let total = 0;
        Object.keys(selectedServices).forEach((serviceId) => {
            const qty = selectedServices[serviceId];
            const service = services.find((s) => s._id === serviceId);
            if (service && qty > 0) {
                total += service.price * qty;
            }
        });
        return total;
    };

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            toast.warning('Vui lòng nhập mã giảm giá');
            return;
        }

        const orderValue = calculateTicketTotal() + calculateServiceTotal();
        setIsApplyingVoucher(true);
        try {
            const res = await requestApplyVoucher(voucherCode, orderValue);
            if (res && res.metadata) {
                setAppliedVoucher({
                    id: res.metadata.voucherId,
                    discountAmount: res.metadata.discountAmount,
                    code: voucherCode.toUpperCase(),
                });
                toast.success('Áp dụng mã giảm giá thành công!');
            }
        } catch (error) {
            toast.error(error.message || 'Mã giảm giá không hợp lệ');
            setAppliedVoucher(null);
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    const ticketTotal = calculateTicketTotal();
    const serviceTotal = calculateServiceTotal();
    const finalTotal = ticketTotal + serviceTotal - (appliedVoucher ? appliedVoucher.discountAmount : 0);

    const handleConfirmPayment = async () => {
        if (selectedSeats.length === 0) {
            toast.warning('Vui lòng chọn ghế!');
            return;
        }
        setIsSubmitting(true);
        try {
            const bookingPayload = {
                showtimeId,
                seats: selectedSeats,
                services: Object.keys(selectedServices)
                    .filter(id => selectedServices[id] > 0)
                    .map(id => ({ serviceId: id, quantity: selectedServices[id] })),
                totalPrice: finalTotal,
                voucherId: appliedVoucher?.id || null,
                discountAmount: appliedVoucher?.discountAmount || 0,
            };

            if (paymentMethod === 'Momo') {
                const res = await requestPayMomo(bookingPayload);
                if (res?.metadata?.payUrl) {
                    window.location.href = res.metadata.payUrl;
                }
            } else if (paymentMethod === 'VNPay') {
                const res = await requestPayVNPay(bookingPayload);
                if (res?.metadata?.payUrl) {
                    window.location.href = res.metadata.payUrl;
                }
            } else if (paymentMethod === 'MockPayment') {
                const res = await requestPayMock(bookingPayload);
                if (res?.metadata?._id) {
                    toast.success('Thanh toán giả lập thành công!');
                    navigate(`/booking/result?bookingId=${res.metadata._id}`);
                } else {
                    toast.error('Không nhận được thông tin vé từ hệ thống!');
                }
            }
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra khi xử lý thanh toán!');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [stRes, svRes, voucherRes] = await Promise.all([
                    requestGetShowtimeById(showtimeId),
                    requestGetAllServices(),
                    requestGetActiveVouchers(),
                ]);
                setShowtime(stRes.metadata);
                setServices(svRes.metadata);
                if (voucherRes && voucherRes.metadata) {
                    setActiveVouchers(voucherRes.metadata);
                }
            } catch (error) {
                toast.error('Lỗi khi tải thông tin suất chiếu');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showtimeId]);

    const handleGoBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
            return;
        }

        selectedSeats.forEach((seatCode) => releaseSeat(seatCode));

        const slug = showtime?.movieId?.slug;
        if (slug) {
            navigate(`/phim/${slug}`);
            return;
        }

        navigate(-1);
    };

    // Steps configuration
    const steps = [
        {
            title: 'Chọn ghế',
            content: (
                <div className="flex flex-col h-full justify-between">
                    <SeatSelection
                        seats={showtime?.seats || []}
                        selectedSeats={selectedSeats}
                        heldByOthers={new Set(heldByOthers.keys())}
                        onSeatSelect={handleSeatSelect}
                    />
                    <div className="mt-8 border-t border-white/10 pt-4 flex justify-between items-center bg-[#0a0a0a] p-4 rounded-xl">
                        <div>
                            <div className="text-gray-400 text-sm">Ghế đã chọn:</div>
                            <div className="text-white font-bold text-lg">
                                {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-400 text-sm">Tạm tính:</div>
                            <div className="text-[#E50914] font-black text-2xl">
                                {ticketTotal.toLocaleString('vi-VN')} đ
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Dịch vụ đi kèm',
            content: (
                <div className="flex flex-col h-full justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                        {services.map((service) => (
                            <div
                                key={service._id}
                                className="bg-[#1a1a1a] rounded-lg p-4 flex gap-4 border border-white/5"
                            >
                                <div className="w-24 h-24 rounded-md overflow-hidden bg-black shrink-0">
                                    {service.imageUrl ? (
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}${service.imageUrl}`}
                                            alt={service.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            No Img
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-white font-bold">{service.name}</h4>
                                        <p className="text-gray-400 text-sm line-clamp-2 mt-1">{service.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[#E50914] font-bold">
                                            {service.price.toLocaleString('vi-VN')}đ
                                        </span>
                                        <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-white/10">
                                            <button
                                                onClick={() => handleServiceChange(service._id, -1)}
                                                className="w-6 h-6 flex items-center justify-center bg-[#1a1a1a] rounded text-white hover:bg-[#E50914] transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-4 text-center font-bold">
                                                {selectedServices[service._id] || 0}
                                            </span>
                                            <button
                                                onClick={() => handleServiceChange(service._id, 1)}
                                                className="w-6 h-6 flex items-center justify-center bg-[#1a1a1a] rounded text-white hover:bg-[#E50914] transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 border-t border-white/10 pt-4 flex justify-between items-center bg-[#0a0a0a] p-4 rounded-xl">
                        <div>
                            <div className="text-gray-400 text-sm">Tiền vé: {ticketTotal.toLocaleString('vi-VN')}đ</div>
                            <div className="text-gray-400 text-sm">
                                Tiền dịch vụ: {serviceTotal.toLocaleString('vi-VN')}đ
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-400 text-sm">Tổng cộng:</div>
                            <div className="text-[#E50914] font-black text-2xl">
                                {(ticketTotal + serviceTotal).toLocaleString('vi-VN')} đ
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Thanh toán',
            content: (
                <div className="max-w-2xl mx-auto py-4">
                    <h3 className="text-2xl font-bold text-white mb-6 text-center">Xác nhận đơn hàng</h3>

                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5 space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Phim</span>
                            <span className="text-white font-bold">{showtime?.movieId?.title}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Rạp & Phòng</span>
                            <span className="text-white">
                                {showtime?.roomId?.cinemaId?.name} - {showtime?.roomId?.name}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Thời gian</span>
                            <span className="text-white">
                                {dayjs(showtime?.startTime).format('HH:mm - DD/MM/YYYY')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Ghế đã chọn ({selectedSeats.length})</span>
                            <span className="text-white">{selectedSeats.join(', ')}</span>
                        </div>

                        <Divider className="border-white/10 my-4" />

                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Tiền vé</span>
                            <span className="text-white">{ticketTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Tiền bắp nước</span>
                            <span className="text-white">{serviceTotal.toLocaleString('vi-VN')}đ</span>
                        </div>

                        {/* VOUCHER SECTION */}
                        <div className="mt-4 p-4 bg-black/40 rounded-lg border border-white/5">
                            <label className="block text-sm text-gray-400 mb-2">Mã giảm giá</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nhập mã giảm giá..."
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                    className="bg-[#1a1a1a] border-white/10 text-white uppercase"
                                    disabled={appliedVoucher !== null}
                                />
                                {appliedVoucher ? (
                                    <Button type="default" danger onClick={() => setAppliedVoucher(null)}>
                                        Hủy
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        className="bg-[#E50914]"
                                        onClick={handleApplyVoucher}
                                        loading={isApplyingVoucher}
                                    >
                                        Áp dụng
                                    </Button>
                                )}
                            </div>
                            {appliedVoucher && (
                                <div className="mt-3 flex justify-between items-center text-green-500 bg-green-500/10 px-3 py-2 rounded">
                                    <span className="text-sm">
                                        Đã áp dụng mã: <b>{appliedVoucher.code}</b>
                                    </span>
                                    <span className="font-bold">
                                        - {appliedVoucher.discountAmount.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            )}

                            {/* Danh sách Voucher khả dụng */}
                            {!appliedVoucher && activeVouchers.length > 0 && (
                                <div className="mt-4 flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                                    {activeVouchers.map((v) => {
                                        const orderValue = ticketTotal + serviceTotal;
                                        const isApplicable = orderValue >= v.minOrderValue;
                                        const discountText =
                                            v.discountType === 'percent'
                                                ? `Giảm ${v.discountValue}% ${v.maxDiscount > 0 ? `(Tối đa ${v.maxDiscount.toLocaleString('vi-VN')}đ)` : ''}`
                                                : `Giảm ${v.discountValue.toLocaleString('vi-VN')}đ`;

                                        return (
                                            <div
                                                key={v._id}
                                                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isApplicable ? 'border-green-500/30 bg-green-500/5 hover:border-green-500/60' : 'border-white/5 bg-white/5 opacity-50 grayscale'}`}
                                            >
                                                <div>
                                                    <div className="font-bold text-white flex items-center gap-2">
                                                        <span className="bg-[#E50914] text-white text-xs px-2 py-0.5 rounded font-mono tracking-wider">
                                                            {v.code}
                                                        </span>
                                                        <span className="text-sm">{discountText}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Đơn tối thiểu {v.minOrderValue.toLocaleString('vi-VN')}đ
                                                    </div>
                                                </div>
                                                {isApplicable ? (
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        ghost
                                                        onClick={() => {
                                                            setVoucherCode(v.code);
                                                            // Không tự động áp dụng để người dùng thấy mã vào ô input, họ sẽ bấm Áp dụng
                                                        }}
                                                    >
                                                        Chọn
                                                    </Button>
                                                ) : (
                                                    <span className="text-[10px] text-gray-500 w-16 text-right">
                                                        Mua thêm{' '}
                                                        {(v.minOrderValue - orderValue).toLocaleString('vi-VN')}đ
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Phương thức Thanh toán */}
                        <Divider className="border-white/10 my-4" />
                        <div>
                            <div className="text-gray-400 text-sm mb-3">Chọn phương thức thanh toán</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { 
                                        key: 'Momo', 
                                        label: 'MoMo', 
                                        desc: 'Ví điện tử MoMo',
                                        icon: <img src="https://developers.momo.vn/v3/assets/images/MOMO-Logo-App-6262c3743a290ef02396a24ea2b66c35.png" alt="MoMo" className="w-10 h-10 object-contain rounded-xl" />
                                    },
                                    { 
                                        key: 'VNPay', 
                                        label: 'VNPay', 
                                        desc: 'Thẻ ATM / QR Code',
                                        icon: <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/6/0oxhzjmxbksr1686814746087.png" alt="VNPay" className="w-10 h-10 object-contain rounded-xl" />
                                    },
                                    { 
                                        key: 'MockPayment', 
                                        label: 'Thử nghiệm (Demo)', 
                                        desc: 'Thanh toán giả lập',
                                        icon: <div className="text-3xl">🧪</div>
                                    },
                                ].map(pm => (
                                    <button
                                        key={pm.key}
                                        onClick={() => setPaymentMethod(pm.key)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                                            paymentMethod === pm.key 
                                                ? 'border-[#E50914] bg-[#E50914]/10 text-white shadow-[0_0_15px_rgba(229,9,20,0.15)]' 
                                                : 'border-white/10 bg-[#1a1a1a] text-gray-400 hover:border-white/30'
                                        }`}
                                    >
                                        {pm.icon}
                                        <div className="text-center">
                                            <div className="font-bold text-sm">{pm.label}</div>
                                            <div className="text-xs opacity-60 mt-0.5">{pm.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Divider className="border-white/10 my-4" />

                        <div className="flex justify-between items-end">
                            <span className="text-gray-400">Tổng thanh toán</span>
                            <div className="text-right">
                                {appliedVoucher && (
                                    <div className="text-gray-500 line-through text-sm">
                                        {(ticketTotal + serviceTotal).toLocaleString('vi-VN')}đ
                                    </div>
                                )}
                                <div className="text-[#E50914] font-black text-3xl">
                                    {finalTotal.toLocaleString('vi-VN')} đ
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    if (loading || !showtime)
        return <div className="min-h-screen bg-[#050505] text-white flex justify-center items-center">Đang tải...</div>;

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
                <Steps
                    current={currentStep}
                    items={steps.map((s) => ({ title: s.title }))}
                    className="mb-10"
                    theme="dark"
                />

                <div className="bg-[#111111] border border-white/10 rounded-xl p-6 min-h-[400px]">
                    {steps[currentStep].content}
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <Button onClick={handleGoBack} size="large">
                        Quay lại
                    </Button>

                    {currentStep < steps.length - 1 && (
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => setCurrentStep((prev) => prev + 1)}
                            disabled={currentStep === 0 && selectedSeats.length === 0}
                            className="bg-[#E50914]"
                        >
                            Tiếp tục
                        </Button>
                    )}

                    {currentStep === steps.length - 1 && (
                        <Button 
                            type="primary" 
                            size="large" 
                            className="bg-green-600 border-none hover:bg-green-500"
                            onClick={handleConfirmPayment}
                            loading={isSubmitting}
                        >
                            Thanh toán qua {paymentMethod}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
