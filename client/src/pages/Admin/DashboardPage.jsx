import React, { useEffect, useState, useCallback } from 'react';
import { Users, Film, Ticket, TrendingUp, RefreshCw, ArrowUpRight, Clapperboard, Star, CalendarDays } from 'lucide-react';
import { Spin } from 'antd';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell,
} from 'recharts';
import { requestGetDashboardStats } from '@/config/StatisticRequest';
import dayjs from 'dayjs';

const CHART_COLORS = ['#E50914', '#00E5BE', '#7C3AED', '#F59E0B', '#3B82F6'];
const PERIOD_TABS = [
    { key: 'weekly',  label: '7 Ngày',  icon: '📅' },
    { key: 'monthly', label: '12 Tháng', icon: '📆' },
    { key: 'yearly',  label: '5 Năm',   icon: '🗓️' },
];

/* ── Animated Counter ────────────────────────── */
function AnimatedNumber({ value, duration = 1200, suffix = '' }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = Math.ceil(value / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= value) { setDisplay(value); clearInterval(timer); }
            else setDisplay(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{display.toLocaleString('vi-VN')}{suffix}</span>;
}

/* ── Custom Tooltip ──────────────────────────── */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'linear-gradient(135deg,rgba(18,18,18,0.98),rgba(28,28,28,0.95))',
            border: '1px solid rgba(229,9,20,0.25)',
            borderRadius: 12, padding: '10px 16px',
            boxShadow: '0 8px 32px rgba(229,9,20,0.15)',
            minWidth: 160,
        }}>
            <p style={{ color: '#888', fontSize: 11, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
            <p style={{ color: '#E50914', fontWeight: 900, fontSize: 16, marginBottom: 2 }}>
                {payload[0]?.value?.toLocaleString('vi-VN')} đ
            </p>
            {payload[1] && (
                <p style={{ color: '#00E5BE', fontWeight: 700, fontSize: 13 }}>
                    {payload[1].value.toLocaleString('vi-VN')} vé
                </p>
            )}
        </div>
    );
}

