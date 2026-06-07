import { useState, useEffect } from 'react';
import { requestGetActiveVouchers } from '@/config/VoucherRequest';
import { Ticket, Copy, CheckCircle2, Clock } from 'lucide-react';
import { Empty, Tooltip } from 'antd';
import dayjs from 'dayjs';

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => {
        const fetchVouchers = async () => {
            setLoading(true);
            try {
                const res = await requestGetActiveVouchers();
                if (res && res.metadata) {
                    setVouchers(res.metadata);
                }
            } catch (error) {
                console.error('Error fetching vouchers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchVouchers();
    }, []);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 flex items-center justify-center">
                        <Ticket className="text-[#E50914]" size={22} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white">Siêu ưu đãi</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Tổng hợp các chương trình khuyến mãi và mã giảm giá mới nhất
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="text-gray-400 animate-pulse">Đang tải danh sách ưu đãi...</div>
                    </div>
                ) : vouchers.length === 0 ? (
                    <div className="py-32 text-center">
                        <Empty description={<span className="text-gray-500">Chưa có mã giảm giá nào ở thời điểm hiện tại</span>} />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {vouchers.map(voucher => (
                            <div 
                                key={voucher._id} 
                                className="relative bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col justify-between overflow-hidden group hover:border-[#E50914]/50 transition-all duration-300"
                            >
                                {/* Background glow effect */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#E50914]/5 rounded-full blur-3xl group-hover:bg-[#E50914]/10 transition-all"></div>

                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-[#E50914] text-white font-bold px-3 py-1 rounded text-sm tracking-wide shadow-[0_0_10px_rgba(229,9,20,0.3)]">
                                            {voucher.discountType === 'percent' ? `GIẢM ${voucher.discountValue}%` : `GIẢM ${voucher.discountValue.toLocaleString('vi-VN')}Đ`}
                                        </div>
                                        {voucher.endDate && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Clock size={12} /> HSD: {dayjs(voucher.endDate).format('DD/MM/YYYY')}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{voucher.title}</h3>
                                    <p className="text-sm text-gray-400 mb-4">{voucher.description}</p>
                                    <div className="text-sm text-gray-500 space-y-1 mb-6">
                                        <p>Đơn tối thiểu: <span className="text-white">{(voucher.minOrderValue || 0).toLocaleString('vi-VN')}đ</span></p>
                                        <p>Còn lại: <span className="text-white">{voucher.usageLimit - voucher.usedCount} lượt</span></p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-white/5 border-dashed flex items-center justify-between">
                                    <div className="font-mono text-[#E50914] text-lg font-bold select-all bg-[#E50914]/10 px-3 py-1 rounded">
                                        {voucher.code}
                                    </div>
                                    <Tooltip title={copiedCode === voucher.code ? "Đã chép" : "Sao chép mã"}>
                                        <button 
                                            onClick={() => handleCopy(voucher.code)}
                                            className={`p-2 rounded-lg transition-colors ${copiedCode === voucher.code ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                                        >
                                            {copiedCode === voucher.code ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
