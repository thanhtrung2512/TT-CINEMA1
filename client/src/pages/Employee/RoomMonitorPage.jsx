import React, { useState, useEffect } from 'react';
import { Spin, Card, Button, Modal, message, Tag, Select } from 'antd';
import { Monitor, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { requestGetAllShowtimes, requestUpdateSeatMaintenance } from '@/config/ShowtimeRequest';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

export default function RoomMonitorPage() {
    const [loading, setLoading] = useState(true);
    const [showtimes, setShowtimes] = useState([]);
    const [rooms, setRooms] = useState([]);
    
    // Modal State
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [updatingSeat, setUpdatingSeat] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllShowtimes();
            if (res.metadata) {
                // Filter showtimes for today
                const today = dayjs().startOf('day');
                const endOfToday = dayjs().endOf('day');
                
                const todayShowtimes = res.metadata.filter(st => {
                    const stDate = dayjs(st.startTime);
                    return stDate.isBetween(today, endOfToday, null, '[]');
                });
                
                setShowtimes(todayShowtimes);

                // Group by Room
                const roomMap = new Map();
                todayShowtimes.forEach(st => {
                    const roomId = st.roomId?._id;
                    if (!roomId) return;
                    if (!roomMap.has(roomId)) {
                        roomMap.set(roomId, {
                            id: roomId,
                            name: st.roomId.name,
                            cinema: st.roomId.cinemaId?.name,
                            showtimes: []
                        });
                    }
                    roomMap.get(roomId).showtimes.push(st);
                });

                // Sort showtimes inside each room by time
                const groupedRooms = Array.from(roomMap.values());
                groupedRooms.forEach(room => {
                    room.showtimes.sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
                });

                setRooms(groupedRooms);
            }
        } catch (error) {
            message.error('Lỗi tải dữ liệu phòng chiếu');
        } finally {
            setLoading(false);
        }
    };

    const getRoomStatus = (roomShowtimes) => {
        const now = dayjs();
        
        for (let st of roomShowtimes) {
            const start = dayjs(st.startTime);
            const end = dayjs(st.endTime);
            const cleaningEnd = end.add(15, 'minute'); // 15 phút dọn dẹp
            
            if (now.isBetween(start, end)) {
                return { status: 'Playing', text: 'Đang chiếu', color: 'bg-red-500/20 text-red-500 border-red-500/30', movie: st.movieId?.title };
            }
            if (now.isBetween(end, cleaningEnd)) {
                return { status: 'Cleaning', text: 'Cần dọn dẹp', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30 animate-pulse', movie: null };
            }
        }
        
        // Xem suất chiếu tiếp theo là khi nào
        const nextSt = roomShowtimes.find(st => dayjs(st.startTime).isAfter(now));
        if (nextSt) {
            const minsToStart = dayjs(nextSt.startTime).diff(now, 'minute');
            if (minsToStart <= 30) {
                return { status: 'Preparing', text: `Sắp chiếu (còn ${minsToStart}p)`, color: 'bg-blue-500/20 text-blue-500 border-blue-500/30', movie: nextSt.movieId?.title };
            }
        }

        return { status: 'Empty', text: 'Trống', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', movie: null };
    };

    const handleSeatClick = async (seat) => {
        if (seat.status === 'Booked' || seat.status === 'Holding') {
            message.warning('Không thể bảo trì ghế đã có người đặt/giữ!');
            return;
        }

        const isMaintenance = seat.status !== 'Maintenance';
        setUpdatingSeat(`${seat.row}${seat.number}`);
        
        try {
            const res = await requestUpdateSeatMaintenance(selectedShowtime._id, `${seat.row}${seat.number}`, isMaintenance);
            if (res.metadata) {
                message.success(`${isMaintenance ? 'Đã khóa' : 'Đã mở khóa'} ghế ${seat.row}${seat.number}`);
                // Cập nhật lại UI tạm thời
                const updatedShowtime = { ...selectedShowtime };
                const seatIndex = updatedShowtime.seats.findIndex(s => s.row === seat.row && s.number === seat.number);
                if (seatIndex !== -1) {
                    updatedShowtime.seats[seatIndex].status = isMaintenance ? 'Maintenance' : 'Available';
                }
                setSelectedShowtime(updatedShowtime);
            }
        } catch (error) {
            message.error(error.message || 'Lỗi khi cập nhật ghế');
        } finally {
            setUpdatingSeat('');
        }
    };

    const renderSeatMap = () => {
        if (!selectedShowtime) return null;

        const rows = {};
        selectedShowtime.seats.forEach(seat => {
            if (!rows[seat.row]) rows[seat.row] = [];
            rows[seat.row].push(seat);
        });

        // Sắp xếp các hàng từ A -> Z
        const sortedRows = Object.keys(rows).sort();

        return (
            <div className="flex flex-col gap-3 items-center w-full overflow-auto p-4 bg-[#111111] rounded-xl border border-white/5">
                <div className="w-full max-w-2xl h-8 bg-gray-600 rounded-t-3xl flex items-center justify-center mb-8 shadow-[0_10px_20px_rgba(255,255,255,0.1)]">
                    <span className="text-white text-xs font-bold tracking-[0.3em]">MÀN HÌNH</span>
                </div>
                
                {sortedRows.map(rowLabel => {
                    // Sắp xếp ghế trong 1 hàng
                    const seatsInRow = rows[rowLabel].sort((a, b) => a.number - b.number);
                    
                    return (
                        <div key={rowLabel} className="flex gap-2 items-center justify-center">
                            <div className="w-6 text-center font-bold text-gray-500">{rowLabel}</div>
                            {seatsInRow.map(seat => {
                                const seatCode = `${seat.row}${seat.number}`;
                                let bgClass = 'bg-gray-700 hover:bg-gray-500';
                                let textClass = 'text-white';
                                let borderClass = 'border-transparent';
                                let cursorClass = 'cursor-pointer';

                                if (seat.status === 'Booked') {
                                    bgClass = 'bg-[#E50914]';
                                    cursorClass = 'cursor-not-allowed opacity-50';
                                } else if (seat.status === 'Holding') {
                                    bgClass = 'bg-yellow-500';
                                    cursorClass = 'cursor-not-allowed opacity-50';
                                } else if (seat.status === 'Maintenance') {
                                    bgClass = 'bg-gray-900 border-gray-600';
                                    borderClass = 'border-2 border-dashed';
                                    textClass = 'text-gray-500 line-through';
                                } else if (seat.type === 'VIP') {
                                    borderClass = 'border border-yellow-500';
                                } else if (seat.type === 'Sweetbox') {
                                    borderClass = 'border border-pink-500';
                                    bgClass = 'bg-pink-900/30 hover:bg-pink-900/60';
                                }

                                const isUpdating = updatingSeat === seatCode;

                                return (
                                    <button
                                        key={seatCode}
                                        disabled={seat.status === 'Booked' || seat.status === 'Holding' || isUpdating}
                                        onClick={() => handleSeatClick(seat)}
                                        className={`w-8 h-8 md:w-10 md:h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-xs font-bold transition-all ${bgClass} ${borderClass} ${textClass} ${cursorClass}`}
                                    >
                                        {isUpdating ? <Spin size="small" /> : seatCode}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}

                {/* Chú thích */}
                <div className="flex flex-wrap justify-center gap-4 mt-8 pt-4 border-t border-white/10 w-full text-xs text-gray-400">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-700 rounded-sm"></div> Có sẵn</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#E50914] rounded-sm"></div> Đã bán</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-900 border-2 border-dashed border-gray-600 rounded-sm"></div> Bảo trì</div>
                </div>
                <div className="text-center mt-2 text-yellow-500 text-xs">
                    * Bấm vào các ghế trống (Có sẵn) để đổi trạng thái sang Bảo trì (hoặc ngược lại).
                </div>
            </div>
        );
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Spin size="large" /></div>;

    return (
        <div className="p-4 lg:p-8 h-full flex flex-col text-gray-200 overflow-hidden bg-[#0a0a0a]">
            <div className="mb-6 flex justify-between items-center shrink-0">
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                    <Monitor className="text-[#E50914]" size={32} /> Quản Lý Phòng & Ghế
                </h1>
                <Button onClick={fetchData} icon={<Clock size={16} />}>Làm mới</Button>
            </div>

            <div className="flex-1 overflow-auto">
                {rooms.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">Hôm nay không có suất chiếu nào.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {rooms.map(room => {
                            const statusObj = getRoomStatus(room.showtimes);
                            
                            return (
                                <Card 
                                    key={room.id}
                                    className={`bg-[#111111] rounded-2xl border ${statusObj.color} transition-all`}
                                    bodyStyle={{ padding: '20px' }}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{room.name}</h3>
                                            <div className="text-xs text-gray-500 mt-1">{room.cinema}</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusObj.color}`}>
                                            {statusObj.text}
                                        </div>
                                    </div>
                                    
                                    {statusObj.movie && (
                                        <div className="mb-4 text-sm font-bold text-[#E50914]">
                                            Phim: {statusObj.movie}
                                        </div>
                                    )}

                                    <div className="space-y-2 mt-4 max-h-[150px] overflow-auto pr-2 custom-scrollbar">
                                        {room.showtimes.map(st => {
                                            const isPast = dayjs().isAfter(dayjs(st.endTime));
                                            return (
                                                <div 
                                                    key={st._id} 
                                                    className={`flex justify-between items-center p-2 rounded-lg border ${isPast ? 'border-white/5 opacity-50' : 'border-white/10 hover:border-white/30 cursor-pointer'} bg-white/5`}
                                                    onClick={() => {
                                                        if (!isPast) {
                                                            setSelectedShowtime(st);
                                                            setIsModalVisible(true);
                                                        }
                                                    }}
                                                >
                                                    <div className="text-xs">
                                                        <span className="font-bold text-gray-300">{dayjs(st.startTime).format('HH:mm')}</span> - {dayjs(st.endTime).format('HH:mm')}
                                                    </div>
                                                    {!isPast && (
                                                        <Button size="small" type="text" icon={<Wrench size={14} className="text-gray-400" />} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Modal
                title={
                    <div className="flex items-center gap-2 text-white">
                        <Wrench className="text-[#E50914]" size={20} />
                        Bảo trì ghế - Phòng {selectedShowtime?.roomId?.name}
                    </div>
                }
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setSelectedShowtime(null);
                }}
                footer={null}
                width={800}
                className="dark-modal"
            >
                {selectedShowtime && (
                    <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-4">
                            Suất chiếu: <strong className="text-white">{selectedShowtime.movieId?.title}</strong> ({dayjs(selectedShowtime.startTime).format('HH:mm DD/MM')})
                        </div>
                        {renderSeatMap()}
                    </div>
                )}
            </Modal>

            <style jsx global>{`
                .dark-modal .ant-modal-content {
                    background-color: #1a1a1a;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .dark-modal .ant-modal-header {
                    background-color: transparent;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .dark-modal .ant-modal-title {
                    color: white;
                }
                .dark-modal .ant-modal-close {
                    color: rgba(255,255,255,0.5);
                }
                .dark-modal .ant-modal-close:hover {
                    color: white;
                    background-color: rgba(255,255,255,0.1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.2);
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
