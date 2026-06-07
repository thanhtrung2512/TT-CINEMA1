const steps = [
    {
        num: '01',
        title: 'Chọn phim & suất chiếu',
        desc: 'Duyệt qua danh sách phim đang chiếu, đọc mô tả, xem điểm đánh giá và chọn suất chiếu phù hợp với lịch của bạn.',
    },
    {
        num: '02',
        title: 'Chọn ghế ngồi',
        desc: 'Sơ đồ ghế trực quan, màu sắc rõ ràng phân biệt ghế trống, đã đặt và VIP. Chọn vị trí ưng ý chỉ trong vài giây.',
    },
    {
        num: '03',
        title: 'Thêm combo bắp nước',
        desc: 'Đừng bỏ lỡ combo bắp rang bơ và nước ngọt siêu ngon! Đặt trước để tiết kiệm thời gian chờ tại quầy.',
    },
    {
        num: '04',
        title: 'Thanh toán & nhận vé',
        desc: 'Thanh toán qua MoMo hoặc VNPay cực nhanh. Vé QR Code được gửi ngay, tải PDF về điện thoại để soát vé offline.',
    },
];

export default function HowItWorks() {
    return (
        <section className="py-24 bg-[#080808]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <p className="text-[#E50914] font-bold text-sm uppercase tracking-widest mb-3">Quy trình</p>
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Đặt vé chỉ với<br />
                        <span className="bg-gradient-to-r from-[#E50914] to-orange-500 bg-clip-text text-transparent">4 bước đơn giản</span>
                    </h2>
                </div>

                <div className="relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map(({ num, title, desc }) => (
                            <div key={num} className="relative text-center group">
                                {/* Number bubble */}
                                <div className="relative mx-auto w-20 h-20 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center mb-6 group-hover:border-[#E50914]/40 group-hover:shadow-[0_0_20px_rgba(229,9,20,0.2)] transition-all duration-300">
                                    <span className="text-3xl font-black bg-gradient-to-br from-[#E50914] to-orange-500 bg-clip-text text-transparent">{num}</span>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-3">{title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
