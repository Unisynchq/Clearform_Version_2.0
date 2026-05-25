import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RiMapPin2Fill, RiSearchLine } from 'react-icons/ri';
import { DEFAULT_MAP_CENTER, reverseGeocode, searchLocations } from '@/features/forms/utils/mapGeocoding';

const HEIGHT_PX = { compact: 113, S: 200, M: 280, L: 360 };

const TILE_LAYERS = {
  default: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
  },
};

const normalizeStyle = (style) => {
  if (style === 'roadmap') return 'default';
  if (style === 'satellite' || style === 'terrain') return style;
  return 'default';
};

const toValidCoord = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Leaflet leaves `_leaflet_id` on the DOM node; clear it so Strict Mode remounts can re-init. */
const clearLeafletContainer = (el) => {
  if (!el) return;
  delete el._leaflet_id;
};

const pinIcon = () =>
  L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.25));font-size:28px;line-height:1;">📍</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

const clampZoom = (value) => {
  const z = Math.round(toValidCoord(value, 12));
  return Math.min(20, Math.max(1, z));
};

/**
 * Interactive map with search, click-to-place, and draggable pin (mobile-style location pick).
 */
export default function MapLocationPicker({
  latitude,
  longitude,
  address = '',
  zoom = 12,
  onChange,
  allowPinMovement = true,
  showSearch = true,
  mapStyle = 'default',
  height = 'M',
  restrictRadius = false,
  restrictRadiusKm = 5,
  className = '',
  searchPlaceholder = 'Search for a location...',
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const geocodeTimerRef = useRef(null);
  const searchTimerRef = useRef(null);
  const skipFlyRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState(address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const resolvedHeight = typeof height === 'number' ? height : (HEIGHT_PX[height] ?? HEIGHT_PX.M);
  const styleKey = normalizeStyle(mapStyle);

  const lat = toValidCoord(latitude, DEFAULT_MAP_CENTER.lat);
  const lng = toValidCoord(longitude, DEFAULT_MAP_CENTER.lng);
  const safeZoom = clampZoom(zoom);

  const emitChange = useCallback(
    (next) => {
      onChange?.({
        lat: next.lat,
        lng: next.lng,
        address: next.address ?? '',
      });
    },
    [onChange]
  );

  const resolveAddress = useCallback(
    async (nextLat, nextLng) => {
      setIsResolving(true);
      try {
        const resolved = await reverseGeocode(nextLat, nextLng);
        setSearchQuery(resolved);
        emitChange({ lat: nextLat, lng: nextLng, address: resolved });
        return resolved;
      } catch {
        const fallback = `${nextLat.toFixed(5)}, ${nextLng.toFixed(5)}`;
        setSearchQuery(fallback);
        emitChange({ lat: nextLat, lng: nextLng, address: fallback });
        return fallback;
      } finally {
        setIsResolving(false);
      }
    },
    [emitChange]
  );

  const moveMarker = useCallback(
    (nextLat, nextLng, { fly = true, resolve = true } = {}) => {
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      if (!map || !marker) return;

      if (restrictRadius && radiusCircleRef.current) {
        const center = radiusCircleRef.current.getLatLng();
        const radiusM = restrictRadiusKm * 1000;
        const to = L.latLng(nextLat, nextLng);
        const dist = center.distanceTo(to);
        if (dist > radiusM) {
          const ratio = radiusM / dist;
          nextLat = center.lat + (nextLat - center.lat) * ratio;
          nextLng = center.lng + (nextLng - center.lng) * ratio;
        }
      }

      marker.setLatLng([nextLat, nextLng]);
      if (fly && !skipFlyRef.current) {
        map.flyTo([nextLat, nextLng], map.getZoom(), { duration: 0.35 });
      }

      if (resolve) {
        clearTimeout(geocodeTimerRef.current);
        geocodeTimerRef.current = setTimeout(() => resolveAddress(nextLat, nextLng), 280);
      } else {
        emitChange({ lat: nextLat, lng: nextLng, address: searchQuery });
      }
    },
    [emitChange, resolveAddress, restrictRadius, restrictRadiusKm, searchQuery]
  );

  /* Initialize map once the container has layout (avoids crashes in zero-width panels / Strict Mode). */
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return undefined;

    let cancelled = false;
    let resizeObserver = null;
    let rafId = 0;
    let initAttempts = 0;

    const destroyMap = () => {
      const map = mapInstanceRef.current;
      if (map) {
        try {
          map.remove();
        } catch {
          /* ignore teardown races */
        }
      }
      mapInstanceRef.current = null;
      markerRef.current = null;
      tileLayerRef.current = null;
      radiusCircleRef.current = null;
      clearLeafletContainer(container);
    };

    const createMap = () => {
      if (cancelled || mapInstanceRef.current || !mapRef.current) return;

      const el = mapRef.current;
      if (el.clientWidth === 0 || el.clientHeight === 0) return;

      clearLeafletContainer(el);

      try {
        const map = L.map(el, {
          center: [lat, lng],
          zoom: safeZoom,
          zoomControl: height !== 'compact',
          attributionControl: height !== 'compact',
        });

        const layerDef = TILE_LAYERS[styleKey] ?? TILE_LAYERS.default;
        tileLayerRef.current = L.tileLayer(layerDef.url, { attribution: layerDef.attribution }).addTo(map);

        const marker = L.marker([lat, lng], {
          icon: pinIcon(),
          draggable: allowPinMovement,
        }).addTo(map);

        markerRef.current = marker;
        mapInstanceRef.current = map;

        if (restrictRadius) {
          radiusCircleRef.current = L.circle([lat, lng], {
            radius: restrictRadiusKm * 1000,
            color: '#2a9d6e',
            fillColor: '#2a9d6e',
            fillOpacity: 0.08,
            weight: 1.5,
          }).addTo(map);
        }

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          moveMarker(pos.lat, pos.lng);
        });

        map.on('click', (e) => {
          if (!allowPinMovement) return;
          moveMarker(e.latlng.lat, e.latlng.lng);
        });

        requestAnimationFrame(() => map.invalidateSize());
      } catch {
        clearLeafletContainer(el);
      }
    };

    const tryCreateMap = () => {
      if (cancelled || mapInstanceRef.current) return;
      createMap();
      if (!mapInstanceRef.current && initAttempts < 120) {
        initAttempts += 1;
        rafId = requestAnimationFrame(tryCreateMap);
      }
    };

    tryCreateMap();

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        const map = mapInstanceRef.current;
        if (!map) {
          tryCreateMap();
          return;
        }
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(geocodeTimerRef.current);
      resizeObserver?.disconnect();
      destroyMap();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Sync zoom */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || map.getZoom() === safeZoom) return;
    try {
      map.setZoom(safeZoom);
    } catch {
      /* ignore invalid zoom during teardown */
    }
  }, [safeZoom]);

  /* Sync tile style */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;
    const layerDef = TILE_LAYERS[styleKey] ?? TILE_LAYERS.default;
    map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(layerDef.url, { attribution: layerDef.attribution }).addTo(map);
  }, [styleKey]);

  /* Sync marker draggability */
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (allowPinMovement) marker.dragging?.enable();
    else marker.dragging?.disable();
  }, [allowPinMovement]);

  /* External lat/lng updates (e.g. search selection) */
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const pos = marker.getLatLng();
    if (Math.abs(pos.lat - lat) < 1e-6 && Math.abs(pos.lng - lng) < 1e-6) return;
    skipFlyRef.current = true;
    try {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], safeZoom);
    } catch {
      /* ignore during map teardown */
    }
    skipFlyRef.current = false;
  }, [lat, lng, safeZoom]);

  useEffect(() => {
    if (address && address !== searchQuery) setSearchQuery(address);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleSearchInput = (value) => {
    setSearchQuery(value);
    clearTimeout(searchTimerRef.current);
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(value);
        setSuggestions(results);
        setSearchOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 350);
  };

  const pickSuggestion = (item) => {
    setSearchOpen(false);
    setSuggestions([]);
    setSearchQuery(item.address);
    skipFlyRef.current = false;
    moveMarker(item.lat, item.lng, { resolve: false });
    emitChange({ lat: item.lat, lng: item.lng, address: item.address });
    try {
      mapInstanceRef.current?.flyTo([item.lat, item.lng], safeZoom, { duration: 0.45 });
    } catch {
      /* ignore during map teardown */
    }
  };

  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      {showSearch && (
        <div className="relative">
          <RiSearchLine size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
            placeholder={searchPlaceholder}
            className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] pl-[30px] pr-3 py-[8px] text-[13px] text-[#333] placeholder:text-[#bbb] outline-none focus:border-[#111] transition-colors"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
          {searchOpen && suggestions.length > 0 && (
            <ul className="absolute z-[500] left-0 right-0 top-[calc(100%+4px)] bg-white border border-[#e8e8e8] rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.1)] max-h-[180px] overflow-y-auto py-1">
              {suggestions.map((s) => (
                <li key={s.placeId}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(s)}
                    className="w-full text-left px-3 py-2 text-[12px] text-[#333] hover:bg-[rgba(0,0,0,0.04)] cursor-pointer"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {s.address}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div
        className="relative border border-[#dde6dd] rounded-[8px] overflow-hidden bg-[#e8ede8]"
        style={{ height: resolvedHeight }}
      >
        <div ref={mapRef} className="absolute inset-0 z-0" />
        {!allowPinMovement && (
          <div className="absolute inset-0 z-[400] cursor-not-allowed bg-transparent" aria-hidden />
        )}
        {isResolving && (
          <div className="absolute bottom-2 left-2 z-[450] bg-white/90 rounded-[6px] px-2 py-1 text-[10px] text-[#666]">
            Updating address…
          </div>
        )}
      </div>

      {address && height !== 'compact' && (
        <div className="flex items-start gap-2 px-1">
          <RiMapPin2Fill size={14} className="text-[#2a9d6e] shrink-0 mt-[2px]" />
          <p className="text-[12px] text-[#555] leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {address}
          </p>
        </div>
      )}
    </div>
  );
}
