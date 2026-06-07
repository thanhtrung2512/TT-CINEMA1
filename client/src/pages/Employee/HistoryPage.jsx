import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Table, Input, Button, Tag, Space, message, Spin } from 'antd';
import { History, Search, Printer } from 'lucide-react';
import { requestGetAllBookings } from '@/config/BookingRequest';
import dayjs from 'dayjs';
import { useReactToPrint } from 'react-to-print';
import PrintableTicket from '@/components/Employee/PrintableTicket';

export default function HistoryPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');

    // Print state
    const printRef = useRef(null);
    const [printingBooking, setPrintingBooking] = useState(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: 'Ve_Xem_Phim_Reprint',
        onAfterPrint: () => {
            message.success('In lại vé thành công');
            setPrintingBooking(null);
        },
    });

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await requestGetAllBookings();
            if (res?.metadata) {
                // Sắp xếp vé mới nhất lên đầu
                setBookings(res.metadata.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            }
        } catch (error) {
            message.error('Lỗi khi tải lịch sử vé');
        } finally {
            setLoading(false);
        }
    };

    const handleReprint = (record) => {
        // Dùng flushSync để ép React cập nhật giao diện (truyền dữ liệu vào vé) ngay lập tức
        flushSync(() => {
            setPrintingBooking(record);
        });
        // Sau khi DOM đã có dữ liệu, gọi lệnh in luôn để không bị trình duyệt chặn popup
        handlePrint();
    };

    // Filter by search text (Booking ID or Phone/Email/Name)
    const filteredBookings = bookings.filter(b => {
        const text = searchText.toLowerCase();
        return (
            b._id.toLowerCase().includes(text) ||
            b.userId?.fullName?.toLowerCase().includes(text) ||
            b.userId?.email?.toLowerCase().includes(text)
        );
    });

    const columns = [
        {
            title: 'Mã Vé',
            dataIndex: '_id',
            key: '_id',
            render: (text) => <span className="font-mono text-gray-400">{text.slice(-8).toUpperCase()}</span>,
        },
        {
            title: 'Khách hàng',
            key: 'user',
            render: (_, record) => (
                <div>
                    {record.userId ? (
                        <>
                            <div className="font-bold text-white">{record.userId.fullName}</div>
                            <div className="text-xs text-gray-500">{record.userId.email}</div>
                        </>
                    ) : (
                        <span className="text-gray-500 italic">Khách vãng lai (POS)</span>
                    )}
                </div>
            ),
        },
        {
            title: 'Phim & Suất chiếu',
            key: 'movie',
            render: (_, record) => {
                const st = record.showtimeId;
                if (!st) return <span className="text-red-500">Dữ liệu bị xóa</span>;
                return (
                    <div>
                        <div className="font-bold text-[#E50914]">{st.movieId?.title}</div>
                        <div className="text-xs text-gray-400">
                            {dayjs(st.startTime).format('HH:mm - DD/MM')} | Phòng {st.roomId?.name}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Ghế',
            dataIndex: 'seats',
            key: 'seats',
            render: (seats) => (
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {seats.map(s => <Tag color="default" key={s} className="border-white/20 bg-[#1a1a1a] text-gray-300 m-0">{s}</Tag>)}
                </div>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (price) => <span className="font-bold text-yellow-500">{price.toLocaleString()} đ</span>,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => <span className="text-sm text-gray-400">{dayjs(date).format('DD/MM/YYYY HH:mm')}</span>,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, record) => {
                let color = 'default';
                let text = record.status;
                if (text === 'Pending') color = 'warning';
                if (text === 'Paid') color = 'success';
                if (text === 'CheckedIn') { color = 'purple'; text = 'Đã soát vé'; }
                if (text === 'Cancelled') color = 'error';
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_, record) => (
                <Button 
                    type="primary" 
                    ghost 
                    icon={<Printer size={16} />} 
                    size="small"
                    className="border-gray-600 text-gray-300 hover:text-white hover:border-white"
                    onClick={() => handleReprint(record)}
                    disabled={record.status === 'Cancelled'}
                >
                    In lại
                </Button>
            ),
        },
    ];

    return (
        <div className="p-4 lg:p-6 h-full flex flex-col text-gray-200 overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <History className="text-[#E50914]" /> Lịch sử Giao dịch & In lại vé
                </h1>
                <Input
                    placeholder="Tìm theo Mã vé / Tên khách..."
                    prefix={<Search size={18} className="text-gray-500" />}
                    className="w-80 bg-[#111111] border-white/10 text-white placeholder:text-gray-600 hover:border-white/30"
                    size="large"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            <div className="flex-1 overflow-auto bg-[#111111] rounded-2xl border border-white/5 shadow-xl">
                <Table
                    columns={columns}
                    dataSource={filteredBookings}
                    rowKey="_id"
                    loading={loading}
                    pagination={{ pageSize: 10, position: ['bottomCenter'] }}
                    className="custom-dark-table"
                    scroll={{ x: 1000 }}
                />
            </div>

            {/* Vùng in ẩn */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0 }}>
                <PrintableTicket ref={printRef} booking={printingBooking} />
            </div>
            
            {/* Thêm chút style cho Table Dark Mode */}
            <style jsx global>{`
                .custom-dark-table .ant-table {
                    background: transparent !important;
                    color: #fff !important;
                }
                .custom-dark-table .ant-table-thead > tr > th {
                    background: #1a1a1a !important;
                    color: #aaa !important;
                    border-bottom: 1px solid rgba(255,255,255,0.1) !important;
                }
                .custom-dark-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                }
                .custom-dark-table .ant-table-tbody > tr:hover > td {
                    background: rgba(255,255,255,0.02) !important;
                }
                .custom-dark-table .ant-pagination-item {
                    background: transparent;
                    border-color: rgba(255,255,255,0.2);
                }
                .custom-dark-table .ant-pagination-item a {
                    color: #aaa;
                }
                .custom-dark-table .ant-pagination-item-active {
                    border-color: #E50914;
                    background: rgba(229,9,20,0.1);
                }
                .custom-dark-table .ant-pagination-item-active a {
                    color: #E50914;
                }
                .custom-dark-table .ant-table-placeholder {
                    background: transparent !important;
                }
                .custom-dark-table .ant-empty-description {
                    color: #666;
                }
            `}</style>
        </div>
    );
}