/* ── Skeleton ────────────────────────────────── */
function SkeletonCard() {
    return (
        <div className="bg-[#111] rounded-2xl border border-white/5 p-5 animate-pulse">
            <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-white/5 rounded w-20" />
                    <div className="h-7 bg-white/10 rounded w-36" />
                </div>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activePeriod, setActivePeriod] = useState('weekly');
    const [stats, setStats] = useState({
        overview: { totalRevenue: 0, totalTickets: 0, activeMovies: 0, totalCustomers: 0 },
        charts: { weekly: [], monthly: [], yearly: [] },
        topMovies: [],
    });

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true); else setLoading(true);
            const res = await requestGetDashboardStats();
            if (res?.metadata) setStats(res.metadata);
        } catch { /* graceful */ }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const chartData = stats.charts[activePeriod] || [];

    const cards = [
        { label: 'Tổng Doanh Thu', value: stats.overview.totalRevenue, suffix: ' đ', icon: TrendingUp, gradient: 'from-green-600/25 to-emerald-900/10', iconBg: 'bg-green-500/20', iconColor: 'text-green-400', border: 'border-green-500/15', glow: '#22c55e' },
        { label: 'Lượt Vé Bán Ra', value: stats.overview.totalTickets, suffix: ' vé', icon: Ticket, gradient: 'from-blue-600/25 to-blue-900/10', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', border: 'border-blue-500/15', glow: '#3b82f6' },
        { label: 'Phim Đang Chiếu', value: stats.overview.activeMovies, suffix: ' phim', icon: Clapperboard, gradient: 'from-red-700/25 to-red-900/10', iconBg: 'bg-red-500/20', iconColor: 'text-[#E50914]', border: 'border-red-500/15', glow: '#E50914' },
        { label: 'Khách Hàng', value: stats.overview.totalCustomers, suffix: ' người', icon: Users, gradient: 'from-purple-600/25 to-purple-900/10', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', border: 'border-purple-500/15', glow: '#a855f7' },
    ];

    return (
        <div className="space-y-8 pb-12">

            {/* ── Header ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <p className="text-[#E50914] text-xs font-bold uppercase tracking-widest mb-1">Admin Dashboard</p>
                    <h1 className="text-3xl font-black text-white tracking-tight">Tổng Quan Hệ Thống</h1>
                    <p className="text-gray-600 mt-1 text-sm">Cập nhật: {dayjs().format('HH:mm — DD/MM/YYYY')}</p>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-400 hover:text-white transition-all"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    Làm mới dữ liệu
                </button>
            </div>

            {/* ── Overview Cards ─────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {loading
                    ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
                    : cards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div key={idx}
                                className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-2xl border ${card.border} p-5 shadow-xl hover:-translate-y-1 transition-transform duration-300`}
                            >
                                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: card.glow }} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-11 h-11 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                                        <Icon size={20} className={card.iconColor} />
                                    </div>
                                    <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />LIVE
                                    </span>
                                </div>
                                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{card.label}</p>
                                <h3 className="text-2xl font-black text-white">
                                    <AnimatedNumber value={card.value} suffix={card.suffix} />
                                </h3>
                            </div>
                        );
                    })
                }
            </div>

            {/* ── Main Chart Section ─────────────────── */}
            <div className="bg-[#0d0d0d] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                {/* Chart Header + Period Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <CalendarDays size={18} className="text-[#E50914]" />
                            Biểu Đồ Doanh Thu
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5">Doanh thu & số vé bán ra theo thời gian</p>
                    </div>

                    {/* Period Tabs */}
                    <div className="flex gap-1 bg-[#111] rounded-xl p-1 border border-white/5">
                        {PERIOD_TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActivePeriod(tab.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                    activePeriod === tab.key
                                        ? 'bg-[#E50914] text-white shadow-lg shadow-red-900/40'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart Body */}
                <div className="p-6 h-[360px]">
                    {loading ? (
                        <div className="h-full flex items-center justify-center"><Spin size="large" /></div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="areaRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E50914" stopOpacity={0.55} />
                                        <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="areaTickets" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00E5BE" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#00E5BE" stopOpacity={0} />
                                    </linearGradient>
                                    <filter id="glowRed">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 8" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                <XAxis dataKey="label" stroke="transparent" tick={{ fill: '#555', fontSize: 12 }} tickLine={false} tickMargin={12} />
                                <YAxis yAxisId="revenue" stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} axisLine={false}
                                    tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                                    width={56}
                                />
                                <YAxis yAxisId="tickets" orientation="right" stroke="transparent" tick={{ fill: '#555', fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#E50914" strokeWidth={3}
                                    fill="url(#areaRevenue)" filter="url(#glowRed)"
                                    dot={false} activeDot={{ r: 6, fill: '#fff', stroke: '#E50914', strokeWidth: 3 }}
                                />
                                <Area yAxisId="tickets" type="monotone" dataKey="tickets" stroke="#00E5BE" strokeWidth={2}
                                    fill="url(#areaTickets)" strokeDasharray="6 3"
                                    dot={false} activeDot={{ r: 5, fill: '#fff', stroke: '#00E5BE', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3">
                            <TrendingUp size={44} className="opacity-20" />
                            <p className="text-sm">Chưa có dữ liệu cho khoảng thời gian này</p>
                        </div>
                    )}
                </div>

                {/* Chart Legend */}
                <div className="px-6 pb-5 flex items-center gap-6 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-6 h-0.5 bg-[#E50914]" />
                        Doanh thu (VNĐ)
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-6 h-0.5 bg-[#00E5BE] border-t-2 border-dashed" style={{ borderColor: '#00E5BE', background: 'none' }} />
                        <div className="w-6 h-[2px]" style={{ background: 'repeating-linear-gradient(to right, #00E5BE, #00E5BE 4px, transparent 4px, transparent 8px)' }} />
                        Số vé
                    </div>
                    <div className="ml-auto text-xs text-gray-600">
                        {activePeriod === 'weekly' && 'Hiển thị 7 ngày gần nhất'}
                        {activePeriod === 'monthly' && 'Hiển thị 12 tháng gần nhất'}
                        {activePeriod === 'yearly' && 'Hiển thị 5 năm gần nhất'}
                    </div>
                </div>
            </div>

            {/* ── Bottom Row ──────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                {/* Bar Chart */}
                <div className="xl:col-span-3 bg-[#0d0d0d] rounded-2xl border border-white/5 p-6 shadow-2xl">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00E5BE]" />
                            So Sánh Doanh Thu Top Phim
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5">5 bộ phim có doanh thu cao nhất mọi thời đại</p>
                    </div>
                    <div className="h-[260px]">
                        {loading ? <div className="h-full flex items-center justify-center"><Spin /></div>
                            : stats.topMovies.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.topMovies} margin={{ top: 5, right: 5, left: 0, bottom: 45 }}>
                                        <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.04)" horizontal vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11 }} tickLine={false} axisLine={false}
                                            interval={0} angle={-18} textAnchor="end" height={60} />
                                        <YAxis tick={{ fill: '#666', fontSize: 11 }} tickLine={false} axisLine={false}
                                            tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : `${v/1000}k`} />
                                        <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                                            contentStyle={{ background: 'rgba(12,12,12,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 13 }}
                                            formatter={v => [`${v.toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
                                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={56}>
                                            {stats.topMovies.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-600 text-sm">Chưa có dữ liệu</div>
                            )
                        }
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="xl:col-span-2 bg-[#0d0d0d] rounded-2xl border border-white/5 p-6 shadow-2xl">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Star size={18} className="text-[#E50914]" fill="#E50914" />
                            Bảng Xếp Hạng Phim
                        </h2>
                        <p className="text-gray-500 text-xs mt-0.5">Doanh thu & số vé chi tiết</p>
                    </div>
                    {loading ? (
                        <div className="space-y-3">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="animate-pulse flex gap-3 items-center py-2">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 bg-white/5 rounded w-3/4" />
                                        <div className="h-2 bg-white/5 rounded w-1/2" />
                                    </div>
                                    <div className="h-4 bg-white/5 rounded w-16" />
                                </div>
                            ))}
                        </div>
                    ) : stats.topMovies.length > 0 ? (
                        <div className="space-y-1">
                            {stats.topMovies.map((movie, idx) => {
                                const color = CHART_COLORS[idx];
                                return (
                                    <div key={idx} className="flex items-center gap-3 py-2.5 px-2 rounded-xl hover:bg-white/4 transition-colors">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                                            style={{ background: `${color}25`, border: `1px solid ${color}40`, color }}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-semibold truncate leading-snug">{movie.name}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Ticket size={10} className="text-gray-600" />
                                                <span className="text-xs text-gray-500">{movie.tickets} vé</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold leading-snug" style={{ color }}>
                                                {movie.revenue >= 1_000_000
                                                    ? `${(movie.revenue/1_000_000).toFixed(1)}M`
                                                    : `${(movie.revenue/1000).toFixed(0)}k`}đ
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-600 pt-8 gap-2">
                            <Film size={36} className="opacity-20" />
                            <p className="text-sm">Chưa có dữ liệu</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
