import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Sparkles, Search as SearchIcon, CheckCircle2, Trash2, Film, Share2, Camera, Plus } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import Photo from '../components/Photo.jsx';
import Reveal from '../components/Reveal.jsx';
import ShareTripModal from '../components/movie/ShareTripModal.jsx';
import MemoryCardEditor from '../components/movie/MemoryCardEditor.jsx';

const nice = (d) => {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
};

function BookingRow({ b, onOpen }) {
  return (
    <button className="bk" onClick={() => onOpen(b)}>
      <div><h3>{b.name}</h3><small>{b.place} · {b.dates}</small></div>
      <span className={`st ${b.status}`}>{b.status}</span>
    </button>
  );
}

export default function MyTrips() {
  const { user } = useAuth();
  const { formatMoney } = useRealtime();
  const [data, setData] = useState({ upcoming: null, past: [] });
  const [checklist, setChecklist] = useState([]);
  const [newCheck, setNewCheck] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [shareMovie, setShareMovie] = useState(null);
  const [memoryTrip, setMemoryTrip] = useState(null);

  const loadTrips = () => {
    setLoading(true);
    api.get('/trips')
      .then((res) => {
        setData(res.data);
        if (res.data?.upcoming?.id) {
          api.get(`/trips/${res.data.upcoming.id}/checklist`).then((cr) => setChecklist(cr.data.items || [])).catch(() => {});
        } else {
          setChecklist([]);
        }
      })
      .catch(() => setData({ upcoming: null, past: [] }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const markCompleted = async (tripId) => {
    await api.patch(`/trips/${tripId}/status`, { status: 'Completed' });
    loadTrips();
  };

  const cancelBooking = async (bookingId) => {
    await api.delete(`/trips/bookings/${bookingId}`);
    setSel(null);
    loadTrips();
  };

  const toggleCheck = async (item) => {
    const next = !item.checked;
    setChecklist((prev) => prev.map((x) => (x.item_id === item.item_id ? { ...x, checked: next ? 1 : 0 } : x)));
    await api.patch(`/trips/checklist/${item.item_id}`, { checked: next });
  };

  const addChecklistItem = async (e) => {
    e.preventDefault();
    if (!newCheck.trim() || !data.upcoming?.id) return;
    const res = await api.post(`/trips/${data.upcoming.id}/checklist`, { label: newCheck.trim() });
    setChecklist((prev) => [...prev, res.data.item]);
    setNewCheck('');
  };

  const up = data.upcoming;
  const past = data.past || [];

  if (loading) {
    return (
      <div className="wrap page">
        <div className="head"><span className="eyebrow">My Trips</span><h2>Loading your journal…</h2></div>
      </div>
    );
  }

  const stay = up ? up.stays.reduce((s, b) => s + Number(b.amount || 0), 0) : 0;
  const move = up ? up.transport.reduce((s, b) => s + Number(b.amount || 0), 0) : 0;
  const acts = up ? (up.activities || []).reduce((s, b) => s + Number(b.amount || 0), 0) : 0;
  const left = up ? up.budget - stay - move - acts : 0;
  const days = up ? Math.max(0, Math.ceil((new Date(up.start) - new Date()) / 864e5)) : 0;
  const rows = [
    ['Accommodation', stay],
    ['Transport & Rentals', move],
    ...(acts > 0 ? [['Activities & dining', acts]] : []),
    ['Still to spend', Math.max(left, 0)],
  ];

  return (
    <div className="wrap page">
      <div className="head">
        <span className="eyebrow">My Trips</span>
        <h2>Your travel journal{user?.name ? `, ${user.name}` : ''}</h2>
      </div>

      {!up ? (
        <div className="empty-box">
          <h2>No trips planned yet</h2>
          <p>
            You haven’t saved an itinerary or booked any stays or transport yet. Pick a vibe to build your first trip movie,
            or search stays and transport to get started.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/vibe" className="btn"><Sparkles size={16} /> Pick your vibe</Link>
            <Link to="/search" className="btn ghost"><SearchIcon size={16} /> Search stays & travel</Link>
          </div>
        </div>
      ) : (
        <>
          <Photo src={up.movie?.cover_image || up.img} className="tripHero">
            <div className="in">
              <div>
                <span className="eyebrow" style={{ color: '#e7c89a' }}>
                  {up.movie ? `NOW SHOWING · ${up.movie.genre.toUpperCase()} · ` : 'Next journey · '}
                  {nice(up.start)}{up.end && up.end !== up.start ? ` – ${nice(up.end)}` : ''}
                </span>
                <h1>{up.movie?.movie_title || up.title}</h1>
                <p>{up.movie ? `“${up.movie.tagline}”` : up.subtitle}</p>
                <div className="quick">
                  {up.movie?.share_slug && (
                    <Link to={`/movie/${up.movie.share_slug}`}><Film size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Enter Your Movie</Link>
                  )}
                  <Link to={`/itinerary?dest=${encodeURIComponent(up.destination || '')}`}>Itinerary</Link>
                  <Link to={`/plan-b?dest=${encodeURIComponent(up.destination || '')}`}>Plan B</Link>
                  <Link to={`/local-pulse?dest=${encodeURIComponent(up.destination || '')}`}>Local Pulse</Link>
                  <Link to={`/budget?dest=${encodeURIComponent(up.destination || '')}`}>Budget Guardian</Link>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <div className="count"><div className="big">{days}</div><small>days to go</small></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {up.movie && (
                    <button
                      className="btn small"
                      onClick={() => setShareMovie(up.movie)}
                    >
                      <Share2 size={14} /> Share Poster
                    </button>
                  )}
                  {up.id && (
                    <button
                      className="btn ghost small"
                      onClick={() => markCompleted(up.id)}
                    >
                      <CheckCircle2 size={14} /> Mark completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Photo>

          <div className="split sect">
            <Reveal>
              {up.stays.length > 0 && (
                <>
                  <h2>Where you’ll stay</h2>
                  <p className="sub">Your booked accommodation. Tap a booking to see its details.</p>
                  {up.stays.map((b) => <BookingRow key={b.id} b={b} onOpen={setSel} />)}
                </>
              )}

              {up.transport.length > 0 && (
                <>
                  <h2 style={{ marginTop: up.stays.length ? 44 : 0 }}>Getting around</h2>
                  <p className="sub">Your booked trains, cabs, flights and rentals in order of travel.</p>
                  {up.transport.map((b) => <BookingRow key={b.id} b={b} onOpen={setSel} />)}
                </>
              )}

              {up.activities?.length > 0 && (
                <>
                  <h2 style={{ marginTop: (up.stays.length || up.transport.length) ? 44 : 0 }}>Booked experiences & dining</h2>
                  <p className="sub">Your reserved tours, activities and meals.</p>
                  {up.activities.map((b) => <BookingRow key={b.id} b={b} onOpen={setSel} />)}
                </>
              )}

              {up.stays.length === 0 && up.transport.length === 0 && (!up.activities || up.activities.length === 0) && (
                <div className="card">
                  <h3>No stays or transport booked yet</h3>
                  <p className="lead" style={{ marginBottom: 16 }}>
                    Your itinerary is saved! Ready to reserve a hotel, train, flight, or rental for {up.destination}?
                  </p>
                  <Link to={`/search?dest=${encodeURIComponent(up.destination || '')}`} className="btn small">
                    Browse {up.destination} options <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              {up.id && (
                <div className="card" style={{ marginTop: 28 }}>
                  <span className="eyebrow">Smart Packing Assistant</span>
                  <h3 style={{ margin: '6px 0 12px' }}>Pre-trip Checklist</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {checklist.map((item) => (
                      <label key={item.item_id} className="check-row">
                        <input type="checkbox" checked={Boolean(item.checked)} onChange={() => toggleCheck(item)} />
                        <span style={{ textDecoration: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.6 : 1 }}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <form onSubmit={addChecklistItem} style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="Add packing item…"
                      value={newCheck}
                      onChange={(e) => setNewCheck(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 10 }}
                    />
                    <button type="submit" className="btn ghost small"><Plus size={14} /> Add</button>
                  </form>
                </div>
              )}
            </Reveal>

            <Reveal delay={0.1}>
              <div className="card bud">
                <span className="eyebrow">Trip budget</span>
                <div className="figs">
                  <div className="fig"><small>Budget</small><b>{formatMoney(up.budget)}</b></div>
                  <div className="fig"><small>Remaining</small><b>{formatMoney(left)}</b></div>
                </div>
                {rows.map(([n, v]) => (
                  <div key={n}>
                    <div className="cat"><span>{n}</span><span>{formatMoney(v)}</span></div>
                    <div className="meter">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(100, (v / Math.max(up.budget, 1)) * 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        style={{ opacity: n === 'Still to spend' ? 0.35 : 1 }}
                      />
                    </div>
                  </div>
                ))}
                <Link to={`/budget?dest=${encodeURIComponent(up.destination || '')}`} className="link" style={{ marginTop: 20 }}>
                  Open Budget Guardian <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          </div>
        </>
      )}

      <section className="sect">
        <h2>Travel history & Memory Cards</h2>
        <p className="sub">Completed journeys become keepsake Memory Cards with your own photos and story.</p>
        {past.length === 0 ? (
          <div className="empty-box" style={{ padding: '28px 20px' }}>
            <p style={{ margin: 0 }}>No travel history yet. Once you mark a planned trip as completed, it will appear here so you can create a Memory Card.</p>
          </div>
        ) : (
          <div className="history">
            {past.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.07}>
                <div className="past-movie-wrap">
                  <Photo src={p.memory?.photos?.[0] || p.movie?.cover_image || p.img} className="pc">
                    <div>
                      <small>{p.dates} · {p.status}</small>
                      <h3>{p.movie?.movie_title || p.title}</h3>
                      <p>{p.memory?.post_trip_storyline || p.movie?.tagline || p.note}</p>
                    </div>
                  </Photo>
                  <div className="past-movie-actions">
                    {p.movie?.share_slug && (
                      <Link to={`/movie/${p.movie.share_slug}`} className="link" style={{ fontSize: '.84rem' }}>
                        <Film size={13} /> Open Film
                      </Link>
                    )}
                    <button type="button" className="btn small" onClick={() => setMemoryTrip(p)}>
                      <Camera size={13} /> {p.memory ? 'Edit Memory Card' : 'Create Memory Card'}
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence>
        {sel && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSel(null)}>
            <motion.aside className="drawer" initial={{ x: 60 }} animate={{ x: 0 }} exit={{ x: 60 }} onClick={(e) => e.stopPropagation()}>
              <button className="link" onClick={() => setSel(null)}><X size={16} /> Close</button>
              <h2 style={{ marginTop: 16 }}>{sel.name}</h2>
              <span className={`st ${sel.status}`}>{sel.status}</span>
              <dl>
                <dt>Destination / Type</dt><dd>{sel.place}</dd>
                <dt>When</dt><dd>{sel.dates}</dd>
                <dt>Reference</dt><dd>{sel.ref}</dd>
                <dt>Amount</dt><dd>{formatMoney(sel.amount)}</dd>
                <dt>Payment method</dt><dd>{sel.method}</dd>
                <dt>Payment status</dt><dd>{sel.paid}</dd>
              </dl>
              <button
                className="btn ghost small"
                style={{ marginTop: 24, borderColor: 'var(--high)', color: 'var(--high)' }}
                onClick={() => cancelBooking(sel.id)}
              >
                <Trash2 size={14} /> Cancel booking
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareTripModal
        open={Boolean(shareMovie)}
        onClose={() => setShareMovie(null)}
        movie={shareMovie}
        shareSlug={shareMovie?.share_slug}
      />

      {memoryTrip && (
        <MemoryCardEditor
          open={Boolean(memoryTrip)}
          onClose={() => setMemoryTrip(null)}
          trip={memoryTrip}
          onSaved={() => loadTrips()}
        />
      )}
    </div>
  );
}
