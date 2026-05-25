import { useRef, useState } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import MapFieldStaticPreview from '@/features/forms/components/MapFieldStaticPreview';
import { DEFAULT_MAP_CENTER, searchLocations } from '@/features/forms/utils/mapGeocoding';

/**
 * Configure-panel location editor — search + coordinates, no Leaflet (safe in builder).
 */
export default function MapDefaultLocationEditor({
  latitude,
  longitude,
  address = '',
  onChange,
}) {
  const lat = latitude ?? DEFAULT_MAP_CENTER.lat;
  const lng = longitude ?? DEFAULT_MAP_CENTER.lng;
  const [searchQuery, setSearchQuery] = useState(address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimerRef = useRef(null);

  const emit = (next) => {
    onChange?.({
      lat: next.lat,
      lng: next.lng,
      address: next.address ?? '',
    });
  };

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
    emit({ lat: item.lat, lng: item.lng, address: item.address });
  };

  const handleLatChange = (value) => {
    const nextLat = Number(value);
    if (!Number.isFinite(nextLat)) return;
    emit({ lat: nextLat, lng, address: searchQuery || address });
  };

  const handleLngChange = (value) => {
    const nextLng = Number(value);
    if (!Number.isFinite(nextLng)) return;
    emit({ lat, lng: nextLng, address: searchQuery || address });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <RiSearchLine size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#aaa] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
          placeholder="Search for a location..."
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

      <MapFieldStaticPreview
        latitude={lat}
        longitude={lng}
        address={searchQuery || address}
        height="compact"
        showSearch={false}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-[#888] block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => handleLatChange(e.target.value)}
            className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[10px] py-[7px] text-[12px] text-[#333] outline-none focus:border-[#111]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
        <div>
          <label className="text-[11px] text-[#888] block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => handleLngChange(e.target.value)}
            className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[10px] py-[7px] text-[12px] text-[#333] outline-none focus:border-[#111]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
      </div>
    </div>
  );
}
