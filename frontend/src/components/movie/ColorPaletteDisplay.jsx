export default function ColorPaletteDisplay({ palette = [] }) {
  if (!palette.length) return null;

  return (
    <div className="card movie-subcard">
      <span className="eyebrow">Color Palette</span>
      <h3 style={{ marginTop: 6, marginBottom: 14 }}>Visual Grading</h3>
      <div className="palette-row">
        {palette.map((sw) => (
          <div className="palette-swatch" key={sw.hex + sw.name}>
            <div className="swatch-dot" style={{ background: sw.hex }} />
            <div>
              <b>{sw.name}</b>
              <small>{sw.hex}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
