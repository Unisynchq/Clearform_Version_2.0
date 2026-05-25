import { RiMapPin2Fill } from 'react-icons/ri';
import { DEFAULT_MAP_CENTER } from '@/features/forms/utils/mapGeocoding';

const HEIGHT_PX = { compact: 113, S: 200, M: 280, L: 360 };

const toValidCoord = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Non-interactive map preview for the form builder (no Leaflet).
 */
export default function MapFieldStaticPreview({
  latitude,
  longitude,
  address = '',
  height = 'M',
  showSearch = true,
  className = '',
}) {
  const lat = toValidCoord(latitude, DEFAULT_MAP_CENTER.lat);
  const lng = toValidCoord(longitude, DEFAULT_MAP_CENTER.lng);
  const resolvedHeight = typeof height === 'number' ? height : (HEIGHT_PX[height] ?? HEIGHT_PX.M);
  const displayAddress = address?.trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  return (
    <div className={`flex flex-col gap-[5px] ${className}`}>
      {showSearch && (
        <div
          className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[30px] py-[8px] text-[13px] text-[#bbb]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Search for a location…
        </div>
      )}
      <div
        className="relative border border-[#dde6dd] rounded-[8px] overflow-hidden bg-[#e8ede8] flex items-center justify-center"
        style={{ height: resolvedHeight }}
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(#c5d4c5 1px, transparent 1px), linear-gradient(90deg, #c5d4c5 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <span className="relative text-[32px] leading-none select-none" aria-hidden>
          📍
        </span>
        <span className="absolute top-2 right-2 text-[10px] text-[#888] bg-white/80 rounded px-1.5 py-0.5">
          Builder preview
        </span>
      </div>
      {displayAddress && (
        <div className="flex items-start gap-2 px-1">
          <RiMapPin2Fill size={14} className="text-[#2a9d6e] shrink-0 mt-[2px]" />
          <p className="text-[12px] text-[#555] leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {displayAddress}
          </p>
        </div>
      )}
    </div>
  );
}
