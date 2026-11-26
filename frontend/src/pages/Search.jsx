import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { searchData } from '../data/mock.js';
import { useApi } from '../api/client.js';

const fmt = (n) => '₹' + n.toLocaleString('en-IN');

export default function Search() {
  const [params] = useSearchParams();
  const dest = params.get('dest') || 'Jaipur';
  const nav = useNavigate();
  const all = useApi('/search', searchData);
  const [tab, setTab] = useState('Hotels');
  const [minRating, setMin] = useState(0);
  const [maxPrice, setMax] = useState(null);
  const [sort, setSort] = useState('rating');
  const [cmp, setCmp] = useState([]);

  const items = all[tab];
  const top = Math.max(...items.map((i) => i.price));
  const limit = maxPrice ?? top;
  const shown = items
    .filter((i) => i.price <= limit && i.rating >= minRating)
    .sort((a, b) => (sort === 'price' ? a.price - b.price : sort === 'priceDesc' ? b.price - a.price : b.rating - a.rating));
  const picked = items.filter((i) => cmp.includes(i.id));
  const changeTab = (t) => { setTab(t); setMax(null); setCmp([]); };
  const toggle = (id) => setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));

  return (
    <div className="wrap page">
      <div className="head"><span className="eyebrow">Search · {dest}</span><h1>Find and compare</h1></div>
      <div className="tabs">{Object.keys(all).map((t) => <button key={t} className={t === tab ? 'tab on' : 'tab'} onClick={() => changeTab(t)}>{t}</button>)}</div>
      <div className="card filters">
        <label>Max price: {fmt(limit)}<input type="range" min={0} max={top} step={50} value={limit} onChange={(e) => setMax(+e.target.value)} /></label>
        <label>Min rating: {minRating || 'Any'}<input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMin(+e.target.value)} /></label>
        <label>Sort by<select value={sort} onChange={(e) => setSort(e.target.value)}><option value="rating">Top rated</option><option value="price">Price: low to high</option><option value="priceDesc">Price: high to low</option></select></label>
      </div>
      <AnimatePresence mode="popLayout">
        {shown.map((i) => (
          <motion.div layout key={i.id} className="card res" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
            <div><h3>{i.name}</h3><small>{i.meta}</small><div style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center', fontSize: '.85rem' }}><Star size={14} color="#a8743c" fill="#a8743c" /> {i.rating}</div></div>
            <div style={{ textAlign: 'right' }}>
              <div className="price">{fmt(i.price)}</div>
              <label className="cmp"><input type="checkbox" checked={cmp.includes(i.id)} onChange={() => toggle(i.id)} /> Compare</label>
              <button className="btn small" style={{ marginTop: 8 }} onClick={() => nav('/booking', { state: { item: i, type: tab, dest } })}>Book</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {!shown.length && <p className="lead">No results match these filters.</p>}
      <AnimatePresence>
        {picked.length > 1 && (
          <motion.div className="cmpbar" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}>
            <b>Comparing {picked.length} options</b>
            <table>
              <thead><tr><th></th>{picked.map((p) => <th key={p.id}>{p.name}</th>)}</tr></thead>
              <tbody>
                <tr><td>Price</td>{picked.map((p) => <td key={p.id}>{fmt(p.price)}</td>)}</tr>
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
