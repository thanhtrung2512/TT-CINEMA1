import { useEffect, useState } from 'react';
import { requestGetMySessions, requestGetSession, requestDeleteSession } from '@/config/ChatbotRequest';
import { Bot, User, Trash2, ChevronRight, MessageCircle, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { Popconfirm, message } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

// ─── Hiển thị 1 bubble tin nhắn ─────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)' }}>
                    <Bot size={13} style={{ color: '#E50914' }} />
                </div>
            )}
            <div
                className="max-w-[75%] text-sm leading-relaxed whitespace-pre-wrap break-words"
                style={{
                    padding: '10px 14px',
                    borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    background: isUser ? '#E50914' : 'rgba(255,255,255,0.06)',
                    color: isUser ? '#fff' : '#e5e7eb',
                    border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
            >
                {msg.content}
            </div>
            {isUser && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <User size={13} style={{ color: '#d1d5db' }} />
                </div>
            )}
        </div>
    );
}

// ─── Card mỗi phiên chat ─────────────────────────────────────────
function SessionCard({ session, isActive, onClick, onDelete }) {
    return (
        <div
            onClick={onClick}
            className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all group relative"
            style={{
                background: isActive ? 'rgba(229,9,20,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? 'rgba(229,9,20,0.4)' : 'rgba(255,255,255,0.08)'}`,
                marginBottom: 8,
            }}
        >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: isActive ? 'rgba(229,9,20,0.2)' : 'rgba(255,255,255,0.06)' }}>
                <MessageCircle size={16} style={{ color: isActive ? '#E50914' : '#6b7280' }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Clock size={11} />
                    {dayjs(session.lastMessageAt || session.createdAt).fromNow()}
                    <span className="mx-1">·</span>
                    {session.messageCount} tin nhắn
                </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Popconfirm
                    title="Xóa cuộc trò chuyện này?"
                    onConfirm={(e) => { e?.stopPropagation(); onDelete(session._id); }}
                    okText="Xóa"
                    cancelText="Hủy"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Trash2 size={13} />
                    </button>
                </Popconfirm>
                <ChevronRight size={14} style={{ color: '#6b7280' }} />
            </div>
        </div>
    );
}

// ─── Trang chính ─────────────────────────────────────────────────
export default function ChatHistoryPage() {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [activeMessages, setActiveMessages] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            setLoadingSessions(true);
            const res = await requestGetMySessions();
            setSessions(res?.metadata || []);
        } catch {
            message.error('Không thể tải lịch sử trò chuyện');
        } finally {
            setLoadingSessions(false);
        }
    };

    const openSession = async (session) => {
        setActiveSession(session);
        setMobileView('detail');
        setLoadingMessages(true);
        try {
            const res = await requestGetSession(session._id);
            setActiveMessages(res?.metadata?.messages || []);
        } catch {
            message.error('Không thể tải nội dung cuộc trò chuyện');
        } finally {
            setLoadingMessages(false);
        }
    };

    const deleteSession = async (id) => {
        try {
            await requestDeleteSession(id);
            message.success('Đã xóa cuộc trò chuyện');
            if (activeSession?._id === id) {
                setActiveSession(null);
                setActiveMessages([]);
            }
            setSessions((prev) => prev.filter((s) => s._id !== id));
        } catch {
            message.error('Lỗi khi xóa');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <MessageCircle size={22} style={{ color: '#E50914' }} />
                    Lịch Sử Trò Chuyện AI
                </h1>
                <p className="text-gray-500 text-sm mt-1">Xem lại các cuộc hội thoại với trợ lý AI TT CINEMA</p>
            </div>

            {/* Layout 2 cột */}
            <div className="flex gap-4" style={{ height: 'calc(100vh - 240px)', minHeight: 500 }}>

                {/* ── Cột trái: danh sách phiên ─────────────────── */}
                <div
                    className={`flex flex-col ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}`}
                    style={{ width: 300, minWidth: 300, overflowY: 'auto' }}
                >
                    {loadingSessions ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 size={24} className="animate-spin" style={{ color: '#E50914' }} />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MessageCircle size={36} style={{ color: '#374151', marginBottom: 12 }} />
                            <p className="text-gray-500 text-sm">Chưa có cuộc trò chuyện nào</p>
                            <p className="text-gray-600 text-xs mt-1">Hãy thử chat với AI tư vấn ở góc dưới màn hình</p>
                        </div>
                    ) : (
                        sessions.map((s) => (
                            <SessionCard
                                key={s._id}
                                session={s}
                                isActive={activeSession?._id === s._id}
                                onClick={() => openSession(s)}
                                onDelete={deleteSession}
                            />
                        ))
                    )}
                </div>

                {/* ── Cột phải: nội dung phiên ──────────────────── */}
                <div
                    className={`flex-1 rounded-2xl flex flex-col overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}
                    style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                    {!activeSession ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: 'rgba(229,9,20,0.1)' }}>
                                <Bot size={28} style={{ color: '#E50914' }} />
                            </div>
                            <p className="text-gray-400 font-medium">Chọn một cuộc trò chuyện</p>
                            <p className="text-gray-600 text-sm mt-1">Nội dung tin nhắn sẽ hiển thị ở đây</p>
                        </div>
                    ) : (
                        <>
                            {/* Header phiên */}
                            <div className="flex items-center gap-3 px-4 py-3 shrink-0"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                <button
                                    className="md:hidden p-1.5 rounded-lg mr-1"
                                    style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}
                                    onClick={() => setMobileView('list')}
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(229,9,20,0.15)' }}>
                                    <Bot size={15} style={{ color: '#E50914' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-semibold truncate">{activeSession.title}</p>
                                    <p className="text-gray-500 text-xs">
                                        {activeMessages.length} tin nhắn ·{' '}
                                        {dayjs(activeSession.createdAt).format('DD/MM/YYYY HH:mm')}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 size={22} className="animate-spin" style={{ color: '#E50914' }} />
                                    </div>
                                ) : (
                                    activeMessages.map((msg, i) => (
                                        <div key={i}>
                                            <MessageBubble msg={msg} />
                                            <p className="text-[10px] text-gray-600 mt-1 px-9"
                                                style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                                {dayjs(msg.createdAt).format('HH:mm')}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
