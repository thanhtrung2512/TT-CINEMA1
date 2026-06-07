const RIBBON_COLORS = {
  pink: 'bg-[#E91E8C]',
  red: 'bg-[#E50914]',
  purple: 'bg-[#7C3AED]',
  amber: 'bg-[#F59E0B]',
  emerald: 'bg-[#10B981]',
};

/** Nhãn vắt chéo góc poster — kiểu Lotte Cinema */
export default function PosterRibbon({ label, color = 'pink' }) {
  if (!label) return null;

  return (
    <div className="absolute top-0 left-0 z-20 w-[88px] h-[88px] overflow-hidden pointer-events-none">
      <div
        className={`absolute top-[18px] -left-[30px] w-[130px] ${RIBBON_COLORS[color] ?? RIBBON_COLORS.pink} text-white text-[9px] font-black tracking-[0.12em] text-center py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.35)] uppercase`}
        style={{ transform: 'rotate(-45deg)' }}
      >
        {label}
      </div>
    </div>
  );
}

/** Chọn nhãn ribbon theo trạng thái phim */
export function getMovieRibbon(movie) {
  if (!movie) return null;

  if (movie.status === 'Sắp chiếu') {
    return { label: 'SẮP CHIẾU', color: 'amber' };
  }

  if (movie.status === 'Đang chiếu') {
    return { label: 'ĐANG CHIẾU', color: 'pink' };
  }

  return null;
}
