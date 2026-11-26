// Pure Canvas 2x PNG generator for Shareable Movie Posters & Memory Cards

function wrapLines(ctx, text, maxWidth) {
  const words = (text || '').split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCoverImage(ctx, img, w, h) {
  if (!img) return;
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let ox = 0;
  let oy = 0;
  if (imgRatio > boxRatio) {
    drawW = h * imgRatio;
    ox = (w - drawW) / 2;
  } else {
    drawH = w / imgRatio;
    oy = (h - drawH) / 2;
  }
  ctx.drawImage(img, ox, oy, drawW, drawH);
}

export async function downloadMoviePosterPng(movie, format = '4:5') {
  const isStory = format === '9:16';
  const W = 1080;
  const H = isStory ? 1920 : 1350;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const palette = movie.color_palette || [];
  const accent = palette[0]?.hex || '#a8743c';
  const deepBg = palette[3]?.hex || '#182422';
  const cream = '#f7f2ea';

  // Background fill
  ctx.fillStyle = deepBg;
  ctx.fillRect(0, 0, W, H);

  // Cover photo
  const img = await loadImage(movie.cover_image);
  if (img) {
    drawCoverImage(ctx, img, W, H);
  }

  // Cinematic vignette overlay
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(12, 20, 19, 0.55)');
  grad.addColorStop(0.4, 'rgba(12, 20, 19, 0.25)');
  grad.addColorStop(0.72, 'rgba(12, 20, 19, 0.85)');
  grad.addColorStop(1, 'rgba(10, 16, 15, 0.96)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Inner film border
  ctx.strokeStyle = 'rgba(247, 242, 234, 0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, W - 84, H - 84);

  const padX = 82;
  const contentW = W - padX * 2;

  // Top billing header
  ctx.fillStyle = '#e7c89a';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText('A WAYFARER ORIGINAL TRIP FILM', padX, 108);

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font = '500 22px Inter, system-ui, sans-serif';
  const topRight = `${(movie.destination || '').toUpperCase()}  ·  ${(movie.vibe || '').toUpperCase()} VIBE`;
  const trWidth = ctx.measureText(topRight).width;
  ctx.fillText(topRight, W - padX - trWidth, 108);

  // Palette swatches top-left under header
  palette.slice(0, 4).forEach((sw, idx) => {
    ctx.fillStyle = sw.hex;
    ctx.beginPath();
    ctx.arc(padX + 14 + idx * 34, 152, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  // Bottom editorial content anchor
  let cursorY = isStory ? 980 : 660;

  // Genre pill text
  ctx.fillStyle = '#e7c89a';
  ctx.font = '600 24px Inter, system-ui, sans-serif';
  ctx.fillText((movie.genre || 'TRAVEL FILM').toUpperCase(), padX, cursorY);
  cursorY += 66;

  // Movie Title
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${isStory ? 84 : 74}px Georgia, "Times New Roman", serif`;
  const titleLines = wrapLines(ctx, movie.movie_title, contentW);
  for (const line of titleLines.slice(0, 3)) {
    ctx.fillText(line, padX, cursorY);
    cursorY += isStory ? 94 : 84;
  }

  // Tagline
  cursorY += 8;
  ctx.fillStyle = 'rgba(247, 242, 234, 0.9)';
  ctx.font = 'italic 32px Georgia, "Times New Roman", serif';
  const tagLines = wrapLines(ctx, `“${movie.tagline}”`, contentW);
  for (const line of tagLines.slice(0, 2)) {
    ctx.fillText(line, padX, cursorY);
    cursorY += 44;
  }

  // Divider line
  cursorY += 20;
  ctx.fillStyle = accent;
  ctx.fillRect(padX, cursorY, 120, 3);
  cursorY += 42;

  // Synopsis
  ctx.fillStyle = 'rgba(247, 242, 234, 0.85)';
  ctx.font = '400 25px Inter, system-ui, sans-serif';
  const synLines = wrapLines(ctx, movie.synopsis, contentW);
  for (const line of synLines.slice(0, 3)) {
    ctx.fillText(line, padX, cursorY);
    cursorY += 36;
  }

  // Chapters
  cursorY += 28;
  ctx.fillStyle = '#e7c89a';
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  ctx.fillText('CHAPTERS', padX, cursorY);
  cursorY += 36;

  ctx.fillStyle = cream;
  ctx.font = '500 23px Inter, system-ui, sans-serif';
  for (const chap of (movie.chapter_titles || []).slice(0, 4)) {
    ctx.fillText(chap, padX, cursorY);
    cursorY += 34;
  }

  // Footer credits bar
  const footerY = H - 102;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(padX, footerY - 38);
  ctx.lineTo(W - padX, footerY - 38);
  ctx.stroke();

  const dur = `${movie.duration_days || 4} DAYS`;
  const bud = movie.budget ? `₹${Number(movie.budget).toLocaleString('en-IN')} EST.` : '';
  const sound = movie.soundtrack_mood?.name ? `♪ ${movie.soundtrack_mood.name}` : '';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.font = '600 21px Inter, system-ui, sans-serif';
  ctx.fillText([movie.destination, dur, bud].filter(Boolean).join('  ·  '), padX, footerY);

  ctx.fillStyle = '#e7c89a';
  ctx.font = '500 20px Inter, system-ui, sans-serif';
  ctx.fillText(sound || 'WAYFARER CINEMA', padX, footerY + 34);

  const link = document.createElement('a');
  const safeName = (movie.movie_title || 'wayfarer-trip').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.download = `${safeName}-${isStory ? 'story' : 'poster'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function downloadMemoryCardPng(movie, memory, trip) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1d2b29';
  ctx.fillRect(0, 0, W, H);

  const heroSrc = (memory?.photos && memory.photos[0]) || movie?.cover_image;
  const img = await loadImage(heroSrc);
  if (img) {
    drawCoverImage(ctx, img, W, 760);
  }

  const grad = ctx.createLinearGradient(0, 420, 0, H);
  grad.addColorStop(0, 'rgba(29, 43, 41, 0)');
  grad.addColorStop(0.45, 'rgba(29, 43, 41, 0.94)');
  grad.addColorStop(1, '#182422');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 420, W, H - 420);

  ctx.strokeStyle = 'rgba(231, 200, 154, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  const padX = 82;
  const contentW = W - padX * 2;

  ctx.fillStyle = '#e7c89a';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText('POST-TRIP MEMORY CARD  ·  WAYFARER', padX, 104);

  let y = 740;
  ctx.fillStyle = '#e7c89a';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  const destLabel = (memory?.favorite_destination || trip?.destination || movie?.destination || '').toUpperCase();
  const dateLabel = trip?.dates || movie?.dates || '';
  ctx.fillText([destLabel, dateLabel].filter(Boolean).join('  ·  '), padX, y);
  y += 66;

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 66px Georgia, "Times New Roman", serif';
  for (const line of wrapLines(ctx, movie?.movie_title || trip?.title || 'Unforgettable Journey', contentW).slice(0, 2)) {
    ctx.fillText(line, padX, y);
    y += 76;
  }

  y += 10;
  const story = memory?.post_trip_storyline || memory?.personal_caption || movie?.tagline || '';
  ctx.fillStyle = 'rgba(247, 242, 234, 0.92)';
  ctx.font = 'italic 30px Georgia, "Times New Roman", serif';
  for (const line of wrapLines(ctx, `“${story}”`, contentW).slice(0, 4)) {
    ctx.fillText(line, padX, y);
    y += 42;
  }

  if (memory?.personal_caption && memory?.post_trip_storyline) {
    y += 16;
    ctx.fillStyle = 'rgba(247, 242, 234, 0.78)';
    ctx.font = '400 24px Inter, system-ui, sans-serif';
    for (const line of wrapLines(ctx, memory.personal_caption, contentW).slice(0, 2)) {
      ctx.fillText(line, padX, y);
      y += 34;
    }
  }

  const stars = '★'.repeat(memory?.trip_rating || 5) + '☆'.repeat(5 - (memory?.trip_rating || 5));
  const footerY = H - 105;
  ctx.fillStyle = '#e7c89a';
  ctx.font = '600 28px Inter, system-ui, sans-serif';
  ctx.fillText(stars, padX, footerY);

  if (memory?.favorite_activity) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillText(`Favourite scene: ${memory.favorite_activity}`, padX, footerY + 38);
  }

  const link = document.createElement('a');
  const safeName = (movie?.movie_title || 'trip-memory').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.download = `${safeName}-memory-card.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
