import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestGetAllCinemas } from '@/config/CinemaRequest';
import { MapPin, Phone, Building2, ChevronDown } from 'lucide-react';
import { Empty } from 'antd';

export default function CinemasPage() {
    const navigate = useNavigate();
    const [cinemas, setCinemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCity, setSelectedCity] = useState('All');

    useEffect(() => {
        const fetchCinemas = async () => {
            setLoading(true);
            try {
                const res = await requestGetAllCinemas();
                if (res && res.metadata) {
                    setCinemas(res.metadata);
                }
            } catch (error) {
                console.error('Error fetching cinemas:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCinemas();
    }, []);

    // Extract unique cities
    const cities = ['All', ...new Set(cinemas.map(c => c.city).filter(Boolean))];

    // Filter cinemas by city
    const filteredCinemas = selectedCity === 'All' 
        ? cinemas 
        : cinemas.filter(c => c.city === selectedCity);

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-20 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 flex items-center justify-center">
                            <Building2 className="text-[#E50914]" size={22} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white">Hệ thống rạp</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Trải nghiệm điện ảnh đỉnh cao tại hệ thống TT CINEMA toàn quốc
                            </p>
                        </div>
                    </div>

                    {/* Filter by City */}
                    {!loading && cities.length > 1 && (
                        <div className="relative">
                            <select
                                value={selectedCity}
                                onChange={(e) => setSelectedCity(e.target.value)}
                                className="appearance-none bg-[#111] border border-white/10 text-white pl-4 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-[#E50914] focus:ring-1 focus:ring-[#E50914] cursor-pointer"
                            >
                                {cities.map(city => (
                                    <option key={city} value={city}>
                                        {city === 'All' ? 'Tất cả khu vực' : city}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="text-gray-400 animate-pulse">Đang tải danh sách rạp...</div>
                    </div>
                ) : filteredCinemas.length === 0 ? (
                    <div className="py-32 text-center">
                        <Empty description={<span className="text-gray-500">Hệ thống rạp đang được cập nhật</span>} />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCinemas.map(cinema => (
                            <div 
                                key={cinema._id} 
                                className="bg-[#111] border border-white/5 rounded-xl p-5 hover:border-white/20 transition-all duration-300 group flex flex-col h-full"
                            >
                                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-[#E50914] transition-colors">
                                    {cinema.name}
                                </h3>
                                
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-gray-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-gray-300 leading-relaxed">
                                            {cinema.address}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Building2 size={18} className="text-gray-500 shrink-0" />
                                        <span className="text-sm text-gray-300">{cinema.city}</span>
                                    </div>
                                    {cinema.hotline && (
                                        <div className="flex items-center gap-3">
                                            <Phone size={18} className="text-gray-500 shrink-0" />
                                            <span className="text-sm text-[#E50914] font-medium">{cinema.hotline}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/5">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/cinemas/${cinema._id}`)}
                                        className="w-full py-2.5 rounded-lg bg-white/5 text-white font-medium hover:bg-[#E50914] transition-colors text-sm"
                                    >
                                        Xem lịch chiếu
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
