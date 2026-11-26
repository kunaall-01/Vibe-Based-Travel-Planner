import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import VibeSelector from './pages/VibeSelector.jsx';
import Itinerary from './pages/Itinerary.jsx';
import Search from './pages/Search.jsx';
import Booking from './pages/Booking.jsx';
import PaymentGateway from './pages/PaymentGateway.jsx';
import MyTrips from './pages/MyTrips.jsx';
import TravelConnect from './pages/TravelConnect.jsx';
import RegisterLocal from './pages/RegisterLocal.jsx';
import BudgetGuardian from './pages/BudgetGuardian.jsx';
import PlanB from './pages/PlanB.jsx';
import LocalPulse from './pages/LocalPulse.jsx';
import MovieStory from './pages/MovieStory.jsx';

function Protected({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return null;
  return user ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}

export default function App() {
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [loc.pathname]);
  const p = (el) => <Protected>{el}</Protected>;
  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div key={loc.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
          <Routes location={loc}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/vibe" element={<VibeSelector />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/movie/:slug" element={<MovieStory />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={p(<Profile />)} />
            <Route path="/booking" element={p(<Booking />)} />
            <Route path="/payment-gateway" element={p(<PaymentGateway />)} />
            <Route path="/my-trips" element={p(<MyTrips />)} />
            <Route path="/connect" element={p(<TravelConnect />)} />
            <Route path="/register-local" element={p(<RegisterLocal />)} />
            <Route path="/budget" element={p(<BudgetGuardian />)} />
            <Route path="/plan-b" element={<PlanB />} />
            <Route path="/local-pulse" element={<LocalPulse />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
