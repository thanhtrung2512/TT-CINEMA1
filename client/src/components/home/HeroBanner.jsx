import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '@/utils/media';
import StarRating, { getMovieDisplayRating } from '@/components/common/StarRating';

// ── Icon helpers (tránh import thêm lib) ───────────────────────
function PlayIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  )
}
function TicketIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  )
}

// ── Sub-components ─────────────────────────────────────────────

function AgeRatingBadge({ rating }) {
  const colors = {
    P:   'border-green-500 text-green-400',
    T13: 'border-yellow-500 text-yellow-400',
    T16: 'border-orange-500 text-orange-400',
    T18: 'border-red-500 text-red-400',
  }
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 border rounded ${colors[rating] ?? 'border-gray-500 text-gray-400'}`}>
      {rating}
    </span>
  )
}

// ── Slide dots indicator ───────────────────────────────────────
function SlideDots({ total, current, onDotClick }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className="transition-all duration-300 rounded-full"
          style={{
            width:   i === current ? '24px' : '6px',
            height:  '6px',
            background: i === current ? '#E50914' : 'rgba(255,255,255,0.25)',
          }}
          aria-label={`Slide ${i + 1}`}
        />
      ))}
    </div>
  )
}

// ── Progress bar ───────────────────────────────────────────────
function ProgressBar({ duration = 5000, active, key: _key }) {
  return (
    <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          background: '#E50914',
          width: active ? '100%' : '0%',
          transition: active ? `width ${duration}ms linear` : 'none',
        }}
      />
    </div>
  )
}

// ── Poster card (mini preview) ─────────────────────────────────
function PosterThumb({ movie, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-xl overflow-hidden shrink-0 transition-all duration-300 bg-[#111]"
      style={{
        width:   active ? '56px' : '44px',
        height:  active ? '80px' : '64px',
        opacity: active ? 1 : 0.45,
        outline: active ? '2px solid #E50914' : 'none',
        outlineOffset: '2px',
      }}
    >
      {movie.posterUrl ? (
        <img src={getMediaUrl(movie.posterUrl)} alt={movie.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full" style={{ background: movie.posterGradient }} />
      )}
    </button>
  )
}

// ── MAIN HeroBanner ────────────────────────────────────────────
const AUTOPLAY_DURATION = 5000

export default function HeroBanner({ movies = [] }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0)
  const [prevIdx, setPrevIdx] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [trailerOpen, setTrailerOpen] = useState(false)
  const total = movies.length

  if (!movies || movies.length === 0) return null;

  // Go to a specific slide
  const goTo = useCallback((idx) => {
    if (isTransitioning || idx === current) return
    setIsTransitioning(true)
    setPrevIdx(current)
    setCurrent(idx)
    setTimeout(() => {
      setPrevIdx(null)
      setIsTransitioning(false)
    }, 700)
  }, [current, isTransitioning])

  const goNext = useCallback(() => goTo((current + 1) % total), [goTo, current, total])
  const goPrev = useCallback(() => goTo((current - 1 + total) % total), [goTo, current, total])

  // Autoplay
  useEffect(() => {
    if (paused) return
    const timer = setInterval(goNext, AUTOPLAY_DURATION)
    return () => clearInterval(timer)
  }, [goNext, paused])

  const movie    = movies[current] || {}
  const prevMovie = prevIdx !== null ? movies[prevIdx] : null
  
  // Xử lý ảnh backdrop và poster với URL thật
  const getBackdrop = (m) => m?.backdropUrl ? `url(${getMediaUrl(m.backdropUrl)})` : 'none';
  const getPoster = (m) => getMediaUrl(m?.posterUrl);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(100vh - 0px)', minHeight: '580px', maxHeight: '860px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >

      {/* ── BACKDROP LAYERS ─────────────────────────────────────
          Prev slide fades out, current slides in
      ────────────────────────────────────────────────────────── */}

      {/* Previous backdrop (fade out) */}
      {prevMovie && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{
            backgroundImage: getBackdrop(prevMovie),
            opacity: 0,
            transition: 'opacity 700ms ease',
            filter: 'brightness(0.6)',
          }}
        />
      )}

      {/* Current backdrop */}
      <div
        key={`backdrop-${current}`}
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: getBackdrop(movie),
          animation: 'hero-scale-in 8s ease-out forwards',
          filter: 'brightness(0.6)',
        }}
      />

      {/* ── GRADIENT OVERLAYS ────────────────────────────────── */}
      {/* Left-to-right: skill.md "Fade content in from left" */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(to right, rgba(5,5,5,1) 0%, rgba(5,5,5,0.88) 35%, rgba(5,5,5,0.4) 60%, rgba(5,5,5,0.05) 100%)',
        }}
      />
      {/* Bottom-to-top: skill.md "Fade-to-black at the bottom" */}
      <div
        className="absolute bottom-0 inset-x-0 z-10"
        style={{
          height: '45%',
          background: 'linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.7) 50%, transparent 100%)',
        }}
      />

      {/* ── CONTENT ─────────────────────────────────────────────── */}
      <div className="relative z-20 h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">

            {/* Slide counter */}
            <div className="flex items-center gap-2 mb-5">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
                style={{ background: '#E50914', color: '#fff' }}
              >
                Nổi Bật
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
              <AgeRatingBadge rating={movie.ageRating} />
            </div>

            {/* Title — key causes re-render animation on slide change */}
            <h1
              key={`title-${current}`}
              className="font-black tracking-tight leading-none mb-2 line-clamp-2"
              style={{
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                color: '#fff',
                animation: 'hero-content-in 0.6s ease both',
              }}
            >
              {movie.title}
            </h1>

            {/* Meta row */}
            <div
              key={`meta-${current}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4"
              style={{ animation: 'hero-content-in 0.6s 0.15s ease both' }}
            >
              <StarRating rating={getMovieDisplayRating(movie)} />
              <span className="text-gray-600">•</span>
              <span className="text-sm text-gray-400">{movie.details?.find(d => d.name.toLowerCase().includes('thời lượng'))?.value || '120 phút'}</span>
              <span className="text-gray-600">•</span>
              <span className="text-sm text-gray-400 line-clamp-1">{movie.details?.find(d => d.name.toLowerCase().includes('đạo diễn'))?.value || 'Đang cập nhật'}</span>
              <span className="text-gray-600">•</span>
              {movie.categories?.map(c => (
                <span
                  key={c._id}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    color: '#9ca3af',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {c.name}
                </span>
              ))}
            </div>

            {/* Synopsis */}
            <p
              key={`synopsis-${current}`}
              className="text-sm text-gray-400 leading-relaxed mb-8 max-w-md"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                animation: 'hero-content-in 0.6s 0.2s ease both',
              }}
            >
              {movie.description}
            </p>

            {/* CTA Buttons */}
            <div
              key={`cta-${current}`}
              className="flex items-center gap-3 flex-wrap"
              style={{ animation: 'hero-content-in 0.6s 0.25s ease both' }}
            >
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => navigate(`/phim/${movie.slug}`)}
              >
                <TicketIcon />
                Đặt Vé Ngay
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* ── BOTTOM CONTROLS ─────────────────────────────────────── */}
      <div className="absolute bottom-8 inset-x-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">

            {/* Dots + progress */}
            <div className="flex flex-col gap-3">
              <SlideDots total={total} current={current} onDotClick={goTo} />
              <div className="w-40">
                <ProgressBar key={current} active={!paused} duration={AUTOPLAY_DURATION} />
              </div>
            </div>

            {/* Poster thumbnails — right side */}
            <div className="hidden sm:flex items-end gap-2">
              {movies.map((m, i) => (
                <button
                  key={m._id}
                  onClick={() => goTo(i)}
                  className="relative rounded-xl overflow-hidden shrink-0 transition-all duration-300 bg-[#111]"
                  style={{
                    width:   i === current ? '56px' : '44px',
                    height:  i === current ? '80px' : '64px',
                    opacity: i === current ? 1 : 0.45,
                    outline: i === current ? '2px solid #E50914' : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  <img src={getPoster(m)} alt={m.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── ARROW CONTROLS ──────────────────────────────────────── */}
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        aria-label="Slide trước"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        aria-label="Slide tiếp"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

    </section>
  )
}
