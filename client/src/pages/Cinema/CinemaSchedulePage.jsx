import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { requestGetAllCinemas } from '@/config/CinemaRequest';
import { requestGetAllShowtimes } from '@/config/ShowtimeRequest';
import { MapPin, Phone, Building2, ArrowLeft, Clock, Film } from 'lucide-react';
import { Button, Empty, Tabs } from 'antd';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

export default function CinemaSchedulePage() {
    const { cinemaId } = useParams();
    const navigate = useNavigate();
    const [cinema, setCinema] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [cinemasRes, showtimesRes] = await Promise.all([
                    requestGetAllCinemas(),
                    requestGetAllShowtimes('', cinemaId),
                ]);

                const foundCinema = cinemasRes?.metadata?.find((c) => c._id === cinemaId);
                setCinema(foundCinema || null);

                const validShowtimes = (showtimesRes?.metadata || []).filter((st) =>
                    dayjs(st.startTime).isSameOrAfter(dayjs()),
                );
                setShowtimes(validShowtimes);

                if (validShowtimes.length > 0) {
                    const earliestDate = dayjs(validShowtimes[0].startTime).format('YYYY-MM-DD');
                    if (dayjs(earliestDate).isAfter(dayjs(), 'day')) {
                        setSelectedDate(earliestDate);
                    }
                }
            } catch (error) {
                console.error('Error fetching cinema schedule:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [cinemaId]);

    const availableDates = useMemo(() => {
        const dates = [...new Set(showtimes.map((st) => dayjs(st.startTime).format('YYYY-MM-DD')))];
        return dates.sort();
    }, [showtimes]);

    const showtimesOnDate = useMemo(
        () => showtimes.filter((st) => dayjs(st.startTime).format('YYYY-MM-DD') === selectedDate),
        [showtimes, selectedDate],
    );

    const groupedByMovie = useMemo(() => {
        return showtimesOnDate.reduce((acc, st) => {
            const movieId = st.movieId?._id;
            if (!movieId) return acc;

            if (!acc[movieId]) {
                acc[movieId] = { movie: st.movieId, showtimes: [] };
            }
            acc[movieId].showtimes.push(st);
            return acc;
        }, {});
    }, [showtimesOnDate]);

    const dateTabs = availableDates.map((date) => {
        const isToday = date === dayjs().format('YYYY-MM-DD');
        return {
            key: date,
            label: (
                <div className="text-center px-2">
                    <div className="text-sm font-medium">{isToday ? 'Hôm nay' : dayjs(date).format('dddd')}</div>
                    <div className="text-lg font-bold">{dayjs(date).format('DD/MM')}</div>
                </div>
            ),
        };
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] pt-24 flex items-center justify-center">
                <div className="text-gray-400 animate-pulse">Đang tải lịch chiếu...</div>
            </div>
        );
    }

    if (!cinema) {
        return (
            <div className="min-h-screen bg-[#050505] pt-24 px-4 text-center">
                <Empty description={<span className="text-gray-500">Không tìm thấy rạp chiếu</span>} />
                <Button className="mt-6" onClick={() => navigate('/cinemas')}>
                    Quay lại danh sách rạp
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-20 px-4">
            <div className="max-w-5xl mx-auto">
                <Link
                    to="/cinemas"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={18} />
                    Quay lại danh sách rạp
                </Link>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8">
                    <h1 className="text-3xl font-black text-white mb-4">{cinema.name}</h1>
                    <div className="space-y-2">
                        <div className="flex items-start gap-3 text-gray-300">
                            <MapPin size={18} className="text-[#E50914] mt-0.5 shrink-0" />
                            <span>{cinema.address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <Building2 size={18} className="text-gray-500 shrink-0" />
                            <span>{cinema.city}</span>
                        </div>
                        {cinema.hotline && (
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-gray-500 shrink-0" />
                                <span className="text-[#E50914] font-medium">{cinema.hotline}</span>
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-[#E50914]" />
                    Lịch chiếu
                </h2>

                {showtimes.length === 0 ? (
                    <div className="py-20 text-center bg-[#111] rounded-2xl border border-white/5">
                        <Empty description={<span className="text-gray-500">Rạp này chưa có suất chiếu nào</span>} />
                    </div>
                ) : (
                    <>
                        <Tabs
                            activeKey={selectedDate}
                            onChange={setSelectedDate}
                            items={dateTabs}
                            className="cinema-schedule-tabs mb-6"
                        />

                        {Object.keys(groupedByMovie).length === 0 ? (
                            <div className="py-16 text-center bg-[#111] rounded-2xl border border-white/5">
                                <Empty description={<span className="text-gray-500">Không có suất chiếu trong ngày này</span>} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Object.values(groupedByMovie).map((group) => (
                                    <div
                                        key={group.movie._id}
                                        className="bg-[#111] border border-white/5 rounded-xl p-5 hover:border-white/15 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            {group.movie.posterUrl && (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}${group.movie.posterUrl}`}
                                                    alt={group.movie.title}
                                                    className="w-14 h-20 object-cover rounded-lg shrink-0"
                                                />
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Film size={18} className="text-[#E50914]" />
                                                <h3 className="text-lg font-bold text-white m-0">{group.movie.title}</h3>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            {group.showtimes
                                                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                                                .map((st) => (
                                                    <Button
                                                        key={st._id}
                                                        size="large"
                                                        className="bg-[#1a1a1a] hover:border-[#E50914] hover:text-[#E50914] text-white border-white/10 h-auto py-2 px-6 rounded-lg"
                                                        onClick={() => navigate(`/booking/${st._id}`)}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-lg font-bold">
                                                                {dayjs(st.startTime).format('HH:mm')}
                                                            </span>
                                                            <span className="text-xs text-gray-500">{st.roomId?.name}</span>
                                                        </div>
                                                    </Button>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
