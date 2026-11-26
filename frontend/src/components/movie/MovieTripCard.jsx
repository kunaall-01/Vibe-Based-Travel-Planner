export default function MovieTripCard({ movie, format = '4:5' }) {
  if (!movie) return null;
  const isStory = format === '9:16';
  const palette = movie.color_palette || [];
  const accent = palette[0]?.hex || '#e7c89a';
  const deep = palette[3]?.hex || '#182422';

  return (
    <div
      className={`poster-card ${isStory ? 'story' : 'feed'}`}
      style={{ '--poster-accent': accent, '--poster-deep': deep }}
    >
      <img
        src={movie.cover_image}
        alt={movie.movie_title}
        className="poster-card-img"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="poster-card-shade" />
      <div className="poster-card-frame" />

      <div className="poster-card-content">
        <div className="poster-card-top">
          <span>WAYFARER CINEMA</span>
          <span>{movie.destination?.toUpperCase()} · {(movie.vibe || '').toUpperCase()}</span>
        </div>

        <div className="poster-swatches">
          {palette.slice(0, 4).map((sw) => (
            <span key={sw.hex} style={{ background: sw.hex }} title={sw.name} />
          ))}
        </div>

        <div className="poster-card-main">
          <small className="poster-genre">{movie.genre}</small>
          <h3>{movie.movie_title}</h3>
          <p className="poster-tag">“{movie.tagline}”</p>
          <p className="poster-syn">{movie.synopsis}</p>

          <div className="poster-chapters">
            {(movie.chapter_titles || []).slice(0, 4).map((ch) => (
              <span key={ch}>{ch}</span>
            ))}
          </div>
        </div>

        <div className="poster-card-foot">
          <span>{movie.duration_days || movie.story_arc?.length || 4} Days</span>
          {movie.budget ? <span>₹{Number(movie.budget).toLocaleString('en-IN')} Est.</span> : null}
          {movie.soundtrack_mood?.name && <span>♪ {movie.soundtrack_mood.name}</span>}
        </div>
      </div>
    </div>
  );
}
