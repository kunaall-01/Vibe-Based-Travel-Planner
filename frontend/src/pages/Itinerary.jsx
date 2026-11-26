import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, BookmarkCheck, Share2, Film, Play, ListOrdered } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import CinematicTripCover from '../components/movie/CinematicTripCover.jsx';
import MovieIdentitySection from '../components/movie/MovieIdentitySection.jsx';
import StoryArcTimeline from '../components/movie/StoryArcTimeline.jsx';
import TripRevealAnimation from '../components/movie/TripRevealAnimation.jsx';
import ShareTripModal from '../components/movie/ShareTripModal.jsx';

export default function Itinerary() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const nav = useNavigate();

  const vibesParam = params.get('vibes') || (() => {
    try { return (JSON.parse(localStorage.getItem('selectedVibes') || '[]')).join(','); } catch { return ''; }
  })();
  const destParam = params.get('dest') || '';
  const daysParam = Number(params.get('days') || 4);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(0);
  const [viewMode, setViewMode] = useState('movie'); // 'movie' | 'schedule'
  const [showTrailer, setShowTrailer] = useState(Boolean(params.get('vibes')));
  const [shareOpen, setShareOpen] = useState(false);
  const [savedMeta, setSavedMeta] = useState(null); // { itinerary_id, share_slug }
  const [customDest, setCustomDest] = useState(destParam);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let live = true;
    setLoading(true);
    setSavedMeta(null);
    const qs = new URLSearchParams();
    if (vibesParam) qs.set('vibes', vibesParam);
    if (destParam) qs.set('destination', destParam);
    if (daysParam) qs.set('days', String(daysParam));

    api.get(`/itinerary?${qs.toString()}`)
      .then((res) => {
        if (live) {
          setData(res.data);
          setOpen(0);
        }
      })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [vibesParam, destParam, daysParam]);

  const applyDest = (name) => {
    const next = new URLSearchParams(params);
    if (name) next.set('dest', name);
    else next.delete('dest');
    setParams(next);
  };

  const applyDays = (d) => {
    const next = new URLSearchParams(params);
    next.set('days', String(d));
    setParams(next);
  };

  const saveTrip = async () => {
    if (!user) {
      nav('/login', { state: { from: `/itinerary?${params.toString()}` } });
      return null;
    }
    if (savedMeta?.share_slug) return savedMeta.share_slug;
    setSaving(true);
    try {
      const res = await api.post('/itinerary/save', data);
      setSavedMeta({ itinerary_id: res.data.itinerary_id, share_slug: res.data.share_slug });
      setToast('Trip & Movie Identity saved to My Trips!');
      setTimeout(() => setToast(''), 2800);
      return res.data.share_slug;
    } catch {
      setToast('Could not save trip.');
      setTimeout(() => setToast(''), 2600);
      return null;
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="wrap page" style={{ maxWidth: 920 }}>
        <p className="lead">Crafting your cinematic itinerary…</p>
      </div>
    );
  }

  const movie = data.movie;
  const destQuery = encodeURIComponent(data.destination || '');
  const destChoices = data.available_destinations || [];

  return (
    <div className="wrap page" style={{ maxWidth: 980 }}>
      <AnimatePresence>
        {showTrailer && movie && (
          <TripRevealAnimation movie={movie} onEnter={() => setShowTrailer(false)} />
        )}
      </AnimatePresence>

      {/* Top Controls Bar */}
      <div className="card itinerary-toolbar">
        <div className="toolbar-controls">
          <select
            value={destParam}
            onChange={(e) => { setCustomDest(e.target.value); applyDest(e.target.value); }}
            aria-label="Destination"
          >
            <option value="">Matched to vibe ({data.destination})</option>
            {destChoices.map((d) => (
              <option key={d.slug} value={d.name}>{d.name} ({d.primary_vibe})</option>
            ))}
          </select>

          <select
            value={daysParam}
            onChange={(e) => applyDays(Number(e.target.value))}
            aria-label="Days"
          >
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} days</option>)}
          </select>

          <form
            onSubmit={(e) => { e.preventDefault(); applyDest(customDest.trim()); }}
            className="toolbar-city-form"
          >
            <input
              placeholder="Or any city…"
              value={customDest}
              onChange={(e) => setCustomDest(e.target.value)}
            />
            <button className="btn ghost small" type="submit">Go</button>
          </form>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className={viewMode === 'movie' ? 'tab on' : 'tab'}
            onClick={() => setViewMode('movie')}
          >
            <Film size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Movie Mode
          </button>
          <button
            type="button"
            className={viewMode === 'schedule' ? 'tab on' : 'tab'}
            onClick={() => setViewMode('schedule')}
          >
            <ListOrdered size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Classic Schedule
          </button>
          <button type="button" className="btn ghost small" onClick={() => setShowTrailer(true)}>
            <Play size={13} /> Trailer
          </button>
          <button type="button" className="btn ghost small" onClick={() => setShareOpen(true)}>
            <Share2 size={14} /> Share Poster
          </button>
          <button type="button" className="btn small" onClick={saveTrip} disabled={saving}>
            <BookmarkCheck size={15} /> {saving ? 'Saving…' : savedMeta ? 'Saved ✓' : 'Save to My Trips'}
          </button>
        </div>
      </div>

      {/* Movie Mode View */}
      {viewMode === 'movie' && movie ? (
        <div className="movie-experience">
          <CinematicTripCover
            movie={movie}
            actions={
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {savedMeta?.share_slug && (
                  <Link to={`/movie/${savedMeta.share_slug}`} className="btn small">
                    Open Full Movie Story
                  </Link>
                )}
                <button
                  type="button"
                  className="btn ghost small"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 size={14} /> Share / Download Poster
                </button>
              </div>
            }
          />

          <div className="quick" style={{ marginTop: 18 }}>
            <Link className="link" to={`/plan-b?dest=${destQuery}`}>Plan B for {data.destination}</Link>
            <Link className="link" to={`/local-pulse?dest=${destQuery}`}>Local Pulse ({data.destination})</Link>
            <Link className="link" to={`/budget?dest=${destQuery}`}>Budget for {data.destination}</Link>
            <Link className="link" to={`/search?dest=${destQuery}`}>Book stays & transport</Link>
          </div>

          <MovieIdentitySection movie={movie} />
          <StoryArcTimeline storyArc={movie.story_arc} palette={movie.color_palette} />
        </div>
      ) : (
        /* Classic Schedule View (preserved intact) */
        <div style={{ maxWidth: 800, margin: '28px auto 0' }}>
          <div className="head">
            <span className="eyebrow">{data.vibe ? `${data.vibe.toUpperCase()} VIBE · ` : ''}{data.dates}</span>
            <h1>{data.title}</h1>
            <div className="quick" style={{ marginTop: 14 }}>
              <Link className="link" to={`/plan-b?dest=${destQuery}`}>Plan B for {data.destination}</Link>
              <Link className="link" to={`/local-pulse?dest=${destQuery}`}>Local Pulse ({data.destination})</Link>
              <Link className="link" to={`/budget?dest=${destQuery}`}>Budget for {data.destination}</Link>
              <Link className="link" to={`/search?dest=${destQuery}`}>Book stays & transport</Link>
            </div>
          </div>

          {data.days.map((d, i) => (
            <div className="day" key={d.day}>
              <button onClick={() => setOpen(open === i ? -1 : i)}>
                <span className="n">{String(d.day).padStart(2, '0')}</span>
                <span className="t">{d.title}</span>
                <motion.span animate={{ rotate: open === i ? 180 : 0 }}><ChevronDown /></motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ paddingBottom: 18 }}>
                      {d.items.map((it, idx) => (
                        <div className="slot" key={`${it.time}-${idx}`}>
                          <b>{it.time}</b><span>{it.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      <ShareTripModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        movie={movie}
        shareSlug={savedMeta?.share_slug}
        onEnsureSaved={user ? saveTrip : undefined}
      />

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
