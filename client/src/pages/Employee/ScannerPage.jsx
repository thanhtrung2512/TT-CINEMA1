import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Input, Button, message, Spin, Tag, Modal } from 'antd';
import { Scan, Search, CheckCircle, XCircle, Printer, Ticket } from 'lucide-react';
import { requestVerifyBooking, requestCheckInBooking } from '@/config/BookingRequest';
import dayjs from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import PrintableTicket from '@/components/Employee/PrintableTicket';

export default function ScannerPage() {
    const [scannedId, setScannedId] = useState('');
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);

    // Setup cho In vé
    const printRef = useRef(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Ve_Xem_Phim',
        onAfterPrint: () => {
            message.success('In vé hoàn tất');
            resetScanner();
        },
    });

    const qrCodeRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        
        const startScanner = async () => {
            // Delay 1 chút để đảm bảo DOM sẵn sàng và tránh việc mount/unmount quá nhanh của React StrictMode
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!isMounted) return;

            const html5QrCode = new Html5Qrcode('reader');
            qrCodeRef.current = html5QrCode;

            try {
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        setScannedId(decodedText);
                        html5QrCode.pause();
                        verifyTicket(decodedText);
                    },
                    (errorMessage) => {},
                );
                
                // NẾU component bị unmount ngay trong lúc camera đang khởi động
                if (!isMounted) {
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
                }
            } catch (err) {
                console.error('Lỗi khởi tạo camera:', err);
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (qrCodeRef.current?.isScanning) {
                qrCodeRef.current
                    .stop()
                    .then(() => qrCodeRef.current.clear())
                    .catch(console.error);
            }
        };
    }, []);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!scannedId.trim()) return;
        verifyTicket(scannedId.trim());
    };

    const verifyTicket = async (id) => {
        setLoading(true);
        setBookingData(null);
        try {
            const res = await requestVerifyBooking(id);
            if (res?.metadata) {
                setBookingData(res.metadata);
            }
        } catch (error) {
            message.error(error.message || 'Lỗi kiểm tra vé. Vé không tồn tại!');
            // Nếu lỗi, tự động reset để quét lại
            setTimeout(resetScanner, 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!bookingData?._id) return;
        setCheckingIn(true);
        try {
            const res = await requestCheckInBooking(bookingData._id);
            message.success('Xác nhận vé thành công! Đang tiến hành in vé...');
            setBookingData({ ...bookingData, status: 'CheckedIn' });

            // Trình duyệt có thể chặn lệnh in nếu nằm trong setTimeout
            handlePrint();
        } catch (error) {
            message.error(error.message || 'Lỗi khi xác nhận vé');
        } finally {
            setCheckingIn(false);
        }
    };

    const resetScanner = () => {
        setBookingData(null);
        setScannedId('');

        // Resume lại camera
        if (qrCodeRef.current && qrCodeRef.current.getState() === 2) {
            // getState 2 means PAUSED
            qrCodeRef.current.resume();
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
            {/* Cột trái: Máy Quét */}
            <div className="flex-1 space-y-6">
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <Scan className="text-[#E50914]" /> Quét Mã QR Camera
                    </h2>

                    {/* Khu vực chứa Camera */}
                    <div className="flex justify-center bg-black rounded-lg overflow-hidden border border-white/10">
                        <div id="reader" className="w-full max-w-sm"></div>
                    </div>
                </div>

                <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <Search className="text-[#E50914]" /> Nhập mã vé (Súng bắn / Gõ tay)
                    </h2>
                    <form onSubmit={handleManualSubmit} className="flex gap-3">
                        <Input
                            size="large"
                            placeholder="Nhập mã đơn vé..."
                            value={scannedId}
                            onChange={(e) => setScannedId(e.target.value)}
                            className="bg-[#1a1a1a] border-white/10 text-white flex-1"
                            autoFocus
                        />
                        <Button
                            type="primary"
                            size="large"
                            htmlType="submit"
                            loading={loading}
                            className="bg-[#E50914] border-none font-bold"
                        >
                            Kiểm tra
                        </Button>
                    </form>
                </div>
            </div>

            {/* Cột phải: Thông tin kết quả */}
            <div className="flex-1">
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 shadow-xl h-full flex flex-col">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                        <Ticket className="text-[#E50914]" /> Thông tin vé soát
                    </h2>

                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <Spin size="large" />
                            <p className="mt-4">Đang truy xuất thông tin vé...</p>
                        </div>
                    ) : bookingData ? (
                        <div className="flex-1 flex flex-col">
                            {/* Trạng thái Vé */}
                            <div className="flex justify-center mb-6">
                                {bookingData.status === 'Paid' ? (
                                    <div className="bg-green-500/10 text-green-500 border border-green-500/30 px-6 py-2 rounded-full font-bold flex items-center gap-2">
                                        <CheckCircle size={20} /> Hợp lệ - Chờ nhận vé
                                    </div>
                                ) : bookingData.status === 'CheckedIn' ? (
                                    <div className="bg-blue-500/10 text-blue-500 border border-blue-500/30 px-6 py-2 rounded-full font-bold flex items-center gap-2">
                                        <CheckCircle size={20} /> Vé đã được soát
                                    </div>
                                ) : (
                                    <div className="bg-red-500/10 text-red-500 border border-red-500/30 px-6 py-2 rounded-full font-bold flex items-center gap-2">
                                        <XCircle size={20} /> Không hợp lệ ({bookingData.status})
                                    </div>
                                )}
                            </div>

                            {/* Chi tiết */}
                            <div className="space-y-4 text-sm flex-1">
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-gray-500">Mã vé:</span>
                                    <span className="col-span-2 text-white font-mono font-bold text-base">
                                        {bookingData._id}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-gray-500">Khách hàng:</span>
                                    <span className="col-span-2 text-white font-medium">
                                        {bookingData.userId?.fullName}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-gray-500">Phim:</span>
                                    <span className="col-span-2 text-[#E50914] font-bold text-lg leading-tight">
                                        {bookingData.showtimeId?.movieId?.title}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-gray-500">Suất chiếu:</span>
                                    <span className="col-span-2 text-white font-bold">
                                        {dayjs(bookingData.showtimeId?.startTime).format('HH:mm - DD/MM/YYYY')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-gray-500">Phòng/Rạp:</span>
                                    <span className="col-span-2 text-white">
                                        Phòng {bookingData.showtimeId?.roomId?.name} -{' '}
                                        {bookingData.showtimeId?.roomId?.cinemaId?.name}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-gray-500">Ghế ngồi:</span>
                                    <span className="col-span-2">
                                        <Tag color="error" className="font-bold text-sm">
                                            {bookingData.seats?.join(', ')}
                                        </Tag>
                                    </span>
                                </div>
                                {bookingData.services?.filter((s) => s.quantity > 0).length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 mt-3">
                                        <span className="text-gray-500">Dịch vụ:</span>
                                        <span className="col-span-2 text-yellow-500 font-medium">
                                            {bookingData.services
                                                .filter((s) => s.quantity > 0)
                                                .map((s) => `${s.serviceId?.name} (x${s.quantity})`)
                                                .join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Nút thao tác */}
                            <div className="mt-8 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                                <Button
                                    size="large"
                                    className="bg-[#1a1a1a] text-white border-white/10 hover:border-white/30"
                                    onClick={resetScanner}
                                >
                                    Quét vé khác
                                </Button>

                                <Button
                                    type="primary"
                                    size="large"
                                    className="bg-[#E50914] border-none font-bold flex items-center justify-center gap-2"
                                    onClick={handleCheckIn}
                                    loading={checkingIn}
                                    disabled={bookingData.status !== 'Paid'}
                                >
                                    <Printer size={18} /> Nhận vé & In
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-center">
                            <Scan size={48} className="mb-4 opacity-50" />
                            <p>
                                Hướng camera vào mã QR của khách hàng
                                <br />
                                hoặc nhập mã vé để kiểm tra
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Khu vực ẩn dùng để in (dùng position thay vì display none để tránh lỗi render) */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                <PrintableTicket ref={printRef} booking={bookingData} />
            </div>
        </div>
    );
}
