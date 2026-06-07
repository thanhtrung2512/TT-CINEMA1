const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';

export function getMovieDisplayRating(movie) {
  const detailRating = movie?.details?.find((d) =>
    d.name?.toLowerCase().includes('đánh giá')
  )?.value;

  if (detailRating != null && detailRating !== '') {
    const parsed = parseFloat(detailRating);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  if (movie?.averageRating > 0) return movie.averageRating;
  return 0;
}

export default function StarRating({ rating = 0, size = 'md', showScore = true, className = '' }) {
  const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating || 0;
  const rounded = Math.round(numericRating);
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const scoreClass = size === 'sm' ? 'text-[10px]' : 'text-sm';

  if (numericRating <= 0) return null;

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`${sizeClass} shrink-0 ${i <= rounded ? 'text-yellow-400' : 'text-yellow-400/30'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
      {showScore && (
        <span className={`ml-0.5 font-bold text-yellow-400 ${scoreClass}`}>
          {numericRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
