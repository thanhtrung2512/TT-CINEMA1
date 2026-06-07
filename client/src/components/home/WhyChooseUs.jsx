import { Zap, Shield, Smartphone, Ticket, Gift, Clock } from 'lucide-react';

const features = [
    {
        icon: Zap,
        title: 'Đặt vé siêu tốc',
        desc: 'Chỉ 3 bước đơn giản — chọn phim, chọn ghế, thanh toán. Xong ngay trong vòng 1 phút!',
        gradient: 'from-yellow-500 to-orange-500',
        glow: 'rgba(234,179,8,0.2)',
    },
    {
        icon: Shield,
        title: 'Thanh toán an toàn',
        desc: 'Hỗ trợ MoMo, VNPay & thẻ ngân hàng. Giao dịch mã hóa 100% an toàn và bảo mật.',
        gradient: 'from-green-500 to-teal-500',
        glow: 'rgba(34,197,94,0.2)',
    },
    {
        icon: Smartphone,
        title: 'Vé điện tử QR',
        desc: 'Nhận vé ngay trên điện thoại, xuất PDF mang đi. Không cần in vé, quét QR là vào rạp!',
        gradient: 'from-blue-500 to-indigo-500',
        glow: 'rgba(59,130,246,0.2)',
    },
    {
        icon: Ticket,
        title: 'Chọn ghế trực quan',
        desc: 'Sơ đồ ghế ngồi trực quan, dễ chọn. Đặt cặp đôi, nhóm bạn hay cả gia đình cực tiện!',
        gradient: 'from-pink-500 to-rose-500',
        glow: 'rgba(236,72,153,0.2)',
    },
    {
        icon: Gift,
        title: 'Ưu đãi thành viên',
        desc: 'Hệ thống thẻ hạng Bạc, Vàng, Kim Cương với vô số ưu đãi hấp dẫn và quà tặng độc quyền.',
        gradient: 'from-purple-500 to-violet-500',
        glow: 'rgba(168,85,247,0.2)',
    },
    {
        icon: Clock,
        title: 'Lịch chiếu thực-thời',
        desc: 'Cập nhật lịch chiếu liên tục, không lo trễ giờ. Nhận thông báo khi phim yêu thích sắp chiếu.',
        gradient: 'from-[#E50914] to-red-700',
        glow: 'rgba(229,9,20,0.2)',
    },
];

export default function WhyChooseUs() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#E50914]/5 blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <p className="text-[#E50914] font-bold text-sm uppercase tracking-widest mb-3">Tại sao chọn chúng tôi?</p>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Trải nghiệm xem phim<br />
                        <span className="bg-gradient-to-r from-[#E50914] to-orange-500 bg-clip-text text-transparent">đỉnh cao nhất</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        TT CINEMA mang đến hành trình đặt vé hiện đại, nhanh chóng và thú vị hơn bao giờ hết.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map(({ icon: Icon, title, desc, gradient, glow }) => (
                        <div
                            key={title}
                            className="group relative bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300 hover:-translate-y-1"
                            style={{ boxShadow: `0 0 0 transparent`, }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 20px 40px ${glow}`}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 0 transparent'}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg`}>
                                <Icon size={24} className="text-white" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
