import fs from 'node:fs';

const path = 'src/features/forms/pages/FormBuilderPage.jsx';
const s = fs.readFileSync(path, 'utf8');

const start = s.indexOf('          <div className="border border-[rgba(0,0,0,0.1)] rounded-[12px] overflow-hidden mb-5 bg-[rgba(0,0,0,0.02)]">');
const endMarker =
  '          </div>\r\n        </motion.div>\r\n        {!isPreviewMode && <ContentCardFooter onDelete={onDelete} variant="field" />}';
const endMarker2 =
  '          </div>\r\n        </div>\r\n        {!isPreviewMode && <ContentCardFooter onDelete={onDelete} variant="field" />}';

if (start === -1) {
  console.error('start not found');
  process.exit(1);
}

const end = s.indexOf(endMarker2, start);
if (end === -1) {
  console.error('end not found', { start });
  process.exit(1);
}

const replacement = `          <MapLocationPicker
            latitude={mapLat}
            longitude={mapLng}
            address={mapAddr}
            zoom={mapc.mapZoom ?? 12}
            mapStyle={mapc.mapType === 'roadmap' ? 'default' : (mapc.mapType || 'default')}
            height={mapc.mapHeight || 'M'}
            allowPinMovement={mapc.mapAllowPinMovement !== false}
            showSearch={mapc.mapShowSearchBar !== false}
            restrictRadius={!!mapc.mapRestrictRadius}
            restrictRadiusKm={mapc.mapRestrictRadiusKm ?? 5}
            onChange={(loc) => setMapSelection(loc)}
            searchPlaceholder="Search for a location..."
            className="mb-5"
          />
          {mapc.mapPinLabel && (
            <p className="text-[11px] text-[#aaa] -mt-3 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {mapc.mapPinLabel}
            </p>
          )}
        </div>
        {!isPreviewMode && <ContentCardFooter onDelete={onDelete} variant="field" />}`;

const out = s.slice(0, start) + replacement + s.slice(end + endMarker2.length);
fs.writeFileSync(path, out);
console.log('patched map card');
