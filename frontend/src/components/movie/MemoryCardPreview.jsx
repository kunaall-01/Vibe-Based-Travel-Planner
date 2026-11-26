import { Star, Heart, Download, Share2 } from 'lucide-react';
import { downloadMemoryCardPng } from '../../utils/posterCanvas.js';

export default function MemoryCardPreview({ movie, memory, trip, onShare }) {
  const photos = memory?.photos || [];
  const hero = photos[0] || movie?.cover_image || trip?.img;
  const rating = memory?.trip_rating || 5;
  const storyline = memory?.post_trip_storyline || movie?.tagline || '';

  return (
    <div className="memory-preview-card">
      <div className="memory-hero">
        {hero && <img src={hero} alt={movie?.movie_title || trip?.title} />}
        <div className="memory-hero-shade" />
        <span className="memory-badge">Memory Card · Wayfarer</span>
      </div>

      <div className="memory-body">
        <div className="memory-meta">
          <span>{(memory?.favorite_destination || trip?.destination || movie?.destination || '').toUpperCase()}</span>
          <span>{trip?.dates || movie?.dates}</span>
        </div>

        <h3>{movie?.movie_title || trip?.title}</h3>
        {storyline && <p className="memory-storyline">“{storyline}”</p>}
        {memory?.personal_caption && <p className="memory-caption">{memory.personal_caption}</p>}

        {memory?.favorite_activity && (
          <div className="memory-fav-act">
            <Heart size={13} color="#e7c89a" /> Favourite scene: <b>{memory.favorite_activity}</b>
          </div>
        )}

        {photos.length > 1 && (
          <div className="memory-thumbs">
            {photos.slice(1, 5).map((p, idx) => (
              <img key={idx} src={p} alt={`Memory ${idx + 2}`} />
            ))}
          </div>
        )}

        <div className="memory-footer">
          <div className="memory-stars" aria-label={`Rated ${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} size={15} fill={n <= rating ? '#e7c89a' : 'none'} color="#e7c89a" />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn small" onClick={() => downloadMemoryCardPng(movie, memory, trip)}>
              <Download size={14} /> Download PNG
            </button>
            {onShare && (
              <button type="button" className="btn ghost small" style={{ borderColor: 'rgba(255,255,255,0.45)', color: '#fff' }} onClick={onShare}>
                <Share2 size={14} /> Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
