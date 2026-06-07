import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Ticket, LogOut, LayoutDashboard, Menu, MessageCircle } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { requestLogout } from '@/config/UserRequest';
import Cookies from 'js-cookie';

const SIDEBAR_LINKS = [
    { name: 'Tổng quan',          path: '/user',               icon: LayoutDashboard },
    { name: 'Thông tin cá nhân',  path: '/user/profile',       icon: User },
    { name: 'Lịch sử đặt vé',    path: '/user/tickets',       icon: Ticket },
    { name: 'Trò chuyện AI',      path: '/user/chat-history',  icon: MessageCircle },
];

export default function UserLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { dataUser } = useStore();

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

    if (!dataUser) return null; // Or a loading spinner

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 pt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-[calc(100vh-64px)]">
                {/* Mobile Sidebar Overlay */}
            {!sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(true)}
                />
            )}

            {/* ── SIDEBAR ────────────────────────────────────────── */}
            <aside 
                className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0a0a0a] border-x border-white/5 flex flex-col transition-transform duration-300 pt-16 lg:pt-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-64'}`}
            >
                {/* User Info Header */}
                <div className="p-6 border-b border-white/5 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#E50914] flex items-center justify-center overflow-hidden mb-3 border-4 border-white/10 shadow-[0_0_15px_rgba(229,9,20,0.3)]">
                        {dataUser.avatar ? (
                            <img src={dataUser.avatar.startsWith('http') ? dataUser.avatar : `${import.meta.env.VITE_API_URL}${dataUser.avatar}`} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-white uppercase">{dataUser.fullName?.charAt(0)}</span>
                        )}
                    </div>
                    <h3 className="text-white font-bold text-lg leading-tight">{dataUser.fullName}</h3>
                    <p className="text-gray-500 text-xs mt-1">{dataUser.email}</p>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                    {SIDEBAR_LINKS.map(link => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path || (link.path !== '/user' && location.pathname.startsWith(link.path));

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                    isActive 
                                        ? 'bg-[#E50914] text-white shadow-red-glow font-medium' 
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/5">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-white/5 hover:text-[#E50914] transition-all duration-200 group"
                    >
                        <LogOut size={20} className="text-gray-500 group-hover:text-[#E50914]" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] border-r border-white/5">
                {/* Mobile Header Toggle */}
                <div className="lg:hidden h-14 border-b border-white/5 flex items-center px-4 bg-[#0a0a0a]">
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Dynamic Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
                    <div className="max-w-full mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
            </div>
        </div>
    );
}
