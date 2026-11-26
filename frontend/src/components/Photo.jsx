export default function Photo({ src, alt = '', className = '', children, style }) {
  return (
    <div className={`photo ${className}`} style={style}>
      <img src={src} alt={alt} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      {children}
    </div>
  );
}
