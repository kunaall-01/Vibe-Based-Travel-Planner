import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Share2, Sparkles, Edit3, ArrowLeft, Play } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import CinematicTripCover from '../components/movie/CinematicTripCover.jsx';
import MovieIdentitySection from '../components/movie/MovieIdentitySection.jsx';
import StoryArcTimeline from '../components/movie/StoryArcTimeline.jsx';
import ShareTripModal from '../components/movie/ShareTripModal.jsx';
import TripRevealAnimation from '../components/movie/TripRevealAnimation.jsx';
import MemoryCardPreview from '../components/movie/MemoryCardPreview.jsx';
import MemoryCardEditor from '../components/movie/MemoryCardEditor.jsx';
import { AnimatePresence } from 'framer-motion';

export default function MovieStory() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [trailer, setTrailer] = useState(false);
  const [editMovie, setEditMovie] = useState(false);
  const [editMemory, setEditMemory] = useState(false);
  const [draft, setDraft] = useState({ movie_title: '', tagline: '', synopsis: '', cover_image: '' });
  const [saving, setSaving] = useState(false);

  const loadMovie = () => {
    setLoading(true);
    const isNum = /^\d+$/.test(slug);
    const endpoint = isNum ? `/movies/${slug}` : `/movies/share/${slug}`;
    api.get(endpoint)
      .then((res) => {
        setPayload(res.data);
        if (res.data?.movie) {
          setDraft({
            movie_title: res.data.movie.movie_title,
            tagline: res.data.movie.tagline,
            synopsis: res.data.movie.synopsis,
            cover_image: res.data.movie.cover_image,
          });
        }
      })
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMovie();
  }, [slug]);

  if (loading) {
    return <div className="wrap page"><p className="lead">Loading your movie story…</p></div>;
  }

  if (!payload || !payload.movie) {
    return (
      <div className="wrap page" style={{ maxWidth: 640, textAlign: 'center' }}>
        <h1>Movie story not found</h1>
        <p className="lead" style={{ margin: '12px auto 24px' }}>This trip story may have been removed or the link is incomplete.</p>
        <Link to="/vibe" className="btn"><Sparkles size={16} /> Create your own trip movie</Link>
      </div>
    );
  }

  const { movie, trip, memory } = payload;
  const isOwner = user && movie.user_id === user.user_id;

  const saveEdits = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/movies/${movie.itinerary_id}`, draft);
      setPayload((prev) => ({ ...prev, movie: res.data.movie }));
      setEditMovie(false);
    } finally {
      setSaving(false);
    }
  };

  const tripForMemory = trip ? {
    id: trip.itinerary_id,
    title: trip.title,
    destination: trip.destination,
    dates: `${trip.start_date} – ${trip.end_date}`,
    img: movie.cover_image,
    movie,
    memory,
    activities: (movie.story_arc || []).flatMap((c) => (c.items || []).map((i) => i.text)),
  } : null;

  return (
    <div className="wrap page" style={{ maxWidth: 980 }}>
      <AnimatePresence>
        {trailer && <TripRevealAnimation movie={movie} onEnter={() => setTrailer(false)} />}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <Link to="/my-trips" className="link"><ArrowLeft size={15} /> Back to My Trips</Link>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn ghost small" onClick={() => setTrailer(true)}>
            <Play size={13} /> Watch Trailer
          </button>
          {isOwner && (
            <button type="button" className="btn ghost small" onClick={() => setEditMovie(!editMovie)}>
              <Edit3 size={14} /> Customize Film
            </button>
          )}
          <button type="button" className="btn small" onClick={() => setShareOpen(true)}>
            <Share2 size={14} /> Share / Download PNG
          </button>
        </div>
      </div>

      {editMovie && isOwner && (
        <form className="card" style={{ marginBottom: 22 }} onSubmit={saveEdits}>
          <h3 style={{ marginBottom: 14 }}>Customize Movie Identity</h3>
          <div className="grid g2">
            <label className="field">Movie Title
              <input value={draft.movie_title} onChange={(e) => setDraft({ ...draft, movie_title: e.target.value })} required />
            </label>
            <label className="field">Cover Image URL
              <input value={draft.cover_image} onChange={(e) => setDraft({ ...draft, cover_image: e.target.value })} />
            </label>
          </div>
          <label className="field">Tagline
            <input value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} required />
          </label>
          <label className="field">Synopsis
            <textarea rows={2} value={draft.synopsis} onChange={(e) => setDraft({ ...draft, synopsis: e.target.value })} required />
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn small" disabled={saving}>{saving ? 'Saving…' : 'Save film edits'}</button>
            <button type="button" className="btn ghost small" onClick={() => setEditMovie(false)}>Cancel</button>
          </div>
        </form>
      )}

      <CinematicTripCover movie={movie} />

      <MovieIdentitySection movie={movie} />

      <StoryArcTimeline storyArc={movie.story_arc} palette={movie.color_palette} />

      {(memory || (isOwner && trip?.status === 'Completed')) && (
        <section className="sect">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div>
              <span className="eyebrow">After The Credits</span>
              <h2 style={{ marginTop: 6 }}>Memory Card</h2>
            </div>
            {isOwner && (
              <button type="button" className="btn small" onClick={() => setEditMemory(true)}>
                <Edit3 size={14} /> {memory ? 'Edit Memory Card' : 'Create Memory Card'}
              </button>
            )}
          </div>
          {memory ? (
            <MemoryCardPreview movie={movie} memory={memory} trip={tripForMemory} onShare={() => setShareOpen(true)} />
          ) : (
            <div className="empty-box">
              <p>Turn this completed trip into a downloadable Memory Card with your favourite photos and moments.</p>
              <button type="button" className="btn small" onClick={() => setEditMemory(true)}>Create Memory Card</button>
            </div>
          )}
        </section>
      )}

      <ShareTripModal open={shareOpen} onClose={() => setShareOpen(false)} movie={movie} shareSlug={movie.share_slug} />

      {editMemory && tripForMemory && (
        <MemoryCardEditor
          open={editMemory}
          onClose={() => setEditMemory(false)}
          trip={tripForMemory}
          onSaved={(savedMem) => setPayload((prev) => ({ ...prev, memory: savedMem }))}
        />
      )}
    </div>
  );
}
