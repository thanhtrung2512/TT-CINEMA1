import React from 'react';
import dayjs from 'dayjs';

const PrintableTicket = React.forwardRef(({ booking }, ref) => {
    // Luôn luôn trả về 1 div wrapper có ref để react-to-print có thể bám vào.
    return (
        <div
            ref={ref}
            className="bg-white text-black p-4 w-[80mm] min-h-[150mm] font-mono text-sm leading-tight mx-auto"
            style={{ fontFamily: 'monospace' }}
        >
            {booking && (
                <>
                    <div className="text-center mb-4 border-b-2 border-black pb-2 border-dashed">
                        <h1 className="text-2xl font-black tracking-tight m-0">TT Cinema</h1>
                        <p className="text-xs m-0 font-bold uppercase">
                            {booking?.showtimeId?.roomId?.cinemaId?.name || 'Cinema'}
                        </p>
                        <p className="text-xs m-0">Hotline: 1900 1234</p>
                    </div>

                    <div className="mb-4">
                        <h2 className="text-lg font-bold uppercase leading-tight mb-2">
                            {booking?.showtimeId?.movieId?.title || 'Phim'}
                        </h2>
                        <div className="flex justify-between mb-1">
                            <span>Ngày: {dayjs(booking?.showtimeId?.startTime).format('DD/MM/YYYY')}</span>
                            <span>Giờ: {dayjs(booking?.showtimeId?.startTime).format('HH:mm')}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                            <span>Phòng: {booking?.showtimeId?.roomId?.name}</span>
                            <span className="font-bold text-base">Ghế: {booking?.seats?.join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Loại vé: Thường</span>
                            <span>
                                {((booking?.totalPrice || 0) + (booking?.discountAmount || 0)).toLocaleString()}đ
                            </span>
                        </div>
                    </div>

                    {/* F&B */}
                    {booking?.services?.length > 0 && (
                        <div className="mb-4 border-t-2 border-black pt-2 border-dashed">
                            <h3 className="font-bold mb-1">Bắp Nước:</h3>
                            {booking.services.map((s, idx) => (
                                <div key={idx} className="flex justify-between text-xs mb-1">
                                    <span>
                                        {s.quantity}x {s.serviceId?.name}
                                    </span>
                                    <span>{((s.serviceId?.price || 0) * s.quantity).toLocaleString()}đ</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total */}
                    <div className="border-t-2 border-black pt-2 border-dashed mt-2">
                        <div className="flex justify-between font-bold text-base">
                            <span>TỔNG CỘNG:</span>
                            <span>{booking?.totalPrice?.toLocaleString()} đ</span>
                        </div>
                        {booking?.paymentMethod && (
                            <div className="flex justify-between text-xs mt-1">
                                <span>Thanh toán:</span>
                                <span>{booking?.paymentMethod === 'Cash' ? 'Tiền mặt' : 'Online'}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-xs mb-1">Quý khách vui lòng kiểm tra lại thông tin</p>
                        <p className="text-xs font-bold">Xin cảm ơn và hẹn gặp lại!</p>
                        <p className="text-[10px] mt-2 opacity-70">
                            {dayjs().format('DD/MM/YYYY HH:mm:ss')} - {booking?._id?.slice(-8).toUpperCase()}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
});

export default PrintableTicket;
