import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck, Trash2, Ticket, Gift, Info, AlertCircle } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
    requestGetNotifications,
    requestMarkAsRead,
    requestMarkAllAsRead,
    requestDeleteNotification,
} from '@/config/NotificationRequest';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const typeConfig = {
    booking_success: { icon: Ticket, color: 'text-green-400', bg: 'bg-green-500/10' },
    booking_cancelled: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
    checkin: { icon: CheckCheck, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    promotion: { icon: Gift, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    system: { icon: Info, color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

export default function NotificationDropdown() {
    const { dataUser } = useStore();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        if (!dataUser?._id) return;
        try {
            setLoading(true);
            const res = await requestGetNotifications();
            if (res?.metadata) {
                setNotifications(res.metadata.notifications || []);
                setUnreadCount(res.metadata.unreadCount || 0);
            }
        } catch (_) {}
        finally { setLoading(false); }
    }, [dataUser?._id]);

    // Fetch khi mở dropdown
    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    // Polling mỗi 15 giây để lấy số badge mới
    useEffect(() => {
        if (!dataUser?._id) return;
        const poll = async () => {
            try {
                const res = await requestGetNotifications();
                if (res?.metadata) setUnreadCount(res.metadata.unreadCount || 0);
            } catch (_) {}
        };
        poll();
        const interval = setInterval(poll, 15000);

        // Lắng nghe event refresh (được dispatch từ BookingResultPage)
        const handleRefresh = () => fetchNotifications();
        window.addEventListener('notification:refresh', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notification:refresh', handleRefresh);
        };
    }, [dataUser?._id, fetchNotifications]);

    // Đóng khi click ngoài
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMarkRead = async (notif) => {
        if (!notif.isRead) {
            await requestMarkAsRead(notif._id).catch(() => {});
            setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        if (notif.link) {
            navigate(notif.link);
            setOpen(false);
        }
    };

    const handleMarkAllRead = async () => {
        await requestMarkAllAsRead().catch(() => {});
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        await requestDeleteNotification(id).catch(() => {});
        setNotifications(prev => {
            const deleted = prev.find(n => n._id === id);
            if (deleted && !deleted.isRead) setUnreadCount(c => Math.max(0, c - 1));
            return prev.filter(n => n._id !== id);
        });
    };

    if (!dataUser?._id) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(v => !v)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150"
                aria-label="Thông báo"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#E50914] text-white text-[9px] font-black px-0.5 shadow-[0_0_6px_rgba(229,9,20,0.7)] animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl bg-[#111] border border-white/10 overflow-hidden z-50 animate-fade-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-[#E50914]" />
                            <span className="text-white font-bold text-sm">Thông báo</span>
                            {unreadCount > 0 && (
                                <span className="bg-[#E50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                                    title="Đánh dấu tất cả đã đọc"
                                >
                                    <CheckCheck size={12} /> Đọc tất cả
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-white transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-5 h-5 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                                <Bell size={28} className="mb-2 opacity-30" />
                                <span className="text-sm">Chưa có thông báo nào</span>
                            </div>
                        ) : (
                            notifications.map(notif => {
                                const cfg = typeConfig[notif.type] || typeConfig.system;
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleMarkRead(notif)}
                                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 group
                                            ${!notif.isRead ? 'bg-white/[0.03]' : ''}`}
                                    >
                                        {/* Icon */}
                                        <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                            <Icon size={16} className={cfg.color} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-semibold leading-tight ${notif.isRead ? 'text-gray-300' : 'text-white'}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-[#E50914] shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <span className="text-[10px] text-gray-600 mt-1 block">
                                                {dayjs(notif.createdAt).fromNow()}
                                            </span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={(e) => handleDelete(e, notif._id)}
                                            className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all p-1 rounded"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-white/5 text-center">
                            <span className="text-xs text-gray-500">{notifications.length} thông báo</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
