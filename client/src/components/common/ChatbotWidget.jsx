import React, { useState, useRef, useEffect } from 'react';
import { requestChat, requestGetMySessions, requestGetSession, requestDeleteSession } from '@/config/ChatbotRequest';
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, History, ArrowLeft, Trash2, Clock } from 'lucide-react';
import { Popconfirm, message } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const QUICK_REPLIES = ['Phim đang chiếu?', 'Tư vấn phim hành động', 'Phim gia đình hay?', 'Cách đặt vé?', 'Ưu đãi mới nhất?'];
const WELCOME = 'Xin chào! Tôi là AI tư vấn của TT CINEMA.\nTôi có thể giúp bạn tìm phim hay, hướng dẫn đặt vé và tư vấn ưu đãi. Bạn cần tôi giúp gì hôm nay?';

// ─── Typing animation ─────────────────────────────────────────
function TypingDots() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px' }}>
            {[0, 1, 2].map((i) => (
                <span key={i} className="animate-bounce"
                    style={{ width: 7, height: 7, borderRadius: '50%', background: '#9ca3af', display: 'inline-block', animationDelay: `${i * 0.15}s` }} />
            ))}
        </div>
    );
}

// ─── Message bubble ───────────────────────────────────────────
function Bubble({ msg }) {
    const isUser = msg.role === 'user';
    return (
        <div style={{ display: 'flex', gap: 8, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            {!isUser && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={13} style={{ color: '#E50914' }} />
                </div>
            )}
            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: isUser ? '#E50914' : 'rgba(255,255,255,0.08)', color: isUser ? '#fff' : '#e5e7eb', border: isUser ? 'none' : '1px solid rgba(255,255,255,0.12)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {msg.content}
            </div>
            {isUser && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <User size={13} style={{ color: '#d1d5db' }} />
                </div>
            )}
        </div>
    );
}

