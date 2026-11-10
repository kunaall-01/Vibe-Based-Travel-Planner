
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Compass,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  CloudRain,
  Eye,
  X
} from "lucide-react";
import "./App.css";

const destinations = [
  {
    name: "Manali",
    country: "Himachal Pradesh, India",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900",
    tag: "Mountain escape",
    size: "large"
  },
  {
    name: "Udaipur",
    country: "Rajasthan, India",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=800",
    tag: "Culture & heritage",
    size: "small"
  },
  {
    name: "Goa",
    country: "India",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800",
    tag: "Coastal living",
    size: "small"
  }
];

const vibes = [
  {
    name: "Peaceful",
    description: "Slow mornings and quiet escapes",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=700"
  },
  {
    name: "Adventurous",
    description: "Find your next adrenaline rush",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=700"
  },
  {
    name: "Party",
    description: "Make nights worth remembering",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700"
  },
  {
    name: "Foodie",
    description: "Explore a place through its food",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700"
  }
];

function App() {
  const [selectedVibe, setSelectedVibe] = useState("Adventurous");
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("15000");
  const [travelDate, setTravelDate] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  const planTrip = (event) => {
    event.preventDefault();

    if (!destination.trim()) {
      setMessage("Please enter your destination first.");
      return;
    }

    setMessage(
      `Your ${selectedVibe.toLowerCase()} trip to ${destination} is ready to be planned!`
    );
  };

  return (
    <div className="website">

      {/* NAVIGATION */}
      <nav className="navbar">
        <a href="#home" className="brand">
          <span className="brand-icon"><Compass size={23} /></span>
          <span>roam<span className="brand-dot">.</span></span>
        </a>

        <div className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <a href="#destinations" onClick={() => setMenuOpen(false)}>Destinations</a>
          <a href="#vibes" onClick={() => setMenuOpen(false)}>Explore by vibe</a>
          <a href="#experiences" onClick={() => setMenuOpen(false)}>Experiences</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Our features</a>
        </div>

        <div className="nav-actions">
          <a href="#planner" className="nav-plan">Plan a trip <ArrowUpRight size={16} /></a>
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-image"></div>
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="eyebrow hero-eyebrow">
            <span></span> TRAVEL, YOUR WAY
          </div>

          <h1>
            Some journeys<br />
            just <em>feel right.</em>
          </h1>

          <p>
            Discover places that match your mood, plan journeys
            around your interests, and make every trip your own.
          </p>

          <div className="hero-buttons">
            <a href="#planner" className="button-light">
              Start exploring <ArrowRight size={18} />
            </a>
            <a href="#destinations" className="button-outline">
              Discover destinations
            </a>
          </div>
        </div>

        <div className="hero-bottom">
          <span>01 — FIND YOUR NEXT ESCAPE</span>
          <span>MADE FOR THE WAY YOU TRAVEL</span>
        </div>

        <div className="hero-location">
          <MapPin size={15} /> The mountains are calling
        </div>
      </section>

      {/* INTRO */}
      <section className="intro section-wrap">
        <div className="eyebrow"><span></span> NOT JUST ANOTHER TRIP PLANNER</div>
        <div className="intro-grid">
          <h2>Travel should feel like <em>you.</em></h2>
          <p>
            Whether you're chasing mountain trails, quiet lakeside mornings,
            new flavours or unforgettable nights, we bring the right journey
            together around what you love.
          </p>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section className="destinations section-wrap" id="destinations">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span></span> PLACES TO GET LOST IN</div>
            <h2>Somewhere <em>beautiful.</em></h2>
          </div>
          <a href="#planner" className="text-link">Explore all destinations <ArrowUpRight size={17} /></a>
        </div>

        <div className="destination-grid">
          {destinations.map((place) => (
            <article className={`destination-card ${place.size}`} key={place.name}>
              <img src={place.image} alt={place.name} />
              <div className="destination-shade"></div>
              <span className="destination-tag">{place.tag}</span>
              <div className="destination-info">
                <span>{place.country}</span>
                <h3>{place.name}</h3>
              </div>
              <a href="#planner" className="destination-arrow" aria-label={`Plan a trip to ${place.name}`}>
                <ArrowUpRight size={22} />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* VIBES */}
      <section className="vibes-section" id="vibes">
        <div className="section-wrap">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span></span> WHAT ARE YOU IN THE MOOD FOR?</div>
              <h2>Pick your <em>vibe.</em></h2>
            </div>
            <p className="heading-description">
              No fixed itineraries. No one-size-fits-all plans.
              Just travel that matches your mood.
            </p>
          </div>

          <div className="vibe-grid">
            {vibes.map((vibe, index) => (
              <button
                className={`vibe-card ${selectedVibe === vibe.name ? "vibe-selected" : ""}`}
                key={vibe.name}
                onClick={() => {
                  setSelectedVibe(vibe.name);
                  document.getElementById("planner").scrollIntoView({ behavior: "smooth" });
                }}
              >
                <img src={vibe.image} alt={vibe.name} />
                <span className="vibe-number">0{index + 1}</span>
                <div className="vibe-info">
                  <h3>{vibe.name}</h3>
                  <p>{vibe.description}</p>
                </div>
                <span className="vibe-arrow"><ArrowUpRight size={20} /></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TRIP PLANNER */}
      <section className="planner-section section-wrap" id="planner">
        <div className="planner-image">
          <img
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1100"
            alt="Mountain landscape"
          />
          <div className="planner-image-caption">
            <span>YOUR NEXT CHAPTER</span>
            <p>Go where you feel most alive.</p>
          </div>
        </div>

        <div className="planner-content">
          <div className="eyebrow"><span></span> LET'S MAKE IT HAPPEN</div>
          <h2>Your next trip<br />starts <em>here.</em></h2>
          <p className="planner-description">
            Tell us a little about your plans. We'll help you put
            together a journey worth remembering.
          </p>

          <form className="planner-form" onSubmit={planTrip}>
            <label>
              WHERE DO YOU WANT TO GO?
              <div className="input-wrap">
                <MapPin size={18} />
                <input
                  type="text"
                  placeholder="Try Manali, Goa, Udaipur..."
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </label>

            <div className="form-row">
              <label>
                TRAVEL DATE
                <div className="input-wrap">
                  <CalendarDays size={18} />
                  <input
                    type="date"
                    value={travelDate}
                    onChange={(e) => setTravelDate(e.target.value)}
                  />
                </div>
              </label>

              <label>
                YOUR BUDGET (₹)
                <div className="input-wrap">
                  <Wallet size={18} />
                  <input
                    type="number"
                    min="1"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </label>
            </div>

            <label>
              YOUR SELECTED VIBE
              <div className="selected-vibe">{selectedVibe}</div>
            </label>

            <button className="button-dark" type="submit">
              Build my trip <ArrowRight size={18} />
            </button>

            {message && <p className="form-message">{message}</p>}
          </form>
        </div>
      </section>

      {/* EXPERIENCES */}
      <section className="experiences-section section-wrap" id="experiences">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span></span> MORE THAN A DESTINATION</div>
            <h2>Make room for <em>experiences.</em></h2>
          </div>
          <p className="heading-description">
            Find stays, local food, activities and ways to explore
            without juggling a dozen different websites.
          </p>
        </div>

        <div className="experience-grid">
          <div className="experience-card">
            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800" alt="Hotel stay" />
            <div><span>01 / STAYS</span><h3>Stay somewhere special.</h3></div>
          </div>
          <div className="experience-card">
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800" alt="Local food" />
            <div><span>02 / FOOD</span><h3>Taste the local culture.</h3></div>
          </div>
          <div className="experience-card">
            <img src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800" alt="Nature adventure" />
            <div><span>03 / ACTIVITIES</span><h3>Do something different.</h3></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-wrap">
          <div className="eyebrow"><span></span> THOUGHTFUL TRAVEL TOOLS</div>
          <h2>A little smarter.<br /><em>A lot more enjoyable.</em></h2>

          <div className="features-grid">
            <article className="feature-item">
              <div className="feature-icon"><Wallet /></div>
              <span>01 — STAY ON TRACK</span>
              <h3>Smart Budget Guardian</h3>
              <p>Keep an eye on your trip expenses, see what's left and discover ways to save without missing out.</p>
              <a href="#planner">Plan within budget <ArrowUpRight size={16} /></a>
            </article>

            <article className="feature-item">
              <div className="feature-icon"><CloudRain /></div>
              <span>02 — ALWAYS HAVE A PLAN</span>
              <h3>Plan B</h3>
              <p>Rain, delays or unexpected closures? Find alternative experiences and keep your journey moving.</p>
              <a href="#planner">Explore smarter planning <ArrowUpRight size={16} /></a>
            </article>

            <article className="feature-item">
              <div className="feature-icon"><Eye /></div>
              <span>03 — FIND THE QUIETER SIDE</span>
              <h3>Local Pulse</h3>
              <p>See estimated crowd levels and quieter visiting times to enjoy destinations at your own pace.</p>
              <a href="#destinations">Find quieter moments <ArrowUpRight size={16} /></a>
            </article>
          </div>
        </div>
      </section>

      {/* TRAVEL CONNECT */}
      <section className="connect-section section-wrap">
        <div className="connect-copy">
          <div className="eyebrow"><span></span> GOOD JOURNEYS ARE BETTER SHARED</div>
          <h2>Meet people.<br /><em>Make memories.</em></h2>
          <p>
            Find fellow travellers, connect with locals and discover
            activities with people who share your interests.
          </p>
          <a href="#planner" className="button-dark">Discover Travel Connect <ArrowRight size={18} /></a>
        </div>
        <div className="connect-image">
          <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000" alt="Friends travelling together" />
          <div className="connect-note"><Users size={19} /> Better together</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div>
            <a href="#home" className="brand footer-brand">
              <span className="brand-icon"><Compass size={23} /></span>
              <span>roam<span className="brand-dot">.</span></span>
            </a>
            <p>Thoughtful trips. Personal journeys.<br />A world waiting to be explored.</p>
          </div>

          <div className="footer-links">
            <div><span>EXPLORE</span><a href="#destinations">Destinations</a><a href="#vibes">Vibes</a><a href="#experiences">Experiences</a></div>
            <div><span>PLAN</span><a href="#planner">Plan a trip</a><a href="#features">Smart tools</a><a href="#features">Travel Connect</a></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Roam. A travel planning project.</span>
          <span>Made for journeys that feel like you.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;

