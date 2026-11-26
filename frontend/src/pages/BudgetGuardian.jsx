import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { api } from '../api/client.js';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const COLORS = ['#fde047', '#38bdf8', '#a7f3d0', '#f97316', '#ec4899', '#c084fc'];
const CATS = ['Stay', 'Transport', 'Food', 'Activities', 'Shopping', 'Other'];
const POPULAR = ['Manali', 'Jaipur', 'Goa', 'Udaipur', 'Agra', 'Rishikesh', 'Kyoto', 'Paris'];

export default function BudgetGuardian() {
  const [params, setParams] = useSearchParams();
  const initialDest = params.get('dest') || '';

  const [destination, setDestination] = useState(initialDest);
  const [inputDest, setInputDest] = useState(initialDest);
  const [daysInput, setDaysInput] = useState(4);

  const [plan, setPlan] = useState(null);
  const [budget, setBudget] = useState(30000);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ category: 'Food', amount: '', note: '', day: 1 });

  useEffect(() => {
    if (!destination) {
      setPlan(null);
      return;
    }
    let live = true;
    setLoading(true);
    api.get(`/budget/plan?destination=${encodeURIComponent(destination)}&days=${daysInput}`)
      .then((res) => {
        if (!live) return;
        setPlan(res.data);
        setBudget(res.data.budget);
        setList(res.data.expenses || []);
      })
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [destination, daysInput]);

  const chooseDest = (place) => {
    const clean = place.trim();
    if (!clean) return;
    setDestination(clean);
    setInputDest(clean);
    setParams({ dest: clean });
  };

  const saveBudgetTarget = async (val) => {
    setBudget(val);
    if (destination && val > 0) {
      try {
        await api.post('/budget/plan', { destination, budget: val, days: daysInput });
      } catch {
        // ignore if not logged in
      }
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    const amount = Number(f.amount);
    if (!amount || amount <= 0 || !destination) return;
    try {
      const res = await api.post('/budget/expenses', {
        destination,
        category: f.category,
        amount,
        note: f.note || f.category,
        day: Number(f.day),
      });
      setList((prev) => [res.data.expense, ...prev]);
    } catch {
      setList((prev) => [{ id: Date.now(), category: f.category, amount, note: f.note || f.category, day: Number(f.day) }, ...prev]);
    }
    setF({ ...f, amount: '', note: '' });
  };

  const removeExpense = async (id) => {
    setList((prev) => prev.filter((x) => x.id !== id));
    try {
      await api.delete(`/budget/expenses/${id}`);
    } catch {
      // ignore
    }
  };

  if (!destination) {
    return (
      <div className="wrap page">
        <div className="head" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 32px' }}>
          <span className="eyebrow">Budget Guardian</span>
          <h1>Where are you travelling?</h1>
          <p className="lead" style={{ margin: '10px auto 0' }}>
            Tell us the place you’re visiting first so we can build a tailored budget plan and track expenses for that trip.
          </p>
        </div>

        <form
          className="card dest-picker"
          onSubmit={(e) => { e.preventDefault(); chooseDest(inputDest); }}
        >
          <div className="grid g2">
            <label className="field">Destination
              <input
                placeholder="e.g. Manali, Jaipur, Goa, Kyoto…"
                value={inputDest}
                onChange={(e) => setInputDest(e.target.value)}
                required
              />
            </label>
            <label className="field">Trip duration (days)
              <input
                type="number"
                min={1}
                max={30}
                value={daysInput}
                onChange={(e) => setDaysInput(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
          </div>

          <p className="eyebrow" style={{ marginBottom: 4 }}>Popular destinations</p>
          <div className="chips">
            {POPULAR.map((p) => (
              <button type="button" key={p} className="chip" onClick={() => chooseDest(p)}>{p}</button>
            ))}
          </div>

          <button className="btn" disabled={!inputDest.trim()}>Create budget plan</button>
        </form>
      </div>
    );
  }

  const spent = list.reduce((s, e) => s + Number(e.amount || 0), 0);
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const level = pct >= 90 ? 'var(--high)' : pct >= 75 ? 'var(--mod)' : 'var(--low)';

  const byCat = CATS.map((c) => ({
    name: c,
    value: list.filter((e) => e.category === c).reduce((s, e) => s + Number(e.amount || 0), 0),
  })).filter((c) => c.value > 0);

  const days = [...new Set(list.map((e) => e.day))].sort((a, b) => a - b);
  const byDay = days.map((d) => ({
    name: `Day ${d}`,
    spend: list.filter((e) => e.day === d).reduce((s, e) => s + Number(e.amount || 0), 0),
  }));

  return (
    <div className="wrap page">
      <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">Budget Guardian · {destination}</span>
          <h1>Spend with intention</h1>
        </div>
        <button className="btn ghost small" onClick={() => { setDestination(''); setParams({}); }}>
          <MapPin size={14} /> Change place
        </button>
      </div>

      {plan?.tip && (
        <div className="info-banner">
          <b>{destination} budget plan ({plan.days} days):</b> Recommended target {fmt(plan.recommended_budget)} · {plan.tip}
        </div>
      )}

      {pct >= 75 && (
        <div className="warn">
          You’ve used {Math.round(pct)}% of your {destination} budget
          {pct >= 90 ? ' — consider trimming the remaining days.' : '. Keep an eye on the next few days.'}
        </div>
      )}

      <div className="card bud" style={{ marginBottom: 20 }}>
        <div className="figs">
          <div className="fig"><small>Spent in {destination}</small><b>{fmt(spent)}</b></div>
          <div className="fig"><small>Remaining</small><b>{fmt(Math.max(budget - spent, 0))}</b></div>
          <div className="fig">
            <small>Budget target (editable)</small>
            <b>
              <input
                type="number"
                value={budget}
                onChange={(e) => saveBudgetTarget(+e.target.value || 0)}
                style={{ width: 140, font: 'inherit', border: 0, borderBottom: '1px solid var(--line)', background: 'none' }}
              />
            </b>
          </div>
        </div>
        <div className="meter" style={{ height: 12 }}>
          <motion.div animate={{ width: `${pct}%`, background: level }} transition={{ duration: 0.6 }} />
        </div>

        {plan?.suggested_split && (
          <div style={{ marginTop: 18 }}>
            <small className="eyebrow" style={{ display: 'block', marginBottom: 8 }}>Suggested allocation for {destination}</small>
            <div>
              {Object.entries(plan.suggested_split).map(([cat, amt]) => (
                <span key={cat} className="tag">{cat}: {fmt(amt)}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? <p className="lead">Loading {destination} budget…</p> : (
        <>
          <div className="grid g2">
            <div className="card">
              <h3>By category</h3>
              {byCat.length === 0 ? (
                <p className="lead" style={{ padding: '40px 0' }}>No expenses logged for {destination} yet. Add your first expense below.</p>
              ) : (
                <>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                          {byCat.map((c, i) => <Cell key={c.name} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#111', border: '2px solid #fde047', color: '#fff', borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    {byCat.map((c, i) => (
                      <span key={c.name} className="tag" style={{ background: COLORS[i % COLORS.length] }}>{c.name} · {fmt(c.value)}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="card">
              <h3>Daily spend</h3>
              {byDay.length === 0 ? (
                <p className="lead" style={{ padding: '40px 0' }}>Your daily breakdown will chart here as you add expenses.</p>
              ) : (
                <div style={{ height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={byDay}>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={55} />
                      <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: '#111', border: '2px solid #fde047', color: '#fff', borderRadius: 8 }} />
                      <Bar dataKey="spend" fill="#fde047" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="split sect" style={{ marginTop: 28 }}>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Expenses ({destination})</h3>
              {list.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>No expenses recorded yet for {destination}.</p>
              ) : (
                list.map((e) => (
                  <div key={e.id} className="bk" style={{ cursor: 'default', alignItems: 'center' }}>
                    <div><b>{e.note}</b><br /><small>{e.category} · Day {e.day}</small></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span>{fmt(e.amount)}</span>
                      <button type="button" className="link" onClick={() => removeExpense(e.id)} aria-label="Delete expense">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form className="card" onSubmit={addExpense}>
              <h3 style={{ marginBottom: 14 }}>Add expense for {destination}</h3>
              <label className="field">Category
                <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="field">Amount (₹)
                <input type="number" min="1" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
              </label>
              <label className="field">Note
                <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Hotel, lunch, cab…" />
              </label>
              <label className="field">Day
                <input type="number" min="1" value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })} />
              </label>
              <button className="btn">Add expense</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
