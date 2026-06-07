import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, LogOut, Menu, X, User, Bell, ScanLine, MonitorPlay, History, BarChart2, Monitor } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { requestLogout } from '@/config/UserRequest';
import Cookies from 'js-cookie';

const SIDEBAR_LINKS = [
  { name: 'Máy quét vé (Scanner)', path: '/employee/scan', icon: ScanLine },
  { name: 'Bán vé tại quầy (POS)', path: '/employee/pos', icon: MonitorPlay },
  { name: 'Quản lý Phòng & Ghế', path: '/employee/rooms', icon: Monitor },
  { name: 'Báo cáo Ca làm việc', path: '/employee/report', icon: BarChart2 },
  { name: 'Lịch sử giao dịch', path: '/employee/history', icon: History },
];

export default function EmployeeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { dataUser } = useStore();

  const handleLogout = async () => {
    try {
      await requestLogout();
      Cookies.remove('logged');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      Cookies.remove('logged');
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-white/5 justify-between shrink-0">
          <Link to="/employee/scan" className={`flex items-center gap-2 ${!sidebarOpen && 'lg:hidden'}`}>
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[#E50914] shadow-red-glow shrink-0">
              <QrCode size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight leading-none">
              <span className="text-[#E50914]">FLIX</span>
              <span className="text-white">STAFF</span>
            </span>
          </Link>
          <button 
            className="lg:hidden text-gray-400 hover:text-white shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {SIDEBAR_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#E50914]/10 text-[#E50914] font-medium border border-[#E50914]/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[#E50914]' : 'text-gray-500'} />
                <span className={`${!sidebarOpen && 'lg:hidden'} whitespace-nowrap`}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-400 hover:bg-white/5 hover:text-[#E50914] transition-all duration-200"
          >
            <LogOut size={18} />
            <span className={`${!sidebarOpen && 'lg:hidden'} whitespace-nowrap`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
        {/* Top Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-medium text-white hidden sm:block">
              {SIDEBAR_LINKS.find(l => l.path === location.pathname)?.name || 'Quầy soát vé'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E50914]" />
            </button>
            
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/10 overflow-hidden flex items-center justify-center">
                {dataUser?.avatar ? (
                  <img src={dataUser.avatar} alt="Staff" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} className="text-gray-400" />
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white leading-tight">{dataUser?.fullName || 'Nhân viên'}</p>
                <p className="text-xs text-[#E50914]">Quầy soát vé</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-[#050505]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
