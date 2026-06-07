import { useState } from 'react';
import { Search, Bell, Menu, X, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationDropdown from '@/components/common/NotificationDropdown';
import { useStore } from '../../hooks/useStore';
import { requestLogout } from '../../config/UserRequest';
import Cookies from 'js-cookie';

const NAV_LINKS = [
    { label: 'Phim Đang Chiếu', href: '/movies/now-showing' },
    { label: 'Phim Sắp Chiếu', href: '/movies/coming-soon' },
    { label: 'Rạp / Lịch Chiếu', href: '/cinemas' },
    { label: 'Ưu Đãi', href: '/vouchers' },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const { dataUser } = useStore();
    const navigate = useNavigate();

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchValue.trim()) {
            navigate(`/movies/search?q=${encodeURIComponent(searchValue.trim())}`);
            setSearchOpen(false);
            setSearchValue('');
        }
    };

    const handleLogout = async () => {
        try {
            await requestLogout();
            Cookies.remove('logged');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            Cookies.remove('logged');
            window.location.href = '/';
        }
    };

    return (
        <header className="nav-glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* ── LOGO ──────────────────────────────────────────── */}
                    <a href="/" className="flex items-center gap-2 shrink-0">
                        {/* Icon */}
                        <div className="w-7 h-7 rounded-md flex items-center justify-center bg-[#E50914] shadow-red-glow">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 6l4-2 4 2 4-2 4 2v14l-4-2-4 2-4-2-4 2V6z" />
                            </svg>
                        </div>
                        {/* Wordmark */}
                        <span className="text-[1.15rem] font-black tracking-tight leading-none select-none">
                            <span style={{ color: '#E50914' }}>TT </span>
                            <span className="text-white">CINEMA</span>
                        </span>
                    </a>

                    {/* ── DESKTOP NAV LINKS ──────────────────────────────── */}
                    <nav className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(({ label, href }) => (
                            <Link
                                key={label}
                                to={href}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150"
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* ── RIGHT ACTIONS ──────────────────────────────────── */}
                    <div className="flex items-center gap-2">
                        {/* Search — expand on click */}
                        <div className="relative">
                            {searchOpen ? (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Tìm phim..."
                                        className="input-dark w-48 py-1.5 text-sm"
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={handleSearch}
                                        onBlur={() => {
                                            // Delay xíu để click kịp xử lý nếu click vào nút search
                                            setTimeout(() => setSearchOpen(false), 200);
                                        }}
                                    />
                                    <button
                                        className="text-gray-500 hover:text-white transition-colors p-1"
                                        onClick={() => {
                                            setSearchOpen(false);
                                            setSearchValue('');
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSearchOpen(true)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150"
                                    aria-label="Tìm kiếm"
                                >
                                    <Search size={18} />
                                </button>
                            )}
                        </div>

                        {/* Notification bell */}
                        <NotificationDropdown />

                        {/* Avatar / Login */}
                        {dataUser && dataUser._id ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
                                >
                                    <div className="w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center overflow-hidden">
                                        {dataUser.avatar ? (
                                            <img
                                                src={
                                                    dataUser.avatar.startsWith('http')
                                                        ? dataUser.avatar
                                                        : `${import.meta.env.VITE_API_URL}${dataUser.avatar}`
                                                }
                                                alt="avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-white uppercase">
                                                {dataUser.fullName?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden sm:block text-xs font-medium text-gray-300">
                                        {dataUser.fullName}
                                    </span>
                                    <ChevronDown size={12} className="text-gray-600 hidden sm:block" />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-[#111] border border-white/10 overflow-hidden animate-fade-up">
                                        <div className="px-4 py-3 border-b border-white/5">
                                            <p className="text-sm text-white font-medium truncate">
                                                {dataUser.fullName}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{dataUser.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                to="/user/profile"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                Thông tin cá nhân
                                            </Link>
                                            <Link
                                                to="/user/tickets"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                Vé của tôi 🎟️
                                            </Link>
                                            {dataUser.isAdmin && (
                                                <Link
                                                    to="/admin"
                                                    className="block px-4 py-2 text-sm text-yellow-500 hover:bg-white/5 hover:text-yellow-400 transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    Trang Quản trị
                                                </Link>
                                            )}
                                            {(dataUser.isEmployee || dataUser.isAdmin) && (
                                                <Link
                                                    to="/employee/scan"
                                                    className="block px-4 py-2 text-sm text-[#1890ff] hover:bg-white/5 hover:text-blue-400 transition-colors"
                                                    onClick={() => setUserMenuOpen(false)}
                                                >
                                                    Quầy soát vé
                                                </Link>
                                            )}
                                            <div className="border-t border-white/5 my-1"></div>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-[#E50914] hover:bg-white/5 transition-colors"
                                            >
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
                            >
                                <div className="w-6 h-6 rounded-full bg-[#1a1a1a] flex items-center justify-center overflow-hidden">
                                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                    </svg>
                                </div>
                                <span className="hidden sm:block text-xs font-medium text-gray-300">Đăng nhập</span>
                                <ChevronDown size={12} className="text-gray-600 hidden sm:block" />
                            </Link>
                        )}

                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            onClick={() => setMobileOpen((prev) => !prev)}
                            aria-label="Menu"
                        >
                            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {/* ── MOBILE MENU ────────────────────────────────────────── */}
                {mobileOpen && (
                    <div className="md:hidden pb-4 animate-fade-up border-t border-white/5 mt-1">
                        <nav className="flex flex-col gap-1 pt-3">
                            {NAV_LINKS.map(({ label, href }) => (
                                <Link
                                    key={label}
                                    to={href}
                                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {label}
                                </Link>
                            ))}
                            <div className="divider mt-2 mb-2" />
                            {dataUser && dataUser._id ? (
                                <>
                                    <div className="px-3 py-2 text-sm text-white font-medium">{dataUser.fullName}</div>
                                    <Link
                                        to="/user/profile"
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Thông tin cá nhân
                                    </Link>
                                    <Link
                                        to="/user/tickets"
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Vé của tôi 🎟️
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setMobileOpen(false);
                                            handleLogout();
                                        }}
                                        className="btn-primary mt-1 w-full text-center text-sm"
                                    >
                                        Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Đăng nhập
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setMobileOpen(false)}
                                        className="btn-primary mt-1 text-center text-sm"
                                    >
                                        Đăng ký
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
