import { motion, AnimatePresence } from 'motion/react';
import { RiArrowDownSLine } from 'react-icons/ri';
import BlockVisibilityConditions from '@/features/forms/components/BlockVisibilityConditions';
import { TOGGLE_TRACK_OFF, TOGGLE_TRACK_ON } from '@/components/ui/ToggleSwitch';
import MapDefaultLocationEditor from '@/features/forms/components/MapDefaultLocationEditor';
import { DEFAULT_MAP_CENTER } from '@/features/forms/utils/mapGeocoding';

const MAP_STYLE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'terrain', label: 'Terrain' },
];

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f5f5f5] pb-[9px] pt-2 last:border-0">
      <span className="text-[12px] text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative shrink-0 transition-colors"
        style={{
          width: 34,
          height: 20,
          borderRadius: 10,
          background: checked ? TOGGLE_TRACK_ON : TOGGLE_TRACK_OFF,
          padding: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: checked ? 'flex-end' : 'flex-start',
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 7, background: 'white', display: 'block' }} />
      </button>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="text-[12px] text-[#444] block mb-[5px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {children}
    </label>
  );
}

function FieldInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[9px] text-[13px] text-[#333] placeholder:text-[#bbb] outline-none focus:border-[#111] transition-colors"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    />
  );
}

