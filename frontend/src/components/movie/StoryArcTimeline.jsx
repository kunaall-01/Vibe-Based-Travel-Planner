import { useState } from 'react';
import TripChapterCard from './TripChapterCard.jsx';

export default function StoryArcTimeline({ storyArc = [], palette = [] }) {
  const [openDay, setOpenDay] = useState(0);
  if (!storyArc.length) return null;

  const accent = palette[0]?.hex || '#a8743c';

  return (
    <section className="story-arc-section">
      <div className="story-arc-head">
        <div>
          <span className="eyebrow">Story Arc</span>
          <h2 style={{ marginTop: 6 }}>Chapters of Your Journey</h2>
        </div>
        <button
          type="button"
          className="link"
          onClick={() => setOpenDay(openDay === 'all' ? 0 : 'all')}
        >
          {openDay === 'all' ? 'Collapse chapters' : 'Expand all chapters'}
        </button>
      </div>

      <div className="chapter-list">
        {storyArc.map((ch, idx) => (
          <TripChapterCard
            key={ch.day || idx}
            chapter={ch}
            accentColor={accent}
            isOpen={openDay === 'all' || openDay === idx}
            onToggle={() => setOpenDay(openDay === idx ? -1 : idx)}
          />
        ))}
      </div>
    </section>
  );
}
