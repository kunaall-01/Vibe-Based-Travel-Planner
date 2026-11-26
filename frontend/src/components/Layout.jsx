import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Compass, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import CallModal from './realtime/CallModal.jsx';

const THEMES = [
  { cls: 'theme-blue', label: 'Cyber Blue' },
  { cls: 'theme-green', label: 'Terminal Green' },
  { cls: 'theme-sunset', label: 'Sunset.exe' },
  { cls: 'theme-purple', label: 'Violet Void' },
  { cls: 'theme-pink', label: 'Bubblegum Punk' },
  { cls: 'theme-cyan', label: 'Electric Cyan' },
  { cls: 'theme-high-contrast', label: 'High Contrast' },
  { cls: 'theme-mono', label: 'Monochrome' },
];

const NAV_LINKS = [
  ['/vibe', 'Vibes'],
  ['/search', 'Search'],
  ['/my-trips', 'My Trips'],
  ['/connect', 'Connect'],
  ['/register-local', 'Host Local'],
  ['/budget', 'Budget'],
  ['/plan-b', 'Plan B'],
  ['/local-pulse', 'Pulse'],
];

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [themePanel, setThemePanel] = useState(false);
  const [themeIndex, setThemeIndex] = useState(() => {
    const saved = Number.parseInt(localStorage.getItem('wayfarer-theme') || '0', 10);
    return Number.isFinite(saved) && saved >= 0 && saved < THEMES.length ? saved : 0;
  });

  const { user, logout } = useAuth();
  const { currency, changeCurrency, liveNotice } = useRealtime();
  const nav = useNavigate();

  const selectTheme = (idx) => {
    setThemeIndex(idx);
    localStorage.setItem('wayfarer-theme', String(idx));
    setThemePanel(false);
  };

  return (
    <div className={`website ${THEMES[themeIndex].cls}`}>
      <div className="page-shell">
        <div className="main-card">
          <header className="navbar">
            <Link to="/" className="logo-pill" onClick={() => setMenuOpen(false)}>
              <Compass size={18} />
              <span>Wayfarer</span>
            </Link>

            <nav className={`navitems ${menuOpen ? 'navitems-open' : ''}`} onClick={() => setMenuOpen(false)}>
              {NAV_LINKS.map(([to, label]) => (
                <NavLink key={to} to={to}>{label}</NavLink>
              ))}
              {user ? (
                <NavLink to="/profile" className="navuser">
                  <User size={14} /> {user.name.split(' ')[0]}
                </NavLink>
              ) : (
                <NavLink to="/login">Log in</NavLink>
              )}
            </nav>

            <div className="navbar-actions" style={{ position: 'relative' }}>
              <button
                type="button"
                className="theme-button settings-button"
                onClick={() => { setSettingsOpen((o) => !o); setThemePanel(false); }}
                aria-expanded={settingsOpen}
              >
                <span>SETTINGS</span>
                <span className="settings-menu-icon" aria-hidden="true">
                  <span /><span /><span />
                </span>
              </button>

              <button
                type="button"
                className={`menu-button ${menuOpen ? 'menu-button-open' : ''}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu"
              >
                <span className="menu-label">MENU</span>
                <span className="menu-icon" aria-hidden="true">
                  <span /><span /><span />
                </span>
              </button>

              {settingsOpen && (
                <div className="settings-panel" role="menu">
                  {!themePanel ? (
                    <>
                      <button type="button" className="settings-entry" onClick={() => setThemePanel(true)}>
                        <span>Theme ({THEMES[themeIndex].label})</span>
                        <span>→</span>
                      </button>

                      <div className="settings-divider" />

                      <div className="settings-entry-label">Currency</div>
                      {['INR', 'USD', 'EUR'].map((cur) => (
                        <button
                          key={cur}
                          type="button"
                          className={`settings-option ${currency === cur ? 'is-selected' : ''}`}
                          onClick={() => changeCurrency(cur)}
                        >
                          <span>{cur === 'INR' ? 'INR ₹' : cur === 'USD' ? 'USD $' : 'EUR €'}</span>
                          {currency === cur && <span>✓</span>}
                        </button>
                      ))}

                      <div className="settings-divider" />

                      {user ? (
                        <>
                          <button
                            type="button"
                            className="settings-entry"
                            onClick={() => { setSettingsOpen(false); nav('/profile'); }}
                          >
                            <span>Edit Profile</span>
                            <span>→</span>
                          </button>
                          <button
                            type="button"
                            className="settings-entry settings-reset"
                            onClick={() => { setSettingsOpen(false); logout(); nav('/'); }}
                          >
                            <span>Log out</span>
                            <span>⏻</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="settings-entry"
                          onClick={() => { setSettingsOpen(false); nav('/login'); }}
                        >
                          <span>Log in / Sign up</span>
                          <span>→</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button type="button" className="settings-entry" onClick={() => setThemePanel(false)} style={{ justifyContent: 'flex-start', gap: 8 }}>
                        <span>← Back to Settings</span>
                      </button>
                      <div className="settings-divider" />
                      {THEMES.map((t, i) => (
                        <button
                          type="button"
                          key={t.cls}
                          className={`settings-option ${themeIndex === i ? 'is-selected' : ''}`}
                          onClick={() => selectTheme(i)}
                        >
                          <span>{t.label}</span>
                          {themeIndex === i && <span>✓</span>}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </header>

          <main className="main-stage">{children}</main>

          <footer className="footer">
            <span>WAYFARER · PLAN SLOWLY · DIRECT YOUR TRIP MOVIE · REAL-TIME TRAVEL COMMUNITY</span>
          </footer>
        </div>
      </div>

      <CallModal />

      <AnimatePresence>
        {liveNotice && (
          <motion.div className="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {liveNotice}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
