import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext.jsx';

const CAT_COLORS = {
  Hotels: '#fde047',
  Flights: '#38bdf8',
  Trains: '#a7f3d0',
  Buses: '#93c5fd',
  Rentals: '#fb923c',
  Restaurants: '#f472b6',
  Activities: '#4ade80',
  Destinations: '#fde047',
  Low: '#4ade80',
  Moderate: '#facc15',
  High: '#fb7185',
};

function makeMarkerIcon(color, active = false, label = '') {
  const size = active ? 24 : 18;
  const ring = active ? 'outline: 3px solid #fde047; outline-offset: 2px;' : '';
  return L.divIcon({
    className: 'wayfarer-map-pin-wrap',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid #111111;
      box-shadow:2px 2px 0 #111111;
      ${ring}
      display:grid;
      place-items:center;
      font-size:10px;
      font-weight:900;
      color:#111111;
    ">${label}</div>`,
  });
}

export default function TravelMap({
  places = [],
  selectedId = null,
  onSelectPlace,
  onBookPlace,
  height = 420,
  title = 'Interactive Place Map',
  legendItems = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markersByIdRef = useRef({});
  const { formatMoney } = useRealtime();

  const validPlaces = places.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !Number.isNaN(p.latitude) && !Number.isNaN(p.longitude)
  );

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [26.9124, 75.7873],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Ensure proper tile sizing after animated page transitions
    const timer = setTimeout(() => map.invalidateSize(), 350);
    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Re-render markers whenever places or selectedId change
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markersByIdRef.current = {};

    if (!validPlaces.length) return;

    const bounds = [];
    const seen = [];
    validPlaces.forEach((p) => {
      let lat = p.latitude;
      let lng = p.longitude;
      // Micro-offset co-located pins so every marker stays individually clickable
      let clashes = seen.filter(([slat, slng]) => Math.abs(slat - lat) < 0.0012 && Math.abs(slng - lng) < 0.0012).length;
      if (clashes > 0) {
        const angle = clashes * 1.4;
        lat += Math.sin(angle) * 0.0014 * Math.ceil(clashes / 4);
        lng += Math.cos(angle) * 0.0014 * Math.ceil(clashes / 4);
      }
      seen.push([lat, lng]);

      const keyColor = CAT_COLORS[p.level] || CAT_COLORS[p.category] || '#fde047';
      const isSelected = selectedId !== null && String(p.id) === String(selectedId);
      const marker = L.marker([lat, lng], {
        icon: makeMarkerIcon(keyColor, isSelected),
        zIndexOffset: isSelected ? 500 : 0,
      });

      const popupEl = document.createElement('div');
      popupEl.className = 'map-popup-box';
      const priceText = p.price > 0 ? formatMoney(p.price) : '';
      const subText = p.best ? `Best time: ${p.best}` : (p.meta || p.destination || '');
      const badgeText = p.level ? `${p.level} crowd` : (p.category || p.destination || 'Place');

      popupEl.innerHTML = `
        <div class="map-popup-cat">${badgeText}</div>
        <div class="map-popup-title">${p.name || p.place}</div>
        ${subText ? `<div class="map-popup-meta">${subText}</div>` : ''}
        <div class="map-popup-coords">${p.latitude.toFixed(4)}°, ${p.longitude.toFixed(4)}°</div>
        ${priceText || p.rating ? `<div class="map-popup-row">
          ${p.rating ? `<span>★ ${p.rating}</span>` : '<span></span>'}
          ${priceText ? `<b>${priceText}</b>` : ''}
        </div>` : ''}
      `;

      if (onBookPlace && p.category !== 'Destinations' && !p.level) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-popup-btn';
        btn.textContent = 'Book Now →';
        btn.onclick = () => onBookPlace(p);
        popupEl.appendChild(btn);
      } else if (onSelectPlace && p.category === 'Destinations') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-popup-btn';
        btn.textContent = `Explore ${p.name} →`;
        btn.onclick = () => onSelectPlace(p);
        popupEl.appendChild(btn);
      }

      marker.bindPopup(popupEl, {
        autoPanPaddingTopLeft: [24, 96],
        autoPanPaddingBottomRight: [24, 24],
      });
      marker.on('click', () => {
        if (onSelectPlace) onSelectPlace(p);
      });

      marker.addTo(layer);
      markersByIdRef.current[String(p.id)] = marker;
      bounds.push([lat, lng]);
    });

    if (selectedId && markersByIdRef.current[String(selectedId)]) {
      const target = markersByIdRef.current[String(selectedId)];
      const ll = target.getLatLng();
      map.flyTo(ll, Math.max(map.getZoom(), 13), { duration: 0.6 });
      target.openPopup();
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { paddingTopLeft: [44, 96], paddingBottomRight: [44, 36], maxZoom: 13 });
    }

    setTimeout(() => map.invalidateSize(), 200);
  }, [JSON.stringify(validPlaces.map((p) => [p.id, p.latitude, p.longitude, p.level, p.category])), selectedId]);

  const handleFitAll = () => {
    const map = mapRef.current;
    if (!map || !validPlaces.length) return;
    if (validPlaces.length === 1) {
      map.setView([validPlaces[0].latitude, validPlaces[0].longitude], 13);
    } else {
      map.fitBounds(validPlaces.map((p) => [p.latitude, p.longitude]), {
        paddingTopLeft: [44, 96],
        paddingBottomRight: [44, 36],
        maxZoom: 13,
      });
    }
  };

  const activePlace = validPlaces.find((p) => String(p.id) === String(selectedId)) || validPlaces[0];

  return (
    <div className="map-frame">
      <div className="map-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <MapPin size={16} />
          <b>{title}</b>
          <span className="map-count-pill">{validPlaces.length} pinned</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activePlace && (
            <small className="map-gps">
              {activePlace.latitude.toFixed(3)}° N, {activePlace.longitude.toFixed(3)}° E
            </small>
          )}
          <button type="button" className="map-fit-btn" onClick={handleFitAll}>
            <Navigation size={12} /> Fit All
          </button>
        </div>
      </div>

      <div ref={containerRef} style={{ width: '100%', height }} className="leaflet-canvas" />

      <div className="map-legend">
        {(legendItems || [
          ['Hotels', '#fde047'],
          ['Restaurants', '#f472b6'],
          ['Activities', '#4ade80'],
          ['Rentals', '#fb923c'],
          ['Transport', '#38bdf8'],
        ]).map(([lbl, col]) => (
          <span key={lbl} className="map-legend-item">
            <i style={{ background: col }} /> {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}
