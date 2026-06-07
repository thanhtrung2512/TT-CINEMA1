import React, { useState, useEffect } from 'react';
import { Spin, Card, Col, Row, Statistic, message } from 'antd';
import { DollarSign, Ticket, ScanLine, UserCircle } from 'lucide-react';
import { requestGetEmployeeReport } from '@/config/BookingRequest';
import { useStore } from '@/hooks/useStore';
import dayjs from 'dayjs';

export default function ReportPage() {
    const { user } = useStore();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        offlineSales: 0,
        offlineCount: 0,
        scannedCount: 0
    });

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await requestGetEmployeeReport();
                if (res.metadata) {
                    setStats(res.metadata);
                }
            } catch (error) {
                message.error('Lỗi khi tải báo cáo doanh thu');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, []);

    if (loading) return <div className="h-full flex items-center justify-center"><Spin size="large" /></div>;

    return (
        <div className="p-4 lg:p-8 h-full flex flex-col text-gray-200 overflow-hidden bg-[#0a0a0a]">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                    <UserCircle className="text-[#E50914]" size={32} /> Báo Cáo Ca Làm Việc
                </h1>
                <p className="text-gray-400 mt-2">
                    Nhân viên: <strong className="text-white">{user?.fullName}</strong> | 
                    Ngày: <strong className="text-white">{dayjs().format('DD/MM/YYYY')}</strong>
                </p>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                    <Card className="bg-[#111111] border border-white/10 rounded-2xl shadow-lg">
                        <Statistic
                            title={<span className="text-gray-400 text-lg font-bold flex items-center gap-2"><DollarSign size={20} className="text-green-500" /> Tiền Mặt Thu Tại Quầy</span>}
                            value={stats.offlineSales}
                            suffix="đ"
                            valueStyle={{ color: '#22c55e', fontSize: '36px', fontWeight: 900, marginTop: '10px' }}
                        />
                        <div className="mt-4 text-sm text-gray-500 border-t border-white/5 pt-3">
                            Tổng số tiền cần nộp lại cho Quản lý cuối ca.
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="bg-[#111111] border border-white/10 rounded-2xl shadow-lg">
                        <Statistic
                            title={<span className="text-gray-400 text-lg font-bold flex items-center gap-2"><Ticket size={20} className="text-blue-500" /> Vé Bán Tại Quầy (POS)</span>}
                            value={stats.offlineCount}
                            suffix="vé"
                            valueStyle={{ color: '#3b82f6', fontSize: '36px', fontWeight: 900, marginTop: '10px' }}
                        />
                        <div className="mt-4 text-sm text-gray-500 border-t border-white/5 pt-3">
                            Số lượng vé in ra trực tiếp bằng tiền mặt.
                        </div>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card className="bg-[#111111] border border-white/10 rounded-2xl shadow-lg">
                        <Statistic
                            title={<span className="text-gray-400 text-lg font-bold flex items-center gap-2"><ScanLine size={20} className="text-purple-500" /> Vé Online Đã Quét</span>}
                            value={stats.scannedCount}
                            suffix="vé"
                            valueStyle={{ color: '#a855f7', fontSize: '36px', fontWeight: 900, marginTop: '10px' }}
                        />
                        <div className="mt-4 text-sm text-gray-500 border-t border-white/5 pt-3">
                            Số khách hàng mua online đã được bạn soát vé vào rạp.
                        </div>
                    </Card>
                </Col>
            </Row>
            
            {/* Lịch sử nhanh */}
            <div className="mt-12">
                <h2 className="text-xl font-bold text-white mb-4">Hướng dẫn bàn giao ca</h2>
                <div className="bg-[#111111] p-6 rounded-2xl border border-white/10 text-gray-400">
                    <p className="mb-2">1. Kiểm tra lại số tiền trong két sắt.</p>
                    <p className="mb-2">2. Đảm bảo <strong>Tiền trong két = Tiền lẻ đầu ca + Tiền Mặt Thu Tại Quầy ({stats.offlineSales.toLocaleString()}đ)</strong>.</p>
                    <p>3. In báo cáo hoặc chụp màn hình này gửi cho Quản lý trước khi ra về.</p>
                </div>
            </div>
        </div>
    );
}
