import { Music, Disc3 } from 'lucide-react';

export default function SoundtrackMoodCard({ soundtrack }) {
  if (!soundtrack) return null;

  return (
    <div className="card movie-subcard soundtrack-card">
      <div className="soundtrack-head">
        <div>
          <span className="eyebrow">Original Score</span>
          <h3 style={{ marginTop: 6 }}>{soundtrack.name}</h3>
        </div>
        <div className="vinyl-badge" aria-hidden="true">
          <Disc3 size={26} />
        </div>
      </div>

      <p className="soundtrack-atmo">{soundtrack.atmosphere}</p>

      <div className="soundtrack-tags">
        {(soundtrack.genres || []).map((g) => (
          <span key={g} className="tag"><Music size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{g}</span>
        ))}
      </div>

      {soundtrack.tempo && (
        <small className="soundtrack-tempo">Tempo & feel: {soundtrack.tempo}</small>
      )}
    </div>
  );
}
