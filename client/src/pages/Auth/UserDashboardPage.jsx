import { useEffect, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { requestGetMyBookings } from '@/config/BookingRequest';
import { requestGetMyGifts } from '@/config/GiftRequest';
import { Ticket, Star, Clock, Film, Gift, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

export default function UserDashboardPage() {
    const { dataUser } = useStore();
    const [stats, setStats] = useState({
        totalTickets: 0,
        recentMovies: [],
    });
    const [loading, setLoading] = useState(true);
    const [myGifts, setMyGifts] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await requestGetMyBookings();
                if (res && res.metadata) {
                    const paidBookings = res.metadata.filter(b => b.status === 'Paid');
                    
                    // Lấy phim gần đây
                    const recent = paidBookings
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 3)
                        .map(b => b.showtimeId?.movieId)
                        .filter(Boolean);

                    // Remove duplicates
                    const uniqueRecent = Array.from(new Set(recent.map(m => m._id)))
                        .map(id => recent.find(m => m._id === id));

                    setStats({
                        totalTickets: paidBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0),
                        recentMovies: uniqueRecent,
                    });
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        requestGetMyGifts().then(res => setMyGifts(res?.metadata || [])).catch(() => {});
    }, []);

    if (!dataUser) return null;

    return (
        <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-[#E50914] to-red-900 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white mb-2">Xin chào, {dataUser.fullName}! 👋</h1>
                    <p className="text-white/80">Chào mừng bạn quay lại với TT CINEMA. Cùng khám phá những siêu phẩm điện ảnh mới nhất.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#E50914]/10 flex items-center justify-center shrink-0">
                        <Ticket className="text-[#E50914]" size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Vé đã mua</p>
                        <p className="text-3xl font-black text-white">{loading ? '...' : stats.totalTickets}</p>
                    </div>
                </div>
                
                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                        <Star className="text-yellow-500" size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Hạng thành viên</p>
                        <p className="text-xl font-bold text-white mt-1">Standard</p>
                    </div>
                </div>

                <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Clock className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Tham gia từ</p>
                        <p className="text-lg font-bold text-white mt-1">{dayjs(dataUser.createdAt).format('MM/YYYY')}</p>
                    </div>
                </div>
            </div>

            {/* Recent Movies */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Film size={20} className="text-[#E50914]" /> Phim vừa xem
                    </h2>
                    <Link to="/user/tickets" className="text-sm text-gray-400 hover:text-white transition-colors">
                        Xem tất cả lịch sử
                    </Link>
                </div>
                
                {loading ? (
                    <div className="text-gray-500">Đang tải...</div>
                ) : stats.recentMovies.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {stats.recentMovies.map(movie => (
                            <Link key={movie._id} to={`/phim/${movie.slug}`} className="group relative rounded-xl overflow-hidden aspect-[2/3] block">
                                <img 
                                    src={`${import.meta.env.VITE_API_URL}${movie.posterUrl}`} 
                                    alt={movie.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <h3 className="text-white font-bold text-sm leading-tight">{movie.title}</h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#111] border border-white/5 rounded-xl p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mx-auto mb-3">
                            <Film className="text-gray-600" size={24} />
                        </div>
                        <p className="text-gray-400">Bạn chưa xem phim nào gần đây.</p>
                        <Link to="/" className="inline-block mt-4 px-6 py-2 bg-[#E50914] text-white rounded font-medium hover:bg-red-700 transition-colors">
                            Đặt vé ngay
                        </Link>
                    </div>
                )}
            </div>
            {/* Gift Rewards Section */}
            {myGifts.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Gift size={20} className="text-amber-400" />
                        <h2 className="text-xl font-bold text-white">Quà Tặng Của Tôi</h2>
                        <span className="bg-[#E50914] text-white text-xs font-black px-2 py-0.5 rounded-full">{myGifts.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myGifts.map(ug => {
                            const voucher = ug.voucherId;
                            const isExpired = voucher && dayjs().isAfter(dayjs(voucher.validTo));
                            return (
                                <div key={ug._id} className={`relative overflow-hidden rounded-2xl border p-5 ${
                                    isExpired
                                        ? 'bg-gray-900/50 border-white/5 opacity-60'
                                        : 'bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/25'
                                }`}>
                                    {/* Glow orb */}
                                    {!isExpired && <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500 rounded-full opacity-10 blur-2xl" />}
                                    
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                            <Gift size={20} className="text-amber-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white text-sm">{ug.giftSnapshot?.name || ug.giftId?.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Nhận từ đơn hàng • {dayjs(ug.createdAt).format('DD/MM/YYYY')}
                                            </p>
                                        </div>
                                        {isExpired
                                            ? <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full shrink-0">Đã hết hạn</span>
                                            : <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full shrink-0 flex items-center gap-1"><Sparkles size={10} />Còn dùng được</span>
                                        }
                                    </div>

                                    {voucher && (
                                        <div className="mt-4 p-3 bg-black/30 rounded-xl border border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Mã voucher của bạn</p>
                                                    <p className="font-black text-[#E50914] text-lg tracking-widest">{voucher.code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 mb-1">Giảm giá</p>
                                                    <p className="font-bold text-amber-400">
                                                        {voucher.discountType === 'percent'
                                                            ? `${voucher.discountValue}%`
                                                            : `${voucher.discountValue?.toLocaleString('vi-VN')}đ`}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-2">
                                                HSD: {dayjs(voucher.validTo).format('DD/MM/YYYY')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
