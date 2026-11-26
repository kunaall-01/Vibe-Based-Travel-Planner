import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, CheckCircle2, MapPin, Map as MapIcon, List } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import TravelMap from '../components/TravelMap.jsx';

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
  const [queryText, setQueryText] = useState('');
  const [viewMode, setViewMode] = useState('split'); // split | map | list
  const [mapAllCats, setMapAllCats] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Hotels');
  const [minRating, setMin] = useState(0);
  const [maxPrice, setMax] = useState(null);
  const [sort, setSort] = useState('rating');
  const [cmp, setCmp] = useState([]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setSelectedPlaceId(null);
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
  const qLower = queryText.trim().toLowerCase();

  const matchesQuery = (i) =>
    !qLower ||
    (i.name || '').toLowerCase().includes(qLower) ||
    (i.meta || '').toLowerCase().includes(qLower) ||
    (i.destination || '').toLowerCase().includes(qLower) ||
    (i.location || '').toLowerCase().includes(qLower);

  const shown = items
    .filter((i) => i.price <= limit && i.rating >= minRating && (!savedOnly || savedIds.includes(i.id)) && matchesQuery(i))
    .sort((a, b) => (sort === 'price' ? a.price - b.price : sort === 'priceDesc' ? b.price - a.price : b.rating - a.rating));

  // Build map markers from either all categories or the active tab
  const mapPlaces = mapAllCats
    ? TABS.flatMap((t) =>
        (all[t] || [])
          .filter((i) => (!savedOnly || savedIds.includes(i.id)) && matchesQuery(i))
          .map((i) => ({ ...i, category: t }))
      )
    : shown.map((i) => ({ ...i, category: tab }));

  const picked = items.filter((i) => cmp.includes(i.id));
  const changeTab = (t) => { setTab(t); setMax(null); setCmp([]); };
  const toggle = (id) => setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));

  const bookItem = (item, itemCategory = tab) => {
    nav('/booking', { state: { item, type: itemCategory, dest: item.destination || dest || 'Jaipur' } });
  };

  return (
    <div className="wrap page">
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <span className="eyebrow">Search, Map &amp; Compare · {dest || 'All Destinations'}</span>
          <h1>Find stays, travel &amp; places</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className={viewMode === 'split' ? 'tab on' : 'tab'} onClick={() => setViewMode('split')}>
            <MapPin size={13} style={{ marginRight: 5 }} /> Split + Map
          </button>
          <button type="button" className={viewMode === 'map' ? 'tab on' : 'tab'} onClick={() => setViewMode('map')}>
            <MapIcon size={13} style={{ marginRight: 5 }} /> Map Only
          </button>
          <button type="button" className={viewMode === 'list' ? 'tab on' : 'tab'} onClick={() => setViewMode('list')}>
            <List size={13} style={{ marginRight: 5 }} /> List Only
          </button>
          <button
            type="button"
            className={savedOnly ? 'tab on' : 'tab'}
            onClick={() => setSavedOnly(!savedOnly)}
          >
            <Heart size={13} fill={savedOnly ? 'currentColor' : 'none'} style={{ marginRight: 5 }} />
            Saved ({savedIds.length})
          </button>
        </div>
      </div>

      {/* Live Keyword Place Search + City Chips */}
      <div className="search-top-bar">
        <input
          className="figma-input"
          placeholder="Search any place, hotel, fort, café, or city (e.g. Solang, Haveli, Palolem, Amber)…"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
      </div>

      <div className="chips" style={{ marginTop: 12 }}>
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
            {t} ({(all[t] || []).filter(matchesQuery).length})
          </button>
        ))}
      </div>

      {viewMode !== 'map' && (
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
      )}

      {loading ? <p className="lead">Loading places &amp; coordinates…</p> : (
        <div className={viewMode === 'split' ? 'search-split-layout' : ''}>
          {viewMode !== 'map' && (
            <div className="search-list-col">
              <AnimatePresence mode="popLayout">
                {shown.map((i) => {
                  const isSaved = savedIds.includes(i.id);
                  const isFocused = String(selectedPlaceId) === String(i.id);
                  return (
                    <motion.div
                      layout
                      key={i.id}
                      className={`card res ${isFocused ? 'res-focused' : ''}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                    >
                      <div style={{ flex: 1, minWidth: 210 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <h3>{i.name}</h3>
                          <button
                            type="button"
                            className="heart-btn"
                            onClick={() => toggleSave(i)}
                            title={isSaved ? 'Remove from saved' : 'Save to wishlist'}
                          >
                            <Heart size={16} fill={isSaved ? '#fb7185' : 'none'} color={isSaved ? '#fb7185' : '#a7f3d0'} />
                          </button>
                        </div>
                        <small>{i.destination ? `${i.destination} · ` : ''}{i.meta}</small>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: '.84rem' }}>
                          <span className="rating-pill"><Star size={12} fill="currentColor" /> {i.rating}</span>
                          {i.reviews && <small>({i.reviews} reviews)</small>}
                          {(i.badges || []).slice(0, 2).map((b) => (
                            <span key={b} className="deal-badge"><CheckCircle2 size={11} /> {b}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="price">{formatMoney(i.price)}</div>
                        <label className="cmp"><input type="checkbox" checked={cmp.includes(i.id)} onChange={() => toggle(i.id)} /> Compare</label>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
                          {viewMode !== 'list' && (
                            <button
                              type="button"
                              className="btn ghost small"
                              onClick={() => setSelectedPlaceId(i.id)}
                              title="Locate on map"
                            >
                              <MapPin size={13} /> Pin
                            </button>
                          )}
                          <button className="btn small" onClick={() => bookItem(i, tab)}>
                            Book
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {!shown.length && <p className="lead">No {tab.toLowerCase()} match these filters{dest ? ` in ${dest}` : ''}.</p>}
            </div>
          )}

          {viewMode !== 'list' && (
            <div className="search-map-col">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '.82rem', fontWeight: 700, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={mapAllCats}
                    onChange={(e) => setMapAllCats(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--highlight-color)' }}
                  />
                  Show all place types on map
                </label>
              </div>
              <TravelMap
                places={mapPlaces}
                selectedId={selectedPlaceId}
                onSelectPlace={(p) => setSelectedPlaceId(p.id)}
                onBookPlace={(p) => bookItem(p, p.category || tab)}
                height={viewMode === 'map' ? 540 : 480}
                title={dest ? `${dest} Visual Map` : 'All Places Visual Map'}
              />
            </div>
          )}
        </div>
      )}

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