// ─── Main Widget ──────────────────────────────────────────────
export default function ChatbotWidget() {
    const [open, setOpen]           = useState(false);
    const [tab, setTab]             = useState('chat');        // 'chat' | 'history'
    const [messages, setMessages]   = useState([{ role: 'assistant', content: WELCOME }]);
    const [input, setInput]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [unread, setUnread]       = useState(0);
    const [sessionId, setSessionId] = useState(() => localStorage.getItem('ttcinema_chat_session') || null);

    // History state
    const [sessions, setSessions]         = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [activeSession, setActiveSession]   = useState(null);   // phiên đang xem
    const [historyMsgs, setHistoryMsgs]       = useState([]);
    const [loadingMsgs, setLoadingMsgs]       = useState(false);

    const bottomRef = useRef(null);
    const inputRef  = useRef(null);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
    useEffect(() => {
        if (open) { setUnread(0); if (tab === 'chat') setTimeout(() => inputRef.current?.focus(), 100); }
    }, [open, tab]);

    // Khôi phục session đang chat sau khi f5
    useEffect(() => {
        if (sessionId) {
            const loadActiveChat = async () => {
                try {
                    const res = await requestGetSession(sessionId);
                    const msgs = res?.metadata?.messages;
                    if (msgs && msgs.length > 0) {
                        setMessages(msgs);
                    }
                } catch {
                    // Nếu lỗi (phiên bị xóa hoặc hết hạn), reset session
                    setSessionId(null);
                    localStorage.removeItem('ttcinema_chat_session');
                }
            };
            loadActiveChat();
        }
    }, []);

    // Load sessions khi mở tab history
    useEffect(() => {
        if (tab === 'history' && sessions.length === 0) {
            loadSessions();
        }
    }, [tab]);

    const loadSessions = async () => {
        try {
            setLoadingSessions(true);
            const res = await requestGetMySessions();
            setSessions(res?.metadata || []);
        } catch { /* chưa đăng nhập hoặc lỗi */ }
        finally { setLoadingSessions(false); }
    };

    const openSession = async (s) => {
        setActiveSession(s);
        setLoadingMsgs(true);
        try {
            const res = await requestGetSession(s._id);
            setHistoryMsgs(res?.metadata?.messages || []);
        } catch { message.error('Không thể tải nội dung'); }
        finally { setLoadingMsgs(false); }
    };

    const deleteSession = async (id, e) => {
        e?.stopPropagation();
        try {
            await requestDeleteSession(id);
            setSessions((p) => p.filter((s) => s._id !== id));
            if (activeSession?._id === id) { setActiveSession(null); setHistoryMsgs([]); }
            message.success('Đã xóa');
        } catch { message.error('Lỗi xóa'); }
    };

    const sendMessage = async (text) => {
        const msg = (text !== undefined ? text : input).trim();
        if (!msg || loading) return;
        setInput('');
        setMessages((p) => [...p, { role: 'user', content: msg }]);
        setLoading(true);
        try {
            const res = await requestChat(msg, sessionId);
            const reply = res?.metadata?.reply || 'Xin lỗi, tôi không thể trả lời lúc này.';
            
            // Lưu session ID vào localStorage để F5 không bị mất
            if (res?.metadata?.sessionId && !sessionId) {
                setSessionId(res.metadata.sessionId);
                localStorage.setItem('ttcinema_chat_session', res.metadata.sessionId);
            }

            setMessages((p) => [...p, { role: 'assistant', content: reply }]);
            if (!open) setUnread((u) => u + 1);
        } catch (err) {
            console.error('[Chatbot]', err);
            setMessages((p) => [...p, { role: 'assistant', content: 'Xin lỗi, đã có lỗi kết nối. Vui lòng thử lại.' }]);
        } finally { setLoading(false); }
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    // ─── Styles ───────────────────────────────────────────────
    const S = {
        window: { position: 'fixed', bottom: 88, right: 24, width: 360, height: 540, zIndex: 50, display: 'flex', flexDirection: 'column', transition: 'all .3s', transformOrigin: 'bottom right', opacity: open ? 1 : 0, transform: open ? 'scale(1)' : 'scale(0.9)', pointerEvents: open ? 'auto' : 'none' },
        inner:  { display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', background: '#111', border: '1px solid rgba(255,255,255,0.1)' },
        header: { background: 'linear-gradient(90deg,#E50914,#c00713)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
        tabs:   { display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
        tab:    (active) => ({ flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 600, textAlign: 'center', cursor: 'pointer', border: 'none', background: 'transparent', color: active ? '#E50914' : '#6b7280', borderBottom: active ? '2px solid #E50914' : '2px solid transparent', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }),
        msgArea:{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 },
        input:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13, resize: 'none', outline: 'none', flex: 1, maxHeight: 80 },
        sendBtn:(active) => ({ width: 38, height: 38, borderRadius: 12, background: active ? '#E50914' : 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: active ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'background .2s' }),
        sessionItem: (isActive) => ({ padding: '12px 14px', borderRadius: 14, marginBottom: 6, cursor: 'pointer', background: isActive ? 'rgba(229,9,20,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? 'rgba(229,9,20,0.4)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'all .15s' }),
    };

    return (
        <>
            {/* ── Chat Window ──────────────────────────────────── */}
            <div style={S.window}>
                <div style={S.inner}>

                    {/* Header */}
                    <div style={S.header}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Bot size={18} color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>TT CINEMA AI</p>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                                Luôn sẵn sàng hỗ trợ
                            </p>
                        </div>
                        <button onClick={() => setOpen(false)} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={S.tabs}>
                        <button style={S.tab(tab === 'chat')} onClick={() => setTab('chat')}>
                            <MessageCircle size={13} /> Chat
                        </button>
                        <button style={S.tab(tab === 'history')} onClick={() => { setTab('history'); setActiveSession(null); }}>
                            <History size={13} /> Lịch sử
                        </button>
                    </div>

                    {/* ── TAB: CHAT ──────────────────────────────── */}
                    {tab === 'chat' && (
                        <>
                            <div style={S.msgArea}>
                                {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
                                {loading && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Bot size={13} style={{ color: '#E50914' }} />
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px 18px 18px 18px' }}>
                                            <TypingDots />
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Quick replies */}
                            {messages.length <= 1 && !loading && (
                                <div style={{ padding: '0 12px 10px', display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0 }}>
                                    {QUICK_REPLIES.map((q) => (
                                        <button key={q} onClick={() => sendMessage(q)}
                                            style={{ padding: '5px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: '#d1d5db', background: 'transparent', fontSize: 11, cursor: 'pointer' }}>
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKey} placeholder="Nhập câu hỏi của bạn..." rows={1}
                                    disabled={loading} style={S.input} />
                                <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={S.sendBtn(input.trim() && !loading)}>
                                    {loading ? <Loader2 size={15} color="#9ca3af" className="animate-spin" /> : <Send size={15} color={input.trim() ? '#fff' : '#6b7280'} />}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── TAB: HISTORY ───────────────────────────── */}
                    {tab === 'history' && (
                        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            {/* Detail view */}
                            {activeSession ? (
                                <>
                                    <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        <button onClick={() => { setActiveSession(null); setHistoryMsgs([]); }}
                                            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '4px 8px', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <ArrowLeft size={14} />
                                        </button>
                                        <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeSession.title}</p>
                                    </div>
                                    <div style={{ ...S.msgArea }}>
                                        {loadingMsgs ? (
                                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                                                <Loader2 size={20} className="animate-spin" style={{ color: '#E50914' }} />
                                            </div>
                                        ) : historyMsgs.map((msg, i) => <Bubble key={i} msg={msg} />)}
                                    </div>
                                </>
                            ) : (
                                /* Session list */
                                <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                                    {loadingSessions ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                                            <Loader2 size={20} className="animate-spin" style={{ color: '#E50914' }} />
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280' }}>
                                            <History size={32} style={{ margin: '0 auto 12px', color: '#374151' }} />
                                            <p style={{ fontSize: 13 }}>Chưa có cuộc trò chuyện nào</p>
                                            <p style={{ fontSize: 11, marginTop: 4, color: '#4b5563' }}>Hãy bắt đầu chat để lưu lịch sử</p>
                                        </div>
                                    ) : sessions.map((s) => (
                                        <div key={s._id} style={S.sessionItem(false)} onClick={() => openSession(s)}>
                                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <MessageCircle size={14} style={{ color: '#6b7280' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                                                <p style={{ color: '#6b7280', fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Clock size={10} />
                                                    {dayjs(s.lastMessageAt || s.createdAt).fromNow()}
                                                    <span style={{ margin: '0 2px' }}>·</span>
                                                    {s.messageCount} tin
                                                </p>
                                            </div>
                                            <Popconfirm title="Xóa cuộc trò chuyện?" onConfirm={(e) => deleteSession(s._id, e)} okText="Xóa" cancelText="Hủy" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={(e) => e.stopPropagation()}
                                                    style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '4px 6px', color: '#f87171', cursor: 'pointer', flexShrink: 0 }}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </Popconfirm>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* ── FAB ────────────────────────────────────────────── */}
            <button onClick={() => setOpen((o) => !o)}
                style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#E50914,#c00713)', border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px rgba(229,9,20,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                title="Chat với AI tư vấn"
            >
                {open ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
                {!open && unread > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#facc15', color: '#000', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {unread}
                    </span>
                )}
            </button>
        </>
    );
}
