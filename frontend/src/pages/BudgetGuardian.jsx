import { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { expenses as seed } from '../data/mock.js';
import { useApi, post } from '../api/client.js';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
const COLORS = ['#233a38', '#a8743c', '#5f8a6a', '#c29a3b', '#b5573f', '#7a8f9c'];
const CATS = ['Stay', 'Transport', 'Food', 'Activities', 'Shopping', 'Other'];

export default function BudgetGuardian() {
  const initial = useApi('/budget/expenses', seed);
  const [added, setAdded] = useState([]);
  const [budget, setBudget] = useState(60000);
  const [f, setF] = useState({ category: 'Food', amount: '', note: '', day: 1 });
  const list = [...initial, ...added];
  const spent = list.reduce((s, e) => s + e.amount, 0);
  const pct = Math.min((spent / budget) * 100, 100);
  const level = pct >= 90 ? 'var(--high)' : pct >= 75 ? 'var(--mod)' : 'var(--low)';

  const byCat = CATS.map((c) => ({ name: c, value: list.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0) })).filter((c) => c.value > 0);
  const days = [...new Set(list.map((e) => e.day))].sort((a, b) => a - b);
  const byDay = days.map((d) => ({ name: `Day ${d}`, spend: list.filter((e) => e.day === d).reduce((s, e) => s + e.amount, 0) }));

  const add = (e) => {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!amount || amount <= 0) return;
    const exp = { id: Date.now(), category: f.category, amount, note: f.note || f.category, day: Number(f.day) };
    setAdded((a) => [...a, exp]);
    post('/budget/expenses', exp, null);
    setF({ ...f, amount: '', note: '' });
  };

  return (
    <div className="wrap page">
      <div className="head"><span className="eyebrow">Budget Guardian</span><h1>Spend with intention</h1></div>
      {pct >= 75 && <div className="warn">You’ve used {Math.round(pct)}% of your budget{pct >= 90 ? ' — consider trimming the remaining days.' : '. Keep an eye on the next few days.'}</div>}
      <div className="card bud" style={{ marginBottom: 20 }}>
        <div className="figs">
          <div className="fig"><small>Spent</small><b>{fmt(spent)}</b></div>
          <div className="fig"><small>Remaining</small><b>{fmt(Math.max(budget - spent, 0))}</b></div>
          <div className="fig"><small>Budget</small><b><input type="number" value={budget} onChange={(e) => setBudget(+e.target.value || 0)} style={{ width: 130, font: 'inherit', border: 0, borderBottom: '1px solid var(--line)', background: 'none' }} /></b></div>
        </div>
        <div className="meter" style={{ height: 12 }}><motion.div animate={{ width: `${pct}%`, background: level }} transition={{ duration: 0.8 }} /></div>
      </div>
      <div className="grid g2">
        <div className="card"><h3>By category</h3>
          <div style={{ height: 260 }}><ResponsiveContainer><PieChart>
            <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3} animationDuration={900}>{byCat.map((c, i) => <Cell key={c.name} fill={COLORS[i % COLORS.length]} />)}</Pie>
            <Tooltip formatter={(v) => fmt(v)} /></PieChart></ResponsiveContainer></div>
          <div>{byCat.map((c, i) => <span key={c.name} className="tag" style={{ borderColor: COLORS[i % COLORS.length] }}>{c.name} · {fmt(c.value)}</span>)}</div>
        </div>
        <div className="card"><h3>Daily spend</h3>
          <div style={{ height: 260 }}><ResponsiveContainer><BarChart data={byDay}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} width={50} />
            <Tooltip formatter={(v) => fmt(v)} /><Bar dataKey="spend" fill="#a8743c" radius={[6, 6, 0, 0]} animationDuration={900} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
      <div className="split sect" style={{ marginTop: 28 }}>
        <div className="card"><h3 style={{ marginBottom: 12 }}>Expenses</h3>
          {list.slice().reverse().map((e) => <div key={e.id} className="bk" style={{ cursor: 'default' }}><div><b>{e.note}</b><br /><small>{e.category} · Day {e.day}</small></div><span>{fmt(e.amount)}</span></div>)}
        </div>
        <form className="card" onSubmit={add}>
          <h3 style={{ marginBottom: 14 }}>Add expense</h3>
          <label className="field">Category<select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field">Amount (₹)<input type="number" min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></label>
          <label className="field">Note<input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
          <label className="field">Day<input type="number" min="1" value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} /></label>
          <button className="btn">Add</button>
        </form>
      </div>
    </div>
  );
}
