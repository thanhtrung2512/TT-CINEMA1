import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const stats = [
    { value: '500+', label: 'Bộ phim' },
    { value: '50+', label: 'Rạp chiếu' },
    { value: '1M+', label: 'Khách hàng' },
    { value: '4.9★', label: 'Đánh giá' },
];

export default function CTABanner() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/20 via-[#050505] to-[#1a0a0a] pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50914]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
                    {stats.map(({ value, label }) => (
                        <div key={label} className="text-center p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                            <div className="text-4xl font-black bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent mb-1">{value}</div>
                            <div className="text-gray-400 text-sm">{label}</div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center border border-white/5 rounded-3xl p-12 bg-white/[0.02] backdrop-blur-sm">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Sẵn sàng cho<br />
                        <span className="bg-gradient-to-r from-[#E50914] to-orange-400 bg-clip-text text-transparent">đêm phim tuyệt vời?</span>
                    </h2>
                    <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                        Hàng trăm bộ phim bom tấn đang chờ bạn. Đặt vé ngay hôm nay, nhận ưu đãi thành viên hấp dẫn!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/movies/now-showing"
                            className="inline-flex items-center justify-center gap-2 bg-[#E50914] hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_35px_rgba(229,9,20,0.6)] text-base"
                        >
                            <Play size={20} fill="white" /> Đặt vé ngay
                        </Link>
                        <Link
                            to="/movies/coming-soon"
                            className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 text-white hover:bg-white/5 font-bold px-8 py-4 rounded-xl transition-all duration-200 text-base"
                        >
                            Phim sắp ra mắt
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
