import ColorPaletteDisplay from './ColorPaletteDisplay.jsx';
import SoundtrackMoodCard from './SoundtrackMoodCard.jsx';

export default function MovieIdentitySection({ movie }) {
  if (!movie) return null;

  return (
    <section className="movie-identity-section">
      <div className="card movie-synopsis-card">
        <span className="eyebrow">The Storyline</span>
        <h2 style={{ marginTop: 8, marginBottom: 12 }}>Synopsis</h2>
        <p className="movie-synopsis-text">{movie.synopsis}</p>
        <div className="movie-mood-strip">
          <span><b>Genre:</b> {movie.genre}</span>
          <span><b>Emotional Theme:</b> {movie.mood}</span>
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <SoundtrackMoodCard soundtrack={movie.soundtrack_mood} />
        <ColorPaletteDisplay palette={movie.color_palette} />
      </div>
    </section>
  );
}
