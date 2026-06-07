import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/config/axiosClient';
import { requestAdminConfirmPayment } from '@/config/BookingRequest';
import { Table, Tag, Input, Button, Popconfirm } from 'antd';
import { ReceiptText, Search, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const statusConfig = {
    Paid:      { label: 'Đã TT', color: 'success' },
    Pending:   { label: 'Chờ TT', color: 'warning' },
    Cancelled: { label: 'Đã huỷ', color: 'default' },
    CheckedIn: { label: 'Đã soát vé', color: 'processing' },
};

const payMethod = { Momo: '💜 MoMo', VNPay: '💳 VNPay', MockPayment: '🧪 Giả lập (Demo)', Cash: '💵 Tiền mặt' };

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirmingId, setConfirmingId] = useState(null);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/bookings/all');
            if (res.data?.metadata) setBookings(res.data.metadata);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải danh sách đặt vé');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleConfirmPayment = async (bookingId) => {
        setConfirmingId(bookingId);
        try {
            await requestAdminConfirmPayment(bookingId);
            toast.success('Đã xác nhận thanh toán thành công!');
            fetchBookings();
        } catch (error) {
            toast.error(error?.message || 'Không thể xác nhận thanh toán');
        } finally {
            setConfirmingId(null);
        }
    };

    const filtered = bookings.filter(b => {
        const q = search.toLowerCase();
        const movie = b.showtimeId?.movieId?.title || '';
        const user = b.userId?.fullName || b.userId?.email || '';
        const id = b._id || '';
        return movie.toLowerCase().includes(q) || user.toLowerCase().includes(q) || id.includes(q);
    });

    const columns = [
        {
            title: 'Phim',
            key: 'movie',
            render: (_, b) => (
                <div className="flex items-center gap-3">
                    {b.showtimeId?.movieId?.posterUrl && (
                        <img
                            src={`${import.meta.env.VITE_API_URL}${b.showtimeId.movieId.posterUrl}`}
                            className="w-10 h-14 object-cover rounded"
                            alt=""
                        />
                    )}
                    <div>
                        <div className="font-semibold text-white text-sm">
                            {b.showtimeId?.movieId?.title || 'N/A'}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5">
                            {b.showtimeId?.roomId?.cinemaId?.name || b.showtimeId?.roomId?.name || ''}
                        </div>
                    </div>
                </div>
            ),
            width: 220,
        },
        {
            title: 'Suất chiếu',
            key: 'time',
            render: (_, b) => b.showtimeId?.startTime
                ? dayjs(b.showtimeId.startTime).format('HH:mm DD/MM/YYYY')
                : '—',
            width: 150,
        },
        {
            title: 'Khách hàng',
            key: 'user',
            render: (_, b) => (
                <div>
                    <div className="text-white text-sm">{b.userId?.fullName || '—'}</div>
                    <div className="text-gray-500 text-xs">{b.userId?.email}</div>
                </div>
            ),
            width: 180,
        },
        {
            title: 'Ghế',
            key: 'seats',
            render: (_, b) => (
                <div className="flex flex-wrap gap-1 max-w-[140px]">
                    {(b.seats || []).map(s => (
                        <span key={s} className="bg-[#E50914]/10 text-[#E50914] text-xs px-1.5 py-0.5 rounded font-mono border border-[#E50914]/20">
                            {s}
                        </span>
                    ))}
                </div>
            ),
            width: 160,
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            render: (_, b) => payMethod[b.paymentMethod] || b.paymentMethod,
            width: 130,
        },
        {
            title: 'Tổng tiền',
            key: 'total',
            render: (_, b) => (
                <span className="text-[#E50914] font-bold">
                    {(b.totalPrice || 0).toLocaleString('vi-VN')}đ
                </span>
            ),
            width: 130,
            sorter: (a, b) => a.totalPrice - b.totalPrice,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_, b) => {
                const cfg = statusConfig[b.status] || { label: b.status, color: 'default' };
                return <Tag color={cfg.color}>{cfg.label}</Tag>;
            },
            width: 110,
            filters: [
                { text: 'Đã TT', value: 'Paid' },
                { text: 'Chờ TT', value: 'Pending' },
                { text: 'Đã huỷ', value: 'Cancelled' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Ngày đặt',
            key: 'date',
            render: (_, b) => dayjs(b.createdAt).format('DD/MM/YYYY HH:mm'),
            width: 150,
            sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            defaultSortOrder: 'ascend',
        },
        {
            title: 'Thao tác',
            key: 'actions',
            fixed: 'right',
            width: 160,
            render: (_, b) =>
                b.status === 'Pending' ? (
                    <Popconfirm
                        title="Xác nhận thanh toán?"
                        description="Chuyển đơn từ Chờ TT sang Đã TT. Dùng khi khách đã trả tiền nhưng hệ thống chưa đồng bộ."
                        okText="Xác nhận"
                        cancelText="Huỷ"
                        onConfirm={() => handleConfirmPayment(b._id)}
                    >
                        <Button
                            type="primary"
                            size="small"
                            className="bg-green-600 border-none hover:bg-green-500"
                            loading={confirmingId === b._id}
                            icon={<CheckCircle size={14} />}
                        >
                            Xác nhận TT
                        </Button>
                    </Popconfirm>
                ) : (
                    <span className="text-gray-600 text-xs">—</span>
                ),
        },
    ];

    const paidCount = bookings.filter(b => b.status === 'Paid').length;
    const totalRevenue = bookings.filter(b => b.status === 'Paid').reduce((s, b) => s + (b.totalPrice || 0), 0);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 flex items-center justify-center">
                    <ReceiptText className="text-[#E50914]" size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">Quản lý Đặt vé</h1>
                    <p className="text-sm text-gray-500">Tất cả đơn đặt vé trong hệ thống</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Tổng đơn', value: bookings.length, color: '#6366f1' },
                    { label: 'Đã thanh toán', value: paidCount, color: '#22c55e' },
                    { label: 'Doanh thu', value: totalRevenue.toLocaleString('vi-VN') + 'đ', color: '#E50914' },
                ].map(card => (
                    <div key={card.label} className="bg-[#111] border border-white/5 rounded-xl p-4">
                        <div className="text-gray-400 text-sm">{card.label}</div>
                        <div className="text-2xl font-black mt-1" style={{ color: card.color }}>{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="mb-4">
                <Input
                    prefix={<Search size={14} className="text-gray-500" />}
                    placeholder="Tìm theo phim, khách hàng, mã đơn..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="max-w-sm bg-[#1a1a1a] border-white/10 text-white"
                />
            </div>

            {/* Table */}
            <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={filtered}
                    rowKey="_id"
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    locale={{ emptyText: <span className="text-gray-500">Chưa có đơn đặt vé nào</span> }}
                />
            </div>
        </div>
    );
}
