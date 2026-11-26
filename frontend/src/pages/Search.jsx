import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';

const DEST_CHIPS = ['All', 'Jaipur', 'Manali', 'Goa', 'Udaipur', 'Agra', 'Rishikesh', 'Kyoto', 'Paris'];
const TABS = ['Hotels', 'Flights', 'Trains', 'Buses', 'Rentals', 'Restaurants', 'Activities'];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const dest = params.get('dest') || '';
  const nav = useNavigate();
  const { user } = useAuth();
  const { formatMoney } = useRealtime();

  const [all, setAll] = useState({ Hotels: [], Flights: [], Trains: [], Buses: [], Rentals: [], Restaurants: [], Activities: [] });
  const [savedIds, setSavedIds] = useState([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Hotels');
  const [minRating, setMin] = useState(0);
  const [maxPrice, setMax] = useState(null);
  const [sort, setSort] = useState('rating');
  const [cmp, setCmp] = useState([]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const qs = dest ? `?destination=${encodeURIComponent(dest)}` : '';
    api.get(`/search${qs}`)
      .then((res) => { if (live) setAll(res.data); })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [dest]);

  useEffect(() => {
    if (!user) return;
    api.get('/saved').then((res) => setSavedIds(res.data.ids || [])).catch(() => {});
  }, [user?.user_id]);

  const setDestination = (d) => {
    const next = new URLSearchParams(params);
    if (d && d !== 'All') next.set('dest', d);
    else next.delete('dest');
    setParams(next);
    setMax(null);
    setCmp([]);
  };

  const toggleSave = async (item) => {
    if (!user) {
      nav('/login', { state: { from: '/search' } });
      return;
    }
    const res = await api.post('/saved', {
      id: item.id,
      category: tab,
      name: item.name,
      destination: item.destination || dest,
      price: item.price,
      meta: item.meta,
    });
    setSavedIds(res.data.ids || []);
  };

  const items = all[tab] || [];
  const top = items.length ? Math.max(...items.map((i) => i.price)) : 5000;
  const limit = maxPrice ?? top;
  const shown = items
    .filter((i) => i.price <= limit && i.rating >= minRating && (!savedOnly || savedIds.includes(i.id)))
    .sort((a, b) => (sort === 'price' ? a.price - b.price : sort === 'priceDesc' ? b.price - a.price : b.rating - a.rating));
  const picked = items.filter((i) => cmp.includes(i.id));
  const changeTab = (t) => { setTab(t); setMax(null); setCmp([]); };
  const toggle = (id) => setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));

  return (
    <div className="wrap page">
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <span className="eyebrow">Search & Compare · {dest || 'All Destinations'}</span>
          <h1>Find stays, travel & rentals</h1>
        </div>
        <button
          type="button"
          className={savedOnly ? 'tab on' : 'tab'}
          onClick={() => setSavedOnly(!savedOnly)}
        >
          <Heart size={13} fill={savedOnly ? 'currentColor' : 'none'} style={{ marginRight: 5 }} />
          Saved ({savedIds.length})
        </button>
      </div>

      <div className="chips" style={{ marginTop: 0 }}>
        {DEST_CHIPS.map((d) => (
          <button
            key={d}
            className={(d === 'All' && !dest) || dest.toLowerCase() === d.toLowerCase() ? 'chip on' : 'chip'}
            onClick={() => setDestination(d)}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'tab on' : 'tab'} onClick={() => changeTab(t)}>
            {t} ({(all[t] || []).length})
          </button>
        ))}
      </div>

      <div className="card filters">
        <label>Max price: {formatMoney(limit)}
          <input type="range" min={0} max={top || 1000} step={50} value={limit} onChange={(e) => setMax(+e.target.value)} />
        </label>
        <label>Min rating: {minRating || 'Any'}
          <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMin(+e.target.value)} />
        </label>
        <label>Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rating">Top rated</option>
            <option value="price">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
          </select>
        </label>
      </div>

      {loading ? <p className="lead">Loading options…</p> : (
        <AnimatePresence mode="popLayout">
          {shown.map((i) => {
            const isSaved = savedIds.includes(i.id);
            return (
              <motion.div layout key={i.id} className="card res" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3>{i.name}</h3>
                    <button
                      type="button"
                      className="heart-btn"
                      onClick={() => toggleSave(i)}
                      title={isSaved ? 'Remove from saved' : 'Save to wishlist'}
                    >
                      <Heart size={16} fill={isSaved ? '#b5573f' : 'none'} color={isSaved ? '#b5573f' : '#6f7a78'} />
                    </button>
                  </div>
                  <small>{i.destination ? `${i.destination} · ` : ''}{i.meta}</small>
                  <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: '.84rem' }}>
                    <span className="rating-pill"><Star size={12} fill="currentColor" /> {i.rating}</span>
                    {i.reviews && <small style={{ color: 'var(--muted)' }}>({i.reviews} verified reviews)</small>}
                    {(i.badges || []).map((b) => (
                      <span key={b} className="deal-badge"><CheckCircle2 size={11} /> {b}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="price">{formatMoney(i.price)}</div>
                  <label className="cmp"><input type="checkbox" checked={cmp.includes(i.id)} onChange={() => toggle(i.id)} /> Compare</label>
                  <button
                    className="btn small"
                    style={{ marginTop: 8 }}
                    onClick={() => nav('/booking', { state: { item: i, type: tab, dest: i.destination || dest || 'Jaipur' } })}
                  >
                    Book
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
      {!loading && !shown.length && <p className="lead">No {tab.toLowerCase()} match these filters{dest ? ` in ${dest}` : ''}.</p>}

      <AnimatePresence>
        {picked.length > 1 && (
          <motion.div className="cmpbar" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}>
            <b>Comparing {picked.length} options</b>
            <table>
              <thead><tr><th></th>{picked.map((p) => <th key={p.id}>{p.name}</th>)}</tr></thead>
              <tbody>
                <tr><td>Price</td>{picked.map((p) => <td key={p.id}>{formatMoney(p.price)}</td>)}</tr>
                <tr><td>Rating</td>{picked.map((p) => <td key={p.id}>{p.rating}</td>)}</tr>
                <tr><td>Details</td>{picked.map((p) => <td key={p.id}>{p.meta}</td>)}</tr>
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
