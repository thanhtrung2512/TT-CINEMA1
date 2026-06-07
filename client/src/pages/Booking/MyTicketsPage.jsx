import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestGetMyBookings } from '@/config/BookingRequest';
import { requestCreateReview, requestGetMyReviews } from '@/config/ReviewRequest';
import { Film, MapPin, Clock, Armchair, Ticket, ChevronRight, Star, MessageSquare } from 'lucide-react';
import { Tag as AntTag, Empty, Button, Modal, Rate, message, Input } from 'antd';
import dayjs from 'dayjs';
import QRCode from 'react-qr-code';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const statusConfig = {
    Paid: { label: 'Đã thanh toán', color: 'success' },
    CheckedIn: { label: 'Đã soát vé', color: 'processing' },
    Pending: { label: 'Chờ thanh toán', color: 'warning' },
    Cancelled: { label: 'Đã huỷ', color: 'default' },
};

export default function MyTicketsPage() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [myReviews, setMyReviews] = useState({});
    const [loading, setLoading] = useState(true);

    // Review state
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [bookingRes, reviewsRes] = await Promise.all([
                    requestGetMyBookings(),
                    requestGetMyReviews().catch(() => null), // Ignore error if not logged in or endpoint fails
                ]);

                if (bookingRes?.metadata) setBookings(bookingRes.metadata);

                if (reviewsRes?.metadata) {
                    const reviewMap = {};
                    reviewsRes.metadata.forEach((r) => {
                        reviewMap[r.movieId] = r;
                    });
                    setMyReviews(reviewMap);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const openReviewModal = (e, movie) => {
        e.stopPropagation(); // Ngăn click vào card
        setSelectedMovie(movie);
        setIsReviewModalOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewRating || !reviewText.trim()) {
            message.warning('Vui lòng chọn số sao và nhập bình luận!');
            return;
        }
        try {
            setSubmittingReview(true);
            const newReview = await requestCreateReview(selectedMovie._id, {
                rating: reviewRating,
                comment: reviewText,
            });
            message.success('Cảm ơn bạn đã đánh giá!');

            // Cập nhật state myReviews ngay lập tức để ẩn nút Đánh giá
            setMyReviews((prev) => ({
                ...prev,
                [selectedMovie._id]: {
                    rating: reviewRating,
                    comment: reviewText,
                    createdAt: new Date().toISOString(),
                },
            }));

            setIsReviewModalOpen(false);
            setReviewText('');
            setReviewRating(5);
        } catch (error) {
            message.error(error.message || 'Lỗi khi gửi đánh giá');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDownloadPDF = async (booking, e) => {
        e.stopPropagation();
        const element = document.getElementById(`ticket-pdf-${booking._id}`);
        if (!element) return;

        // Show temporarily to capture
        element.style.display = 'block';

        try {
            message.loading({ content: 'Đang tạo PDF...', key: 'pdf' });
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`TTCinema-Ticket-${booking._id}.pdf`);
            message.success({ content: 'Tải vé PDF thành công!', key: 'pdf' });
        } catch (error) {
            message.error({ content: 'Lỗi khi tạo PDF', key: 'pdf' });
        } finally {
            element.style.display = 'none';
        }
    };

    if (loading)
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="text-gray-400 animate-pulse">Đang tải lịch sử vé...</div>
            </div>
        );

    return (
        <div className="pb-10">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#E50914]/10 flex items-center justify-center">
                        <Ticket className="text-[#E50914]" size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white">Vé của tôi</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Lịch sử đặt vé xem phim</p>
                    </div>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-24">
                        <Empty description={<span className="text-gray-500">Bạn chưa có vé nào</span>} />
                        <button
                            onClick={() => navigate('/')}
                            className="mt-6 px-6 py-2.5 bg-[#E50914] text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            Đặt vé ngay
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {bookings.map((booking) => {
                            const showtime = booking.showtimeId;
                            const movie = showtime?.movieId;
                            const room = showtime?.roomId;
                            const cinema = room?.cinemaId;
                            const st = statusConfig[booking.status] || { label: booking.status, color: 'default' };

                            return (
                                <div
                                    key={booking._id}
                                    onClick={() => navigate(`/booking/result?bookingId=${booking._id}`)}
                                    className="bg-[#111] border border-white/5 rounded-xl p-5 flex gap-4 cursor-pointer hover:border-white/20 transition-all duration-200 group"
                                >
                                    {/* Poster */}
                                    <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a]">
                                        {movie?.posterUrl ? (
                                            <img
                                                src={`${import.meta.env.VITE_API_URL}${movie.posterUrl}`}
                                                alt={movie.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Film size={24} className="text-gray-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 group-hover:text-[#E50914] transition-colors">
                                                    {movie?.title || 'Phim'}
                                                </h3>
                                                {(booking.status === 'Paid' || booking.status === 'CheckedIn') && (
                                                    <div className="flex gap-2">
                                                        <div
                                                            className="bg-white p-1 rounded-md shrink-0 cursor-zoom-in"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                Modal.info({
                                                                    icon: null,
                                                                    content: (
                                                                        <div className="flex flex-col items-center">
                                                                            <QRCode value={booking._id} size={200} />
                                                                            <p className="mt-4 font-bold text-center">
                                                                                Đưa mã này cho nhân viên
                                                                            </p>
                                                                        </div>
                                                                    ),
                                                                    maskClosable: true,
                                                                    footer: null,
                                                                });
                                                            }}
                                                        >
                                                            <QRCode value={booking._id} size={24} />
                                                        </div>
                                                        <Button
                                                            size="small"
                                                            className="bg-gray-800 text-white border-white/10 text-[10px]"
                                                            onClick={(e) => handleDownloadPDF(booking, e)}
                                                        >
                                                            Tải PDF
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <AntTag color={st.color} className="shrink-0">
                                                {st.label}
                                            </AntTag>
                                        </div>

                                        <div className="mt-2 space-y-1.5">
                                            {cinema && (
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <MapPin size={13} className="shrink-0" />
                                                    <span>
                                                        {cinema.name} — {room?.name}
                                                    </span>
                                                </div>
                                            )}
                                            {showtime?.startTime && (
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <Clock size={13} className="shrink-0" />
                                                    <span>
                                                        {dayjs(showtime.startTime).format('HH:mm — DD/MM/YYYY')}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Armchair size={13} className="shrink-0" />
                                                <span>{(booking.seats || []).join(', ')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                            <span className="text-[#E50914] font-bold">
                                                {(booking.totalPrice || 0).toLocaleString('vi-VN')}đ
                                            </span>
                                            <div className="flex items-center gap-3">
                                                {booking.status === 'Paid' && !myReviews[movie?._id] && (
                                                    <Button
                                                        type="primary"
                                                        className="bg-[#E50914] border-none font-bold text-xs"
                                                        onClick={(e) => openReviewModal(e, movie)}
                                                    >
                                                        Đánh giá phim
                                                    </Button>
                                                )}
                                                <div className="flex items-center gap-1 text-gray-500 text-xs group-hover:text-white transition-colors">
                                                    Chi tiết <ChevronRight size={14} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Phần hiển thị Đánh giá nếu đã review */}
                                        {myReviews[movie?._id] && (
                                            <div className="mt-3 pt-3 border-t border-white/5 bg-[#0a0a0a] rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <MessageSquare size={12} /> Đánh giá của bạn
                                                    </span>
                                                    <Rate
                                                        disabled
                                                        defaultValue={myReviews[movie._id].rating}
                                                        className="text-[#E50914] text-[10px]"
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-300 italic m-0 line-clamp-2">
                                                    "{myReviews[movie._id].comment}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* HIDDEN TICKET TEMPLATE FOR PDF */}
                                    <div
                                        id={`ticket-pdf-${booking._id}`}
                                        style={{
                                            display: 'none',
                                            background: '#fff',
                                            width: '800px',
                                            padding: '40px',
                                            color: '#000',
                                            fontFamily: 'sans-serif',
                                        }}
                                    >
                                        <div
                                            style={{
                                                border: '2px solid #E50914',
                                                borderRadius: '16px',
                                                padding: '30px',
                                                position: 'relative',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    borderBottom: '2px dashed #ccc',
                                                    paddingBottom: '20px',
                                                    marginBottom: '20px',
                                                }}
                                            >
                                                <div>
                                                    <h1
                                                        style={{
                                                            color: '#E50914',
                                                            fontSize: '32px',
                                                            margin: 0,
                                                            fontWeight: '900',
                                                        }}
                                                    >
                                                        TT Cinema
                                                    </h1>
                                                    <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
                                                        Vé điện tử / E-Ticket
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div
                                                        style={{
                                                            background: '#fff',
                                                            padding: '10px',
                                                            display: 'inline-block',
                                                        }}
                                                    >
                                                        <QRCodeCanvas value={booking._id} size={100} />
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                                        {booking._id}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '30px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h2
                                                        style={{
                                                            fontSize: '28px',
                                                            margin: '0 0 15px 0',
                                                            color: '#000',
                                                        }}
                                                    >
                                                        {movie?.title}
                                                    </h2>
                                                    <div
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '15px',
                                                            fontSize: '16px',
                                                        }}
                                                    >
                                                        <div>
                                                            <strong
                                                                style={{
                                                                    color: '#888',
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    textTransform: 'uppercase',
                                                                }}
                                                            >
                                                                Rạp
                                                            </strong>
                                                            <span>{cinema?.name}</span>
                                                        </div>
                                                        <div>
                                                            <strong
                                                                style={{
                                                                    color: '#888',
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    textTransform: 'uppercase',
                                                                }}
                                                            >
                                                                Phòng chiếu
                                                            </strong>
                                                            <span>{room?.name}</span>
                                                        </div>
                                                        <div>
                                                            <strong
                                                                style={{
                                                                    color: '#888',
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    textTransform: 'uppercase',
                                                                }}
                                                            >
                                                                Thời gian
                                                            </strong>
                                                            <span>
                                                                {dayjs(showtime?.startTime).format(
                                                                    'HH:mm - DD/MM/YYYY',
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <strong
                                                                style={{
                                                                    color: '#888',
                                                                    display: 'block',
                                                                    fontSize: '12px',
                                                                    textTransform: 'uppercase',
                                                                }}
                                                            >
                                                                Ghế
                                                            </strong>
                                                            <span style={{ color: '#E50914', fontWeight: 'bold' }}>
                                                                {(booking.seats || []).join(', ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {movie?.posterUrl && (
                                                    <img
                                                        src={
                                                            movie.posterUrl.startsWith('http')
                                                                ? movie.posterUrl
                                                                : `${import.meta.env.VITE_API_URL}${movie.posterUrl}`
                                                        }
                                                        alt="poster"
                                                        style={{
                                                            width: '150px',
                                                            borderRadius: '8px',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Đánh Giá */}
            <Modal
                title={`Đánh giá phim: ${selectedMovie?.title}`}
                open={isReviewModalOpen}
                onCancel={() => setIsReviewModalOpen(false)}
                footer={[
                    <Button key="back" onClick={() => setIsReviewModalOpen(false)}>
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={submittingReview}
                        onClick={handleSubmitReview}
                        className="bg-[#E50914] border-none hover:bg-red-700"
                    >
                        Gửi đánh giá
                    </Button>,
                ]}
            >
                <div className="py-4 space-y-4">
                    <div className="text-center">
                        <Rate value={reviewRating} onChange={setReviewRating} className="text-[#E50914] text-3xl" />
                    </div>
                    <Input.TextArea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Bạn nghĩ gì về bộ phim này? (Cốt truyện, diễn xuất, kỹ xảo...)"
                        rows={4}
                    />
                </div>
            </Modal>
        </div>
    );
}
