import { Link } from 'react-router-dom';
import { Film, MapPin, Phone, Mail, Facebook, Youtube, Instagram, Twitter, Heart } from 'lucide-react';

const footerLinks = [
    {
        title: 'Khám phá',
        links: [
            { label: 'Phim đang chiếu', to: '/movies/now-showing' },
            { label: 'Phim sắp chiếu', to: '/movies/coming-soon' },
            { label: 'Rạp chiếu phim', to: '/cinemas' },
            { label: 'Ưu đãi & Voucher', to: '/vouchers' },
        ],
    },
    {
        title: 'Tài khoản',
        links: [
            { label: 'Đăng nhập', to: '/login' },
            { label: 'Đăng ký', to: '/register' },
            { label: 'Thông tin cá nhân', to: '/user/profile' },
            { label: 'Vé của tôi', to: '/user/tickets' },
        ],
    },
    {
        title: 'Hỗ trợ',
        links: [
            { label: 'Câu hỏi thường gặp', to: '#' },
            { label: 'Chính sách đổi/trả vé', to: '#' },
            { label: 'Điều khoản sử dụng', to: '#' },
            { label: 'Chính sách bảo mật', to: '#' },
        ],
    },
];

const socials = [
    { icon: Facebook, href: '#', label: 'Facebook', color: '#1877F2' },
    { icon: Youtube, href: '#', label: 'YouTube', color: '#FF0000' },
    { icon: Instagram, href: '#', label: 'Instagram', color: '#E1306C' },
    { icon: Twitter, href: '#', label: 'Twitter/X', color: '#1DA1F2' },
];

export default function Footer() {
    return (
        <footer className="bg-[#080808] border-t border-white/5 mt-0">
            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand column */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-5">
                            <div className="w-9 h-9 bg-[#E50914] rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(229,9,20,0.5)]">
                                <Film size={18} className="text-white" />
                            </div>
                            <span className="text-white font-black text-2xl tracking-tight">
                                TT <span className="text-[#E50914]">CINEMA</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-xs">
                            Nền tảng đặt vé xem phim hiện đại, nhanh chóng và tiện lợi hàng đầu Việt Nam. Trải nghiệm điện ảnh đỉnh cao cùng TT CINEMA.
                        </p>

                        {/* Contact */}
                        <div className="space-y-2 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-[#E50914] shrink-0" />
                                <span>123 Đường Điện Ảnh, Q.1, TP.HCM</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} className="text-[#E50914] shrink-0" />
                                <span>1800 1234 (Miễn phí)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={14} className="text-[#E50914] shrink-0" />
                                <span>support@ttcinema.vn</span>
                            </div>
                        </div>

                        {/* Socials */}
                        <div className="flex items-center gap-3 mt-6">
                            {socials.map(({ icon: Icon, href, label, color }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5"
                                    style={{ '--hover-color': color }}
                                    onMouseEnter={e => { e.currentTarget.querySelector('svg').style.color = color; }}
                                    onMouseLeave={e => { e.currentTarget.querySelector('svg').style.color = ''; }}
                                >
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {footerLinks.map(({ title, links }) => (
                        <div key={title}>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">{title}</h4>
                            <ul className="space-y-2.5">
                                {links.map(({ label, to }) => (
                                    <li key={label}>
                                        <Link
                                            to={to}
                                            className="text-gray-400 hover:text-white text-sm transition-colors duration-150 hover:translate-x-1 inline-block"
                                        >
                                            {label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                    <span>© 2026 TT CINEMA. Bảo lưu mọi quyền.</span>
                    <span className="flex items-center gap-1">
                        Tạo với <Heart size={11} className="text-[#E50914] fill-[#E50914] mx-0.5" /> bởi đội ngũ TT CINEMA
                    </span>
                    <div className="flex gap-4">
                        <Link to="#" className="hover:text-gray-400 transition-colors">Điều khoản</Link>
                        <Link to="#" className="hover:text-gray-400 transition-colors">Bảo mật</Link>
                        <Link to="#" className="hover:text-gray-400 transition-colors">Cookie</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
