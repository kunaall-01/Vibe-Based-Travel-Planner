import { useEffect, useRef } from 'react';

const WORDS = [
  'Wayfarer',
  'Trip Movies',
  'Manali',
  'Jaipur',
  'Goa',
  'Live Video Wall',
  'Local Hosts',
  'WebRTC Calls',
  'Plan B',
  'Budget Guardian',
];

export default function Ticker() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let position = 0;
    let lastTime = performance.now();
    let animationFrame;
    const speed = 58;

    const createSequence = () => {
      WORDS.forEach((word) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'ticker-word';
        wordSpan.textContent = word;

        const starSpan = document.createElement('span');
        starSpan.className = 'ticker-star';
        starSpan.textContent = '★';

        track.appendChild(wordSpan);
        track.appendChild(starSpan);
      });
    };

    track.innerHTML = '';
    const tickerWidth = track.parentElement?.offsetWidth ?? 900;
    while (track.scrollWidth < Math.max(tickerWidth, 600) * 2.5) {
      createSequence();
    }

    const animate = (time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      position -= speed * delta;

      const firstItem = track.firstElementChild;
      if (firstItem && -position >= firstItem.offsetWidth) {
        position += firstItem.offsetWidth;
        track.appendChild(firstItem);
      }

      track.style.transform = `translate3d(${position}px, 0, 0)`;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="ticker wenoselect">
      <div className="ticker-track wenoselect" ref={trackRef} />
    </div>
  );
}
