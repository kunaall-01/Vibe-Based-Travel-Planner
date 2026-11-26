import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Compass, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  ['/vibe', 'Vibes'], ['/search', 'Search'], ['/my-trips', 'My Trips'],
  ['/connect', 'Connect'], ['/budget', 'Budget'], ['/plan-b', 'Plan B'], ['/local-pulse', 'Local Pulse'],
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand"><Compass size={20} /> Wayfarer</Link>
        <nav className={open ? 'links open' : 'links'} onClick={() => setOpen(false)}>
          {links.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
          {user ? (
            <>
              <NavLink to="/profile" className="navuser"><User size={15} /> {user.name}</NavLink>
              <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); nav('/'); }}>Log out</a>
            </>
          ) : <NavLink to="/login" className="btn small">Log in</NavLink>}
        </nav>
        <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </header>
      <main>{children}</main>
      <footer className="footer">Wayfarer · Plan slowly, travel well.</footer>
    </>
  );
}
