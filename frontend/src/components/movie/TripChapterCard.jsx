import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function TripChapterCard({ chapter, isOpen, onToggle, accentColor = '#a8743c' }) {
  return (
    <article className={`chapter-card ${isOpen ? 'open' : ''}`} style={{ '--chapter-accent': accentColor }}>
      <button type="button" className="chapter-header" onClick={onToggle}>
        <div className="chapter-num">
          <span>{chapter.chapter_number || `CHAPTER ${String(chapter.day).padStart(2, '0')}`}</span>
          <b>{chapter.full_chapter_title}</b>
        </div>
        <div className="chapter-right">
          <small>{chapter.subtitle}</small>
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="chapter-body">
              <p className="chapter-narrative">“{chapter.narrative}”</p>
              <div className="chapter-scenes">
                {(chapter.items || []).map((item, idx) => (
                  <div className="slot" key={`${item.time}-${idx}`}>
                    <b>{item.time}</b>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
