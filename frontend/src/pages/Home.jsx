import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, Wallet, Video, Film, ArrowRight, ShieldCheck } from 'lucide-react';
import { destinations as fallbackDestinations } from '../data/mock.js';
import { useApi } from '../api/client.js';
import Photo from '../components/Photo.jsx';
import Ticker from '../components/Ticker.jsx';
import TravelMap from '../components/TravelMap.jsx';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

export default function Home() {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const destinations = useApi('/destinations', fallbackDestinations);
  const list = q.trim()
    ? destinations.filter((d) => (d.name + ' ' + d.region).toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <>
      <section className="hero-pop wenoselect">
        <motion.div
          className="hero-pop-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="hero-pop-left">
            <motion.div className="sticker-row" variants={itemVariants}>
              <span className="sticker-badge yellow">WAYFARER TRAVEL 2026</span>
              <span className="sticker-badge green">TRIP AS A MOVIE</span>
            </motion.div>

            <motion.h1
              className="hero-pop-title"
              variants={itemVariants}
              animate={{ rotate: [-2, 0, -2], scale: [1, 1.01, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              Wayfarer
            </motion.h1>

            <motion.div className="hero-pop-copy" variants={itemVariants}>
              <p className="hero-lead-bold">
                Pick Your Vibe. Direct Your Trip Movie. Connect Live With Locals.
              </p>
              <p>
                Compare stays, flights, trains &amp; rentals, verify bookings in real time through our Payment Gateway,
                drop live clips on the Video Wall, and jump into real-time chat or video calls.
              </p>

              <div className="searchbox hero-searchbox">
                <input
                  className="figma-input"
                  placeholder="Where to next? (Manali, Jaipur, Goa, Kyoto…)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && q.trim()) {
                      nav(`/search?dest=${encodeURIComponent(list[0]?.name || q.trim())}`);
                    }
                  }}
                />
                {list.length > 0 && (
                  <motion.div className="suggest" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    {list.map((d) => (
                      <button key={d.id} onClick={() => nav(`/search?dest=${encodeURIComponent(d.name)}`)}>
                        <Photo src={d.img} className="thumb" />
                        <span><b>{d.name}</b><small>{d.region}</small></span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="hero-cta-row">
                <motion.button
                  type="button"
                  className="bigbutton"
                  onClick={() => nav('/vibe')}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.96, y: 0 }}
                >
                  <Sparkles size={16} /> Get Started ➜
                </motion.button>

                <Link to="/itinerary?vibes=mountain" className="figma-button alt">
                  <Film size={16} /> Preview Trip Movie
                </Link>

                <Link to="/register-local" className="figma-button ghost-pop">
                  <ShieldCheck size={16} /> Host as Local
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="hero-pop-art"
            variants={itemVariants}
            animate={{ y: [0, -10, 0], rotate: [-1.5, 1.5, -1.5] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="hero-poster-frame">
              <div className="hero-poster-top">
                <span>NOW DIRECTING</span>
                <span>★ 4.9</span>
              </div>
              <img
                src={destinations[2]?.img || fallbackDestinations[2].img}
                alt="Mountain Air Manali"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="hero-poster-caption">
                <small>COMING-OF-AGE ALPINE DRAMA</small>
                <h3>Three Days Above the Timberline</h3>
                <p>Manali · Mountain Air · 4 Days</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <Ticker />

      <section className="about-pop">
        <div className="about-pop-header">
          <div>
            <h2>Explore Features</h2>
            <p>
              Every tool you need to discover places, verify payments, adapt when weather shifts, and meet real locals along the way.
            </p>
          </div>
          <Link to="/connect" className="bigbutton">
            Open Live Community ➜
          </Link>
        </div>

        <div className="grid g3">
          {[
            [Search, 'Compare & Pay Live', 'Compare stays, flights, trains, buses & rentals with real-time Luhn/UPI/OTP Payment Gateway verification.', '/search'],
            [Video, 'Real-Time Connect', 'Share reels on the live Video Wall, send Local Host requests, chat live & start WebRTC audio/video calls.', '/connect'],
            [Wallet, 'Smart Guardians', 'Destination-first Budget Guardian, Plan B weather backups, Local Pulse crowd heatmaps & packing checklists.', '/budget'],
          ].map(([Icon, title, desc, to], idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <Link to={to} className="pop-feature-card">
                <div className="pop-icon-box"><Icon size={22} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="pop-card-cta">Open feature <ArrowRight size={14} /></span>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="home-movie-spotlight"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          <div>
            <span className="sticker-badge yellow" style={{ marginBottom: 12 }}>SIGNATURE USP FEATURE</span>
            <h2>Your Trip as a Movie</h2>
            <p>
              Every generated itinerary transforms into a personal cinema release — complete with an original movie title,
              curated colour grading, soundtrack mood, chapter-by-chapter story arc, downloadable 4:5 &amp; 9:16 PNG posters,
              and post-trip Memory Cards.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
              <Link to="/vibe" className="bigbutton">
                Direct Your Trip <ArrowRight size={16} />
              </Link>
              <Link to="/register-local" className="figma-button alt">
                <ShieldCheck size={15} /> Register as Local Community
              </Link>
            </div>
          </div>

          <div className="spotlight-mini-poster">
            <small>A WAYFARER ORIGINAL</small>
            <h3>Letters from Manali</h3>
            <p>“In the hush of cedar valleys, even silence learns how to speak.”</p>
            <div className="spotlight-swatches">
              <span style={{ background: '#6E8EA1' }} />
              <span style={{ background: '#F4EFE6' }} />
              <span style={{ background: '#3B594B' }} />
              <span style={{ background: '#fde047' }} />
            </div>
          </div>
        </motion.div>

        <div style={{ marginTop: 8 }}>
          <div className="about-pop-header" style={{ marginBottom: 16 }}>
            <div>
              <span className="eyebrow">Interactive World Atlas</span>
              <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', marginTop: 8 }}>Explore Places on the Map</h2>
            </div>
            <Link to="/search" className="figma-button">
              Open Full Place Map <ArrowRight size={14} />
            </Link>
          </div>
          <TravelMap
            places={destinations.map((d) => ({ ...d, category: 'Destinations', meta: d.region }))}
            onSelectPlace={(p) => nav(`/search?dest=${encodeURIComponent(p.name)}`)}
            height={360}
            title="Wayfarer Destination Atlas"
            legendItems={[['Destinations', '#fde047']]}
          />
        </div>
      </section>

      <Ticker />
    </>
  );
}
