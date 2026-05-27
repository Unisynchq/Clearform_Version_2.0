import fs from 'node:fs';

const p = 'src/features/forms/pages/FormBuilderPage.jsx';
let c = fs.readFileSync(p, 'utf8');
const start = c.indexOf('          {/* -- Settings Panel -- */}');
const end = c.indexOf('          ) : !hasScreens ? (', start);
if (start < 0 || end < 0) throw new Error(`markers ${start} ${end}`);

const replacement = `          {activeTab === 'settings' ? (
            <FormBuilderSettingsPanel
              settingsAutoAdvance={settingsAutoAdvance}
              setSettingsAutoAdvance={setSettingsAutoAdvance}
              settingsBackButton={settingsBackButton}
              setSettingsBackButton={setSettingsBackButton}
              settingsResubmission={settingsResubmission}
              setSettingsResubmission={setSettingsResubmission}
              settingsConfirmationEmail={settingsConfirmationEmail}
              setSettingsConfirmationEmail={setSettingsConfirmationEmail}
              settingsResponseLimit={settingsResponseLimit}
              setSettingsResponseLimit={setSettingsResponseLimit}
              settingsResponseLimitCount={settingsResponseLimitCount}
              setSettingsResponseLimitCount={setSettingsResponseLimitCount}
              onDiscardDraft={() => {}}
              activeFormId={activeFormId}
              formTitle={loadedFormTitle ?? location.state?.formTitle ?? 'Untitled Form'}
            />
`;

c = c.slice(0, start) + replacement + c.slice(end);
if (!c.includes('import FormBuilderSettingsPanel')) {
  c = c.replace(
    'import FormBuilderStepBar',
    "import FormBuilderSettingsPanel from '@/features/forms/components/FormBuilderSettingsPanel';\nimport FormBuilderStepBar",
  );
}
fs.writeFileSync(p, c);
console.log('Settings panel replaced, removed', end - start, 'chars');
