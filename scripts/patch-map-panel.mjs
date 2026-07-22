import fs from 'node:fs';

const path = 'src/features/forms/pages/FormBuilderPage.jsx';
const s = fs.readFileSync(path, 'utf8');

const panelStart = s.indexOf('        {/* ── Map Configure panel ── */}');
const actualStart = s.indexOf('              <div className="w-[280px] h-full bg-[#f7f6f4]', panelStart);
const endMarker = '            </motion.div>\r\n          )}\r\n        </AnimatePresence>\r\n\r\n        {/* ── Captcha Configure panel ── */}';
const end = s.indexOf(endMarker, actualStart);

if (actualStart === -1 || end === -1) {
  console.error('bounds not found', { actualStart, end });
  process.exit(1);
}

const replacement = `              <MapConfigurePanel
                onClose={() => setShowMapConfigPanel(false)}
                sections={mapSections}
                setSections={setMapSections}
                mapRequired={mapRequired}
                setMapRequired={setMapRequired}
                mapHidden={mapHidden}
                setMapHidden={setMapHidden}
                mapQuestion={mapQuestion}
                setMapQuestion={setMapQuestion}
                mapHelperText={mapHelperText}
                setMapHelperText={setMapHelperText}
                mapDefaultLat={mapDefaultLat}
                setMapDefaultLat={setMapDefaultLat}
                mapDefaultLng={mapDefaultLng}
                setMapDefaultLng={setMapDefaultLng}
                mapDefaultAddress={mapDefaultAddress}
                setMapDefaultAddress={setMapDefaultAddress}
                mapZoom={mapZoom}
                setMapZoom={setMapZoom}
                mapAllowPinMovement={mapAllowPinMovement}
                setMapAllowPinMovement={setMapAllowPinMovement}
                mapShowSearchBar={mapShowSearchBar}
                setMapShowSearchBar={setMapShowSearchBar}
                mapRestrictRadius={mapRestrictRadius}
                setMapRestrictRadius={setMapRestrictRadius}
                mapPinLabel={mapPinLabel}
                setMapPinLabel={setMapPinLabel}
                mapHeight={mapHeight}
                setMapHeight={setMapHeight}
                mapType={mapType}
                setMapType={setMapType}
              />
`;

const out = s.slice(0, actualStart) + replacement + s.slice(end);
fs.writeFileSync(path, out);
console.log('patched');
