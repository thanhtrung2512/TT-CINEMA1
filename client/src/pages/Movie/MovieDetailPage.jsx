import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { requestGetMovieBySlug } from '@/config/MovieRequest';
import { requestGetAllShowtimes } from '@/config/ShowtimeRequest';
import { requestGetReviewsByMovie, requestCreateReview } from '@/config/ReviewRequest';
import { Play, Clock, Calendar as CalendarIcon, MapPin, MessageSquare, Star, Sparkles, X } from 'lucide-react';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { Tabs, Collapse, Button, Rate, Input, Avatar, message } from 'antd';
import { useStore } from '@/hooks/useStore';
import { getMediaUrl, getTrailerUrl, getYoutubeEmbedUrl } from '@/utils/media';

dayjs.extend(isSameOrAfter);

export default function MovieDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  const { dataUser } = useStore();
  const [reviewsData, setReviewsData] = useState({ reviews: [], totalReviews: 0, averageRating: 0 });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);

  useEffect(() => {
    if (!trailerOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setTrailerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [trailerOpen]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Lấy chi tiết phim
        const movieRes = await requestGetMovieBySlug(slug);
        if (movieRes && movieRes.metadata) {
          setMovie(movieRes.metadata);
          // Lấy tất cả lịch chiếu của phim này
          const showtimesRes = await requestGetAllShowtimes(movieRes.metadata._id);
          if (showtimesRes && showtimesRes.metadata) {
            // Chỉ lấy các suất chiếu từ thời điểm hiện tại trở đi
            const validShowtimes = showtimesRes.metadata.filter(st => dayjs(st.startTime).isSameOrAfter(dayjs()));
            setShowtimes(validShowtimes);
            
            // Set selected date to the earliest available date if not today
            if (validShowtimes.length > 0) {
              const earliestDate = dayjs(validShowtimes[0].startTime).format('YYYY-MM-DD');
              if (dayjs(earliestDate).isAfter(dayjs(), 'day')) {
                setSelectedDate(earliestDate);
              }
            }

            // Lấy danh sách đánh giá
            const reviewsRes = await requestGetReviewsByMovie(movieRes.metadata._id);
            if (reviewsRes && reviewsRes.metadata) {
              setReviewsData(reviewsRes.metadata);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Đang tải...</div>;
  }

  if (!movie) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white text-xl">Không tìm thấy phim!</div>;
  }

  // Lấy thời lượng phim để hiển thị ở thanh top bar
  const duration = movie.details?.find(d => d.name.toLowerCase().includes('thời lượng'))?.value || 'Đang cập nhật';

  // --- Xử lý Lịch chiếu (Cách A: Chọn Ngày -> Nhóm theo Rạp -> Các khung giờ) ---
  
  // 1. Tạo danh sách các ngày có suất chiếu (duy nhất)
  const uniqueDates = [...new Set(showtimes.map(st => dayjs(st.startTime).format('YYYY-MM-DD')))].sort();
  
  // Tạo Tabs cho Ngày
  const dateTabs = uniqueDates.map(date => {
    const isToday = dayjs(date).isSame(dayjs(), 'day');
    return {
      key: date,
      label: (
        <div className="text-center px-4 py-1">
          <div className="text-sm font-medium">{isToday ? 'Hôm nay' : dayjs(date).format('dddd')}</div>
          <div className="text-xl font-bold">{dayjs(date).format('DD/MM')}</div>
        </div>
      ),
    };
  });

  // 2. Lọc suất chiếu theo ngày đã chọn
  const showtimesOnSelectedDate = showtimes.filter(st => dayjs(st.startTime).format('YYYY-MM-DD') === selectedDate);

  // 3. Nhóm suất chiếu theo Cụm Rạp (Cinema)
  const groupedByCinema = showtimesOnSelectedDate.reduce((acc, st) => {
    const cinemaId = st.roomId?.cinemaId?._id;
    if (!cinemaId) return acc;
    
    if (!acc[cinemaId]) {
      acc[cinemaId] = {
        cinema: st.roomId.cinemaId,
        showtimes: []
      };
    }
    acc[cinemaId].showtimes.push(st);
    return acc;
  }, {});

  // 4. Tạo Items cho Collapse (Accordion Rạp chiếu)
  const cinemaCollapseItems = Object.values(groupedByCinema).map(group => ({
    key: group.cinema._id,
    label: (
      <div className="flex items-center gap-3">
        <MapPin className="text-[#E50914]" size={20} />
        <div>
          <h4 className="text-lg font-bold text-white m-0">{group.cinema.name}</h4>
          <p className="text-xs text-gray-400 m-0">{group.cinema.address}</p>
        </div>
      </div>
    ),
    children: (
      <div className="flex flex-wrap gap-4">
        {group.showtimes.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).map(st => (
          <Button 
            key={st._id}
            size="large"
            className="bg-[#1a1a1a] hover:border-[#E50914] hover:text-[#E50914] text-white border-white/10 h-auto py-2 px-6 rounded-lg transition-colors"
            onClick={() => navigate(`/booking/${st._id}`)}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{dayjs(st.startTime).format('HH:mm')}</span>
              <span className="text-xs text-gray-500">{st.roomId?.name}</span>
            </div>
          </Button>
        ))}
      </div>
    )
  }));

  const trailerUrl = getTrailerUrl(movie.trailer);
  const trailerEmbedUrl = getYoutubeEmbedUrl(movie.trailer);

  const handleOpenTrailer = () => {
    if (!trailerUrl) {
      message.warning('Phim này chưa có link trailer!');
      return;
    }
    if (!trailerEmbedUrl) {
      message.warning('Chỉ hỗ trợ trailer YouTube. Vui lòng kiểm tra lại link!');
      return;
    }
    setTrailerOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewText.trim()) {
      message.warning('Vui lòng chọn số sao và nhập bình luận!');
      return;
    }
    try {
      setSubmittingReview(true);
      await requestCreateReview(movie._id, { rating: reviewRating, comment: reviewText });
      message.success('Cảm ơn bạn đã đánh giá!');
      setReviewText('');
      setReviewRating(5);
      // Refresh reviews
      const reviewsRes = await requestGetReviewsByMovie(movie._id);
      if (reviewsRes && reviewsRes.metadata) {
        setReviewsData(reviewsRes.metadata);
      }
    } catch (error) {
      message.error(error.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] pb-20">
      {/* ── HEADER KHÔNG GIAN PHIM ── */}
      <div className="relative w-full min-h-[60vh] pt-24 flex items-end">
        {/* Backdrop Cover */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ 
            backgroundImage: movie.backdropUrl ? `url(${getMediaUrl(movie.backdropUrl)})` : undefined,
            filter: 'brightness(0.6)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-black/30 z-0" />
        
        {/* Content Box */}
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              
              {/* Poster Left */}
              <div className="w-48 md:w-64 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 hidden md:block relative group">
                <img src={getMediaUrl(movie.posterUrl)} alt={movie.title} className="w-full h-auto object-cover" />
                {trailerUrl && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleOpenTrailer}
                      className="w-16 h-16 rounded-full bg-[#E50914] flex items-center justify-center hover:scale-110 transition-transform"
                      aria-label="Xem trailer"
                    >
                      <Play className="text-white ml-1" size={24} />
                    </button>
                  </div>
                )}
              </div>

              {/* Info Right */}
              <div className="flex-1 animate-fade-up">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-1 bg-[#E50914] text-white text-xs font-bold rounded">T18</span>
                  <span className="text-gray-300 text-sm flex items-center gap-1"><Clock size={14}/> {duration}</span>
                  <span className="text-gray-300 text-sm flex items-center gap-1"><CalendarIcon size={14}/> {dayjs(movie.createdAt).format('YYYY')}</span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{movie.title}</h1>
                <p className="text-xl text-gray-400 font-light mb-4">
                  {movie.details?.find(d => d.name.toLowerCase() === 'tên gốc')?.value || movie.title}
                </p>

                {/* Hiển thị Rating chung */}
                <div className="flex items-center gap-2 mb-6">
                  <Rate disabled allowHalf value={reviewsData.averageRating || 5} className="text-[#E50914] text-lg" />
                  <span className="text-white font-bold text-lg">{reviewsData.averageRating || 5}/5</span>
                  <span className="text-gray-400 text-sm">({reviewsData.totalReviews} đánh giá)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300 mb-6">
                  <div><strong className="text-white">Trạng thái:</strong> <span className="text-[#E50914] font-medium">{movie.status}</span></div>
                  {movie.details?.map((detail, index) => {
                    // Bỏ qua Tên gốc vì đã được hiển thị to đùng ở trên
                    if (detail.name.toLowerCase() === 'tên gốc') return null;
                    return (
                      <div key={index}>
                        <strong className="text-white">{detail.name}:</strong>{' '}
                        <span className="line-clamp-2">{detail.value}</span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-gray-400 leading-relaxed text-sm max-w-3xl line-clamp-3">
                  {movie.description}
                </p>

                {trailerUrl && (
                  <button
                    type="button"
                    onClick={handleOpenTrailer}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-[#E50914] text-white font-semibold transition-colors border border-white/10"
                  >
                    <Play size={18} className="ml-0.5" />
                    Xem Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CHỌN SUẤT CHIẾU & MUA VÉ ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 animate-fade-up">
        <h2 className="text-2xl font-bold text-white mb-8 relative pl-4 border-l-4 border-[#E50914]">LỊCH CHIẾU PHIM</h2>

        {uniqueDates.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-2xl border border-white/5">
            <CalendarIcon size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl text-white font-bold mb-2">Chưa có lịch chiếu</h3>
            <p className="text-gray-500">Phim này hiện tại chưa có suất chiếu nào được lên lịch. Vui lòng quay lại sau!</p>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-4 sm:p-6 shadow-2xl">
            {/* TABS CHỌN NGÀY */}
            <Tabs 
              activeKey={selectedDate} 
              onChange={setSelectedDate} 
              items={dateTabs} 
              className="showtime-tabs mb-8"
              tabBarGutter={16}
            />

            {/* DANH SÁCH RẠP & KHUNG GIỜ */}
            {cinemaCollapseItems.length > 0 ? (
              <Collapse 
                defaultActiveKey={cinemaCollapseItems.map(item => item.key)}
                ghost
                items={cinemaCollapseItems}
                className="cinema-collapse"
                expandIconPosition="end"
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                Không có suất chiếu nào trong ngày này. Vui lòng chọn ngày khác!
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ĐÁNH GIÁ TỪ KHÁN GIẢ ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 animate-fade-up">
        <h2 className="text-2xl font-bold text-white mb-8 relative pl-4 border-l-4 border-[#E50914] flex items-center gap-2">
          ĐÁNH GIÁ TỪ KHÁN GIẢ
        </h2>

        <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 p-6 shadow-2xl">
          {/* AI Summary */}
          {movie.aiSummary && (
            <div className="mb-8 p-5 rounded-2xl border relative overflow-hidden" 
                 style={{ 
                   background: 'linear-gradient(145deg, rgba(229,9,20,0.1) 0%, rgba(0,0,0,0) 100%)',
                   borderColor: 'rgba(229,9,20,0.3)' 
                 }}>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Sparkles size={20} className="text-[#E50914] animate-pulse" />
                <h3 className="text-white font-bold text-lg">AI Tóm Tắt Nhận Xét</h3>
              </div>
              <p className="text-gray-300 leading-relaxed relative z-10 italic">
                "{movie.aiSummary}"
              </p>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E50914]/10 rounded-full blur-3xl"></div>
            </div>
          )}

          {/* Danh sách bình luận */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <MessageSquare size={20} className="text-[#E50914]" />
              {reviewsData.totalReviews} Bình luận
            </h3>
            
            {reviewsData.reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có đánh giá nào cho phim này. Hãy là người đầu tiên!
              </div>
            ) : (
              reviewsData.reviews.map(review => (
                <div key={review._id} className="flex gap-4">
                  <Avatar 
                    src={review.userId?.avatar ? getMediaUrl(review.userId.avatar) : null} 
                    className="bg-gray-700 flex-shrink-0"
                    size="large"
                  >
                    {review.userId?.fullName?.charAt(0)}
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-[#1a1a1a] rounded-2xl rounded-tl-none p-4 inline-block min-w-[250px] max-w-full">
                      <div className="flex items-center justify-between mb-1 gap-4">
                        <span className="font-bold text-white">{review.userId?.fullName}</span>
                        <span className="text-xs text-gray-500">{dayjs(review.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Rate disabled defaultValue={review.rating} className="text-[#E50914] text-sm" />
                        {review.isVerified && (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase border border-green-500/20">
                            ✓ Đã mua vé
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm m-0 whitespace-pre-wrap">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trailer overlay — phát ngay trên trang */}
      {trailerOpen && trailerEmbedUrl && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          onClick={() => setTrailerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Trailer phim ${movie.title}`}
        >
          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setTrailerOpen(false)}
              className="absolute -top-12 right-0 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Đóng trailer"
            >
              <span className="text-sm font-medium">Đóng</span>
              <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#E50914] transition-colors">
                <X size={18} />
              </span>
            </button>

            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
              <iframe
                key={trailerEmbedUrl}
                src={trailerEmbedUrl}
                title={`Trailer - ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
