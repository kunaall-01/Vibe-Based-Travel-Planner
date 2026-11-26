import { Film, Calendar, Clock } from 'lucide-react';

export default function CinematicTripCover({ movie, actions }) {
  if (!movie) return null;
  const palette = movie.color_palette || [];
  const accent = palette[0]?.hex || '#a8743c';
  const deep = palette[3]?.hex || '#1d2d2a';

  return (
    <section
      className="movie-cover"
      style={{
        '--movie-accent': accent,
        '--movie-deep': deep,
      }}
    >
      <img
        src={movie.cover_image}
        alt={movie.movie_title}
        className="movie-cover-img"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="movie-cover-shade" />
      <div className="movie-cover-grain" />

      <div className="movie-cover-inner">
        <div className="movie-cover-top">
          <span className="movie-badge">
            <Film size={13} /> A Wayfarer Original Film
          </span>
          <span className="movie-meta-pill">
            {movie.destination} · {(movie.vibe || '').toUpperCase()}
          </span>
        </div>

        <div className="movie-cover-bottom">
          <p className="movie-genre">{movie.genre}</p>
          <h1 className="movie-title">{movie.movie_title}</h1>
          <p className="movie-tagline">“{movie.tagline}”</p>

          <div className="movie-credits">
            <span><Clock size={14} /> {movie.duration_days || movie.story_arc?.length || 4} Days</span>
            {movie.dates && <span><Calendar size={14} /> {movie.dates}</span>}
            <span>Mood: {movie.mood}</span>
          </div>

          {actions && <div className="movie-cover-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
