import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { requestGetAllMovies } from '@/config/MovieRequest';
import { Play, Film } from 'lucide-react';
import { Empty } from 'antd';
import { getMediaUrl } from '@/utils/media';
import StarRating, { getMovieDisplayRating } from '@/components/common/StarRating';
import PosterRibbon, { getMovieRibbon } from '@/components/common/PosterRibbon';

const MovieCard = ({ movie, showRibbon = false, rank = null }) => {
    const displayRating = getMovieDisplayRating(movie);
    const ribbon = showRibbon ? getMovieRibbon(movie) : null;

    return (
    <div className="group relative rounded-xl overflow-hidden cursor-pointer bg-[#111] border border-white/5 hover:border-white/20 transition-all duration-300 shadow-lg shadow-black/40">
        <div className="aspect-[2/3] w-full relative overflow-hidden">
            {movie.posterUrl ? (
                <img 
                    src={getMediaUrl(movie.posterUrl)} 
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
                    <Film size={40} className="text-gray-600" />
                </div>
            )}

            {ribbon && <PosterRibbon label={ribbon.label} color={ribbon.color} />}

            {movie.ageRating && (
                <div className="absolute top-2.5 right-2.5 z-10">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border shadow-lg backdrop-blur-md ${
                        movie.ageRating === 'T18' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        movie.ageRating === 'T16' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        movie.ageRating === 'T13' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}>
                        {movie.ageRating}
                    </span>
                </div>
            )}

            {rank && rank <= 10 && (
                <span
                    className="absolute bottom-2 left-2 z-10 font-black text-white leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                    style={{ fontSize: rank <= 3 ? '3rem' : '2rem', opacity: rank <= 3 ? 1 : 0.75 }}
                >
                    {rank}
                </span>
            )}

            {displayRating > 0 && (
                <div className="absolute bottom-2.5 right-2.5 z-10 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full shadow-md">
                    <StarRating rating={displayRating} size="sm" />
                </div>
            )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <h3 className="text-white font-bold text-lg leading-tight mb-1">{movie.title}</h3>
            <p className="text-gray-300 text-xs mb-3 line-clamp-2">{movie.description}</p>
            <Link 
                to={`/phim/${movie.slug}`} 
                className="bg-[#E50914] text-white py-2 px-4 rounded font-bold text-sm text-center flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
            >
                <Play size={16} /> Chi tiết & Mua Vé
            </Link>
        </div>
    </div>
    );
};

export default function MoviesPage({ type }) {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const isSearch = type === 'search' || location.pathname.includes('/search');
    const isNowShowing = type === 'now-showing' || location.pathname.includes('now-showing');
    
    // Get search query from URL
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('q') || '';

    let pageTitle = 'Danh sách phim';
    let subtitle = '';
    let statusFilter = null;

    if (isSearch) {
        pageTitle = `Kết quả tìm kiếm cho: "${searchQuery}"`;
        subtitle = 'Các bộ phim khớp với từ khóa của bạn';
    } else if (isNowShowing) {
        pageTitle = 'Phim Đang Chiếu';
        subtitle = 'Khám phá những bộ phim bom tấn đang chiếu rạp';
        statusFilter = 'Đang chiếu';
    } else {
        pageTitle = 'Phim Sắp Chiếu';
        subtitle = 'Đón chờ những siêu phẩm sắp đổ bộ phòng vé';
        statusFilter = 'Sắp chiếu';
    }

    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                // Nếu là search, truyền searchQuery vào API
                const res = await requestGetAllMovies(isSearch ? searchQuery : '');
                if (res && res.metadata) {
                    const filtered = statusFilter 
                        ? res.metadata.filter(m => m.status === statusFilter)
                        : res.metadata; // Search ko filter status
                    setMovies(filtered);
                }
            } catch (error) {
                console.error('Error fetching movies:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, [statusFilter, isSearch, searchQuery]);

    return (
        <div className="min-h-screen bg-[#050505] pt-24 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 flex items-center justify-center">
                        <Film className="text-[#E50914]" size={22} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white">{pageTitle}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="text-gray-400 animate-pulse">Đang tải danh sách phim...</div>
                    </div>
                ) : movies.length === 0 ? (
                    <div className="py-32 text-center">
                        <Empty description={<span className="text-gray-500">Chưa có phim nào trong danh mục này</span>} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {movies.map((movie, idx) => (
                            <MovieCard
                                key={movie._id}
                                movie={movie}
                                showRibbon={!isSearch}
                                rank={!isSearch ? idx + 1 : null}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
