import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Spin, Input, Button, message, Select, Tag, Collapse } from 'antd';
import { MonitorPlay, Search, Armchair, ShoppingBag, CreditCard, Printer, CheckCircle, Calendar } from 'lucide-react';
import { requestGetAllShowtimes } from '@/config/ShowtimeRequest';
import { requestGetAllServices } from '@/config/ServiceRequest';
import { requestCreateOfflineBooking } from '@/config/BookingRequest';
import dayjs from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import PrintableTicket from '@/components/Employee/PrintableTicket';

const { Option } = Select;

export default function POSPage() {
    const [showtimes, setShowtimes] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    
    // States
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedServices, setSelectedServices] = useState({});
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    
    // Generate next 3 days for quick selection
    const dateOptions = [0, 1, 2].map(i => {
        const d = dayjs().add(i, 'day');
        return {
            value: d.format('YYYY-MM-DD'),
            label: i === 0 ? 'Hôm nay' : d.format('DD/MM')
        };
    });
    
    // Loading states
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Print
    const printRef = useRef(null);
    const [bookingData, setBookingData] = useState(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Ve_Xem_Phim',
        onAfterPrint: () => {
            message.success('In vé hoàn tất');
            resetPOS();
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [stRes, svRes] = await Promise.all([
                    requestGetAllShowtimes(),
                    requestGetAllServices()
                ]);
                // Chỉ lấy suất chiếu của ngày hôm nay trở đi
                const now = dayjs();
                const validShowtimes = (stRes.metadata || []).filter(st => dayjs(st.startTime).isAfter(now.subtract(2, 'hour')));
                setShowtimes(validShowtimes);
                setServicesList(svRes.metadata || []);
            } catch (error) {
                message.error('Lỗi tải dữ liệu POS');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const resetPOS = () => {
        setSelectedShowtime(null);
        setSelectedSeats([]);
        setSelectedServices({});
        setBookingData(null);
    };

    const handleSelectShowtime = (stId) => {
        const st = showtimes.find(s => s._id === stId);
        setSelectedShowtime(st);
        setSelectedSeats([]);
    };

    const toggleSeat = (seatCode) => {
        setSelectedSeats(prev => 
            prev.includes(seatCode) ? prev.filter(s => s !== seatCode) : [...prev, seatCode]
        );
    };

    const updateService = (id, change) => {
        setSelectedServices(prev => {
            const current = prev[id] || 0;
            const newVal = Math.max(0, current + change);
            if (newVal === 0) {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            }
            return { ...prev, [id]: newVal };
        });
    };

    const calculateTicketTotal = () => {
        let total = 0;
        if (selectedShowtime) {
            selectedSeats.forEach(seatCode => {
                const seatInfo = selectedShowtime.seats.find(s => `${s.row}${s.number}` === seatCode);
                if (seatInfo) {
                    let price = selectedShowtime.price || 50000;
                    if (seatInfo.type === 'VIP') price += 10000;
                    if (seatInfo.type === 'Sweetbox') price += 25000;
                    total += price;
                }
            });
        }
        return total;
    };

    const calculateServiceTotal = () => {
        let total = 0;
        Object.keys(selectedServices).forEach(id => {
            const sv = servicesList.find(s => s._id === id);
            if (sv) total += sv.price * selectedServices[id];
        });
        return total;
    };

    const calculateTotal = () => {
        return calculateTicketTotal() + calculateServiceTotal();
    };

    const handleCheckout = async () => {
        if (!selectedShowtime || selectedSeats.length === 0) {
            message.warning('Vui lòng chọn suất chiếu và ít nhất 1 ghế');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                showtimeId: selectedShowtime._id,
                seats: selectedSeats,
                services: Object.keys(selectedServices).map(id => ({
                    serviceId: id,
                    quantity: selectedServices[id]
                })),
                totalPrice: calculateTotal()
            };

            const res = await requestCreateOfflineBooking(payload);
            message.success('Bán vé thành công! Đang xuất vé...');
            flushSync(() => {
                setBookingData(res.metadata);
            });
            
            // Render xong component ẩn thì gọi máy in (không dùng setTimeout để tránh bị popup blocker chặn)
            handlePrint();

            // Cập nhật lại trạng thái ghế trên UI nội bộ để không ai đặt trùng
            const updatedSt = { ...selectedShowtime };
            updatedSt.seats = updatedSt.seats.map(s => {
                if (selectedSeats.includes(`${s.row}${s.number}`)) {
                    return { ...s, status: 'Booked' };
                }
                return s;
            });
            setSelectedShowtime(updatedSt);

        } catch (error) {
            message.error(error.message || 'Lỗi khi bán vé');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;

    // Group showtimes by Movie
    const moviesMap = new Map();
    const filteredShowtimes = showtimes.filter(st => dayjs(st.startTime).format('YYYY-MM-DD') === selectedDate);
    
    filteredShowtimes.forEach(st => {
        const m = st.movieId;
        if (!m) return;
        if (!moviesMap.has(m._id)) moviesMap.set(m._id, { title: m.title, showtimes: [] });
        moviesMap.get(m._id).showtimes.push(st);
    });

    const collapseItems = Array.from(moviesMap.values()).map((movie, index) => ({
        key: index.toString(),
        label: <span className="font-bold text-white text-sm">{movie.title}</span>,
        children: (
            <div className="grid grid-cols-2 gap-2">
                {movie.showtimes.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).map(st => {
                    const isPast = dayjs().isAfter(dayjs(st.startTime));
                    return (
                        <button
                            key={st._id}
                            onClick={() => !isPast && handleSelectShowtime(st._id)}
                            disabled={isPast}
                            className={`p-2 rounded-lg text-sm border transition-all 
                                ${isPast ? 'bg-[#1a1a1a] border-white/5 text-gray-600 opacity-50 cursor-not-allowed' :
                                selectedShowtime?._id === st._id ? 'bg-[#E50914] border-[#E50914] text-white font-bold shadow-[0_0_10px_rgba(229,9,20,0.3)]' : 
                                'bg-[#1a1a1a] border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}
                            `}
                        >
                            {dayjs(st.startTime).format('HH:mm')}
                            <div className={`text-[10px] mt-1 uppercase ${isPast ? 'opacity-40' : 'opacity-70'}`}>{st.roomId?.name}</div>
                        </button>
                    );
                })}
            </div>
        )
    }));

    return (
        <div className="p-4 lg:p-6 h-full flex flex-col overflow-hidden text-gray-200">
            <h1 className="text-2xl font-black text-white mb-6 flex items-center gap-2 shrink-0">
                <MonitorPlay className="text-[#E50914]" /> Bán Vé Tại Quầy (POS)
            </h1>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Cột 1: Chọn phim & suất chiếu */}
                <div className="w-1/3 flex flex-col bg-[#111111] border border-white/5 rounded-2xl p-4 overflow-hidden shadow-lg">
                    <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-2 shrink-0">
                        <Calendar size={18} className="text-[#E50914]" /> Chọn Phim & Suất
                    </h2>
                    
                    {/* Chọn ngày */}
                    <div className="flex gap-2 mb-4 shrink-0">
                        {dateOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => { setSelectedDate(opt.value); setSelectedShowtime(null); setSelectedSeats([]); }}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedDate === opt.value ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-gray-400 hover:border-white/50'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {collapseItems.length > 0 ? (
                            <Collapse 
                                accordion 
                                defaultActiveKey={['0']} 
                                items={collapseItems} 
                                className="custom-dark-collapse"
                                expandIconPosition="end"
                            />
                        ) : (
                            <div className="text-center text-gray-500 mt-10">Không có suất chiếu nào.</div>
                        )}
                    </div>
                </div>

                {/* Thêm CSS cho Collapse */}
                <style jsx global>{`
                    .custom-dark-collapse {
                        background: transparent;
                        border: none;
                    }
                    .custom-dark-collapse > .ant-collapse-item {
                        background: #1a1a1a;
                        border: 1px solid rgba(255,255,255,0.05);
                        margin-bottom: 8px;
                        border-radius: 8px !important;
                        overflow: hidden;
                    }
                    .custom-dark-collapse > .ant-collapse-item > .ant-collapse-header {
                        color: white !important;
                        padding: 12px 16px !important;
                        align-items: center;
                    }
                    .custom-dark-collapse .ant-collapse-content {
                        background: transparent;
                        border-top: 1px solid rgba(255,255,255,0.05);
                    }
                    .custom-dark-collapse .ant-collapse-content-box {
                        padding: 12px !important;
                    }
                    .custom-dark-collapse .ant-collapse-expand-icon {
                        color: #E50914 !important;
                    }
                `}</style>

                {/* Cột 2: Chọn ghế */}
                <div className="w-1/3 flex flex-col bg-[#111111] border border-white/5 rounded-2xl p-4 overflow-y-auto custom-scrollbar shadow-lg">
                    <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                        <span>2. Chọn Ghế</span>
                        {selectedShowtime && <Tag color="red">{selectedShowtime.price.toLocaleString()} đ/ghế</Tag>}
                    </h2>
                    
                    {!selectedShowtime ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <Armchair size={48} className="mb-4 opacity-50" />
                            <p>Vui lòng chọn suất chiếu trước</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            {/* Màn hình */}
                            <div className="w-full h-8 border-t-4 border-[#E50914] rounded-[50%] mb-12 relative shadow-[0_-15px_30px_rgba(229,9,20,0.15)]">
                                <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 tracking-widest uppercase">Màn hình</span>
                            </div>

                            {/* Lưới ghế */}
                            <div className="grid gap-2 mb-8">
                                {Array.from(new Set(selectedShowtime.seats.map(s => s.row))).sort().map(row => (
                                    <div key={row} className="flex gap-2 items-center justify-center">
                                        <span className="w-6 text-center font-bold text-gray-500 text-sm">{row}</span>
                                        {selectedShowtime.seats.filter(s => s.row === row).sort((a, b) => a.number - b.number).map(seat => {
                                            const seatCode = `${seat.row}${seat.number}`;
                                            const isSelected = selectedSeats.includes(seatCode);
                                            const isAvailable = seat.status === 'Available';
                                            
                                            let widthClass = seat.type === 'Sweetbox' ? 'w-20' : 'w-8';
                                            let seatClass = `${widthClass} h-8 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-medium cursor-pointer transition-all `;
                                            if (!isAvailable) {
                                                seatClass += 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700';
                                            } else if (isSelected) {
                                                seatClass += 'bg-[#E50914] text-white shadow-[0_0_10px_rgba(229,9,20,0.5)] scale-110 border border-[#E50914]';
                                            } else if (seat.type === 'VIP') {
                                                seatClass += 'bg-yellow-900/40 text-yellow-500 border border-yellow-700/50 hover:border-yellow-500';
                                            } else if (seat.type === 'Sweetbox') {
                                                seatClass += 'bg-pink-900/40 text-pink-500 border border-pink-700/50 hover:border-pink-500';
                                            } else {
                                                seatClass += 'bg-gray-800 text-gray-300 border border-gray-600 hover:border-white';
                                            }

                                            return (
                                                <button
                                                    key={seatCode}
                                                    disabled={!isAvailable}
                                                    onClick={() => toggleSeat(seatCode)}
                                                    className={seatClass}
                                                    title={!isAvailable ? 'Đã có người đặt' : ''}
                                                >
                                                    {seat.number}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-4 mt-8 p-3 w-[90%] bg-black/40 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-t-md rounded-b-sm bg-gray-800 border border-gray-600"></div>
                                    <span className="text-xs text-gray-400">Thường</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-t-md rounded-b-sm bg-yellow-900/40 border border-yellow-700/50"></div>
                                    <span className="text-xs text-gray-400">VIP</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-t-md rounded-b-sm bg-[#E50914] shadow-[0_0_8px_rgba(229,9,20,0.6)] border border-[#E50914]"></div>
                                    <span className="text-xs text-gray-400">Đang chọn</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-t-md rounded-b-sm bg-gray-800 border border-gray-700 opacity-50 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-[10px]">X</div>
                                    </div>
                                    <span className="text-xs text-gray-400">Đã bán</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cột 3: Dịch vụ & Thanh toán */}
                <div className="w-1/3 flex flex-col gap-6">
                    <div className="flex-1 bg-[#111111] border border-white/5 rounded-2xl p-4 overflow-y-auto custom-scrollbar shadow-lg">
                        <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">3. Bắp & Nước</h2>
                        <div className="space-y-3">
                            {servicesList.map(sv => (
                                <div key={sv._id} className="flex items-center justify-between p-3 bg-[#1a1a1a] border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-black rounded-lg overflow-hidden">
                                            {sv.imageUrl ? (
                                                <img src={`${import.meta.env.VITE_API_URL}${sv.imageUrl}`} alt={sv.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No Img</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{sv.name}</p>
                                            <p className="text-[#E50914] text-xs font-bold">{sv.price.toLocaleString()} đ</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-white/10">
                                        <button onClick={() => updateService(sv._id, -1)} className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-white">-</button>
                                        <span className="w-4 text-center text-sm font-bold">{selectedServices[sv._id] || 0}</span>
                                        <button onClick={() => updateService(sv._id, 1)} className="w-6 h-6 flex items-center justify-center bg-[#E50914] hover:bg-red-600 rounded text-white">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#111111] border border-white/5 rounded-2xl p-5 shadow-xl shrink-0">
                        <div className="space-y-2 mb-4 text-sm">
                            <div className="flex justify-between text-gray-400">
                                <span>Tiền vé ({selectedSeats.length} ghế)</span>
                                <span className="text-white">{calculateTicketTotal().toLocaleString()} đ</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Bắp nước</span>
                                <span className="text-white">{calculateServiceTotal().toLocaleString()} đ</span>
                            </div>
                            <div className="flex justify-between text-lg font-black pt-3 border-t border-white/10 mt-2">
                                <span className="text-white">TỔNG CỘNG</span>
                                <span className="text-[#E50914]">{calculateTotal().toLocaleString()} đ</span>
                            </div>
                        </div>

                        <Button 
                            type="primary" 
                            size="large" 
                            block 
                            className="h-14 bg-[#E50914] hover:bg-red-600 border-none font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
                            onClick={handleCheckout}
                            loading={isSubmitting}
                            disabled={!selectedShowtime || selectedSeats.length === 0}
                        >
                            <CreditCard size={20} /> THANH TOÁN TIỀN MẶT
                        </Button>
                    </div>
                </div>
            </div>

            {/* Hidden printable area */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                <PrintableTicket ref={printRef} booking={bookingData} />
            </div>
        </div>
    );
}