export default function MapConfigurePanel(props) {
  const {
    onClose,
    sections,
    setSections,
    mapRequired,
    setMapRequired,
    mapHidden,
    setMapHidden,
    mapQuestion,
    setMapQuestion,
    mapHelperText,
    setMapHelperText,
    mapDefaultLat,
    setMapDefaultLat,
    mapDefaultLng,
    setMapDefaultLng,
    mapDefaultAddress,
    setMapDefaultAddress,
    mapZoom,
    setMapZoom,
    mapAllowPinMovement,
    setMapAllowPinMovement,
    mapShowSearchBar,
    setMapShowSearchBar,
    mapRestrictRadius,
    setMapRestrictRadius,
    mapPinLabel,
    setMapPinLabel,
    mapHeight,
    setMapHeight,
    mapType,
    setMapType,
    showIfConditions = [],
    onShowIfConditionsChange,
    priorScreens = [],
  } = props;

  const mapStyleValue =
    mapType === 'roadmap' || mapType === 'default'
      ? 'default'
      : mapType === 'satellite' || mapType === 'terrain'
        ? mapType
        : 'default';

  const handleDefaultLocationChange = ({ lat, lng, address }) => {
    setMapDefaultLat(lat);
    setMapDefaultLng(lng);
    setMapDefaultAddress(address);
  };

  return (
    <div className="w-[280px] h-full bg-[#f7f6f4] border-l border-[#e5e3dc] flex flex-col" style={{ boxShadow: '-2px 2px 10px 0px rgba(0,0,0,0.08)' }}>
      <div className="border-b border-[#f0f0f0] flex items-center justify-between py-[13px] px-4 shrink-0">
        <span className="text-[13px] font-semibold text-[#111] tracking-[-0.13px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Configure</span>
        <button type="button" onClick={onClose} className="w-[22px] h-[22px] bg-[#f2f2f2] rounded-[11px] flex items-center justify-center cursor-pointer hover:bg-[#e5e3dc] transition-colors">
          <span className="text-[#666] text-[13px] leading-none select-none">×</span>
        </button>
      </div>

      <div className="px-4 pt-[10px] pb-[8px] shrink-0">
        <span className="text-[10px] font-bold tracking-[0.5px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>MAPS</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-t border-[#f0f0f0]">
          <button type="button" onClick={() => setSections((p) => ({ ...p, fieldSettings: !p.fieldSettings }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
            <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>FIELD SETTINGS</span>
            <motion.span animate={{ rotate: sections.fieldSettings ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
              <RiArrowDownSLine size={14} className="text-[#999]" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {sections.fieldSettings && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-4 pb-4 flex flex-col gap-3">
                  <ToggleRow label="Required" checked={mapRequired} onChange={setMapRequired} />
                  <ToggleRow label="Hidden" checked={mapHidden} onChange={setMapHidden} />
                  <div>
                    <FieldLabel>Question</FieldLabel>
                    <FieldInput value={mapQuestion} onChange={(e) => setMapQuestion(e.target.value)} placeholder="Where is your office located?" />
                  </div>
                  <div>
                    <FieldLabel>Helper text</FieldLabel>
                    <FieldInput value={mapHelperText} onChange={(e) => setMapHelperText(e.target.value)} placeholder="Drag the pin to your location" />
                  </div>
                  <div>
                    <FieldLabel>Default location</FieldLabel>
                    <MapDefaultLocationEditor
                      latitude={mapDefaultLat ?? DEFAULT_MAP_CENTER.lat}
                      longitude={mapDefaultLng ?? DEFAULT_MAP_CENTER.lng}
                      address={mapDefaultAddress}
                      onChange={handleDefaultLocationChange}
                    />
                  </div>
                  <div>
                    <FieldLabel>Default zoom</FieldLabel>
                    <div className="flex items-center gap-[10px]">
                      <input type="range" min={1} max={20} value={mapZoom} onChange={(e) => setMapZoom(Number(e.target.value))} className="flex-1 accent-[#111] h-[3px]" />
                      <span className="text-[12px] text-[#555] min-w-[24px] text-right" style={{ fontFamily: "'DM Sans', sans-serif" }}>{mapZoom}</span>
                    </div>
                  </div>
                  <ToggleRow label="Allow pin movement" checked={mapAllowPinMovement} onChange={setMapAllowPinMovement} />
                  <ToggleRow label="Show search bar" checked={mapShowSearchBar} onChange={setMapShowSearchBar} />
                  <ToggleRow label="Restrict to radius" checked={mapRestrictRadius} onChange={setMapRestrictRadius} />
                  <div>
                    <FieldLabel>Pin label</FieldLabel>
                    <FieldInput value={mapPinLabel} onChange={(e) => setMapPinLabel(e.target.value)} placeholder="Your location" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-[#f0f0f0]">
          <button type="button" onClick={() => setSections((p) => ({ ...p, conditionalLogic: !p.conditionalLogic }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
            <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>CONDITIONAL LOGIC</span>
            <motion.span animate={{ rotate: sections.conditionalLogic ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
              <RiArrowDownSLine size={14} className="text-[#999]" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {sections.conditionalLogic && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-4 pb-[15px]">
                  <BlockVisibilityConditions
                    conditions={showIfConditions}
                    onChange={onShowIfConditionsChange}
                    priorScreens={priorScreens}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-[#f0f0f0]">
          <button type="button" onClick={() => setSections((p) => ({ ...p, appearance: !p.appearance }))} className="flex items-center justify-between w-full px-4 py-[10px] cursor-pointer">
            <span className="text-[9.5px] font-bold tracking-[0.7px] uppercase text-[#999]" style={{ fontFamily: "'DM Sans', sans-serif" }}>APPEARANCE</span>
            <motion.span animate={{ rotate: sections.appearance ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex items-center shrink-0">
              <RiArrowDownSLine size={14} className="text-[#999]" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {sections.appearance && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="px-4 pb-4 flex flex-col gap-3">
                  <div>
                    <FieldLabel>Map height</FieldLabel>
                    <div className="flex gap-[6px]">
                      {['S', 'M', 'L'].map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setMapHeight(size)}
                          className={`w-8 h-7 rounded-[6px] border text-[12px] transition-colors ${
                            mapHeight === size ? 'border-[#111] text-[#111] bg-white' : 'border-[#e0e0e0] text-[#777] bg-white'
                          }`}
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Map style</FieldLabel>
                    <select
                      value={mapStyleValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMapType(v === 'default' ? 'roadmap' : v);
                      }}
                      className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-[7px] px-[11px] py-[9px] text-[13px] text-[#333] outline-none focus:border-[#111] transition-colors cursor-pointer"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {MAP_STYLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
