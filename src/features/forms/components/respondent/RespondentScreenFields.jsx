/**
 * Public-form inputs for content screens — mirrors builder preview field keys
 * used by logicEngine (previewFields, previewPicks, etc.).
 */

const fieldClass =
  'w-full rounded-lg border border-[#e4e4e7] px-3 py-2 text-[14px] outline-none focus:border-[#7c3aed]';
const labelClass = 'text-[11px] font-semibold uppercase tracking-wide text-[#71717a]';

function LabeledInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </label>
  );
}

function getPf(snap, key, def = '') {
  return snap.previewFields?.[key] ?? def;
}

function setPfKey(snap, updateSnap, key, val) {
  updateSnap({
    previewFields: { ...(snap.previewFields ?? {}), [key]: val },
  });
}

function ChoiceList({ label, options, snap, updateSnap, multiple }) {
  const opts = options?.length ? options : [];
  return (
    <div className="flex flex-col gap-2">
      {opts.map((opt) => {
        const optLabel = typeof opt === 'string' ? opt : opt?.label ?? '';
        const picked = (snap.previewPicks ?? []).includes(optLabel);
        return (
          <button
            key={optLabel}
            type="button"
            onClick={() => {
              if (multiple) {
                const next = picked
                  ? snap.previewPicks.filter((p) => p !== optLabel)
                  : [...(snap.previewPicks ?? []), optLabel];
                updateSnap({ previewPicks: next });
              } else {
                updateSnap({ previewPicks: [optLabel] });
              }
            }}
            className={`rounded-lg border px-4 py-3 text-left text-[14px] cursor-pointer transition-colors ${
              picked
                ? 'border-[#7c3aed] bg-[#f5f3ff] text-[#18181b]'
                : 'border-[#e4e4e7] bg-white hover:bg-[#fafaf9]'
            }`}
          >
            {optLabel}
          </button>
        );
      })}
      {!opts.length ? (
        <p className="text-[13px] text-[#71717a]">No options configured.</p>
      ) : null}
    </div>
  );
}

export default function RespondentScreenFields({ label, config, snap, updateSnap }) {
  if (label === 'Single' || label === 'Multiple') {
    const opts = config.singleOptions || config.multipleOptions || [];
    return <ChoiceList label={label} options={opts} snap={snap} updateSnap={updateSnap} multiple={label === 'Multiple'} />;
  }

  if (label === 'Media') {
    const opts = (config.mediaOptions ?? []).map((o) => (typeof o === 'string' ? o : o?.label ?? ''));
    return (
      <ChoiceList
        label={label}
        options={opts}
        snap={snap}
        updateSnap={updateSnap}
        multiple={!!config.mediaAllowMultiple}
      />
    );
  }

  if (label === 'Short text') {
    return (
      <input
        type="text"
        value={snap.shortTextDraft ?? ''}
        onChange={(e) => updateSnap({ shortTextDraft: e.target.value })}
        className={fieldClass}
        placeholder="Your answer"
      />
    );
  }

  if (label === 'Long text') {
    return (
      <textarea
        value={snap.longTextDraft ?? ''}
        onChange={(e) => updateSnap({ longTextDraft: e.target.value })}
        rows={4}
        className={fieldClass}
        placeholder="Your answer"
      />
    );
  }

  if (label === 'Rating') {
    const max = config.ratingMaxRating ?? 5;
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => updateSnap({ ratingValue: n })}
            className={`h-10 w-10 rounded-lg border text-[14px] font-medium cursor-pointer ${
              snap.ratingValue === n
                ? 'border-[#7c3aed] bg-[#7c3aed] text-white'
                : 'border-[#e4e4e7] bg-white'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    );
  }

  if (label === 'Contact') {
    const fields = config.contactFields ?? {};
    const show = (key) => fields[key]?.visible !== false;
    return (
      <div className="flex flex-col gap-3">
        {(show('firstName') || show('lastName')) && (
          <div className="grid grid-cols-2 gap-3">
            {show('firstName') && (
              <LabeledInput
                label="First name"
                value={getPf(snap, 'c.fn')}
                onChange={(v) => setPfKey(snap, updateSnap, 'c.fn', v)}
              />
            )}
            {show('lastName') && (
              <LabeledInput
                label="Last name"
                value={getPf(snap, 'c.ln')}
                onChange={(v) => setPfKey(snap, updateSnap, 'c.ln', v)}
              />
            )}
          </div>
        )}
        {show('email') && (
          <LabeledInput
            label="Email"
            type="email"
            value={getPf(snap, 'c.em')}
            onChange={(v) => setPfKey(snap, updateSnap, 'c.em', v)}
          />
        )}
        {show('phone') && (
          <LabeledInput
            label="Phone"
            type="tel"
            value={getPf(snap, 'c.ph')}
            onChange={(v) => setPfKey(snap, updateSnap, 'c.ph', v)}
          />
        )}
        {show('company') && (
          <LabeledInput
            label="Company"
            value={getPf(snap, 'c.co')}
            onChange={(v) => setPfKey(snap, updateSnap, 'c.co', v)}
          />
        )}
      </div>
    );
  }

  if (label === 'Address') {
    const fields = config.addressFields ?? {};
    const show = (key) => fields[key]?.visible !== false;
    return (
      <div className="flex flex-col gap-3">
        {show('street') && (
          <LabeledInput
            label="Street"
            value={getPf(snap, 'a.st')}
            onChange={(v) => setPfKey(snap, updateSnap, 'a.st', v)}
          />
        )}
        <div className="grid grid-cols-2 gap-3">
          {show('city') && (
            <LabeledInput
              label="City"
              value={getPf(snap, 'a.ci')}
              onChange={(v) => setPfKey(snap, updateSnap, 'a.ci', v)}
            />
          )}
          {show('state') && (
            <LabeledInput
              label="State"
              value={getPf(snap, 'a.ste')}
              onChange={(v) => setPfKey(snap, updateSnap, 'a.ste', v)}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {show('postal') && (
            <LabeledInput
              label="Postal code"
              value={getPf(snap, 'a.po')}
              onChange={(v) => setPfKey(snap, updateSnap, 'a.po', v)}
            />
          )}
          {show('country') && (
            <LabeledInput
              label="Country"
              value={getPf(snap, 'a.ct')}
              onChange={(v) => setPfKey(snap, updateSnap, 'a.ct', v)}
            />
          )}
        </div>
      </div>
    );
  }

  if (label === 'Work Info') {
    return (
      <div className="flex flex-col gap-3">
        <LabeledInput
          label="Company"
          value={getPf(snap, 'w.co')}
          onChange={(v) => setPfKey(snap, updateSnap, 'w.co', v)}
        />
        <LabeledInput
          label="Title"
          value={getPf(snap, 'w.ti')}
          onChange={(v) => setPfKey(snap, updateSnap, 'w.ti', v)}
        />
        <LabeledInput
          label="Industry"
          value={getPf(snap, 'w.ind')}
          onChange={(v) => setPfKey(snap, updateSnap, 'w.ind', v)}
        />
        <LabeledInput
          label="Team size"
          value={getPf(snap, 'w.ts')}
          onChange={(v) => setPfKey(snap, updateSnap, 'w.ts', v)}
        />
      </div>
    );
  }

  if (label === 'Date') {
    return (
      <input
        type="date"
        value={getPf(snap, 'dateAns') || getPf(snap, 'date')}
        onChange={(e) => setPfKey(snap, updateSnap, 'dateAns', e.target.value)}
        className={fieldClass}
      />
    );
  }

  if (label === 'Time') {
    return (
      <input
        type="time"
        value={getPf(snap, 'dateAns') || getPf(snap, 'numAns')}
        onChange={(e) => {
          const v = e.target.value;
          setPfKey(snap, updateSnap, 'dateAns', v);
          setPfKey(snap, updateSnap, 'numAns', v);
        }}
        className={fieldClass}
      />
    );
  }

  if (label === 'Upload' || label === 'Multi-image upload') {
    return (
      <div className="flex flex-col gap-2">
        <input
          type="file"
          multiple={label === 'Multi-image upload'}
          className="text-[14px] text-[#52525b]"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            updateSnap({
              uploadedFiles: files.map((f) => ({ name: f.name })),
              previewFields: {
                ...(snap.previewFields ?? {}),
                uploadAns: files.length ? 'uploaded' : '',
              },
            });
          }}
        />
        {(snap.uploadedFiles ?? []).length > 0 ? (
          <p className="text-[13px] text-[#52525b]">
            {(snap.uploadedFiles ?? []).map((f) => f.name).join(', ')}
          </p>
        ) : null}
      </div>
    );
  }

  if (label === 'Captcha') {
    return (
      <label className="flex items-center gap-2 cursor-pointer text-[14px] text-[#18181b]">
        <input
          type="checkbox"
          checked={!!snap.captchaChecked}
          onChange={(e) => updateSnap({ captchaChecked: e.target.checked })}
          className="h-4 w-4 rounded border-[#d4d4d8]"
        />
        I am not a robot
      </label>
    );
  }

  return (
    <p className="text-[13px] text-[#71717a]">
      This question type uses a simplified view on the live form. Continue when ready.
    </p>
  );
}

export function isRespondentScreenComplete(label, config, snap) {
  if (!config) return true;
  const req = (flag) => flag === true;

  if (label === 'Single' || label === 'Multiple' || label === 'Media') {
    if (!req(config.singleRequired ?? config.multipleRequired ?? config.mediaRequired)) return true;
    return (snap.previewPicks ?? []).length > 0;
  }
  if (label === 'Short text') {
    if (!req(config.shortTextRequired)) return true;
    return String(snap.shortTextDraft ?? '').trim().length > 0;
  }
  if (label === 'Long text') {
    if (!req(config.longTextRequired)) return true;
    return String(snap.longTextDraft ?? '').trim().length > 0;
  }
  if (label === 'Rating') {
    if (!req(config.ratingRequired)) return true;
    return (snap.ratingValue ?? 0) > 0;
  }
  if (label === 'Captcha') {
    if (config.captchaEnabled === false) return true;
    return !!snap.captchaChecked;
  }
  if (label === 'Upload' || label === 'Multi-image upload') {
    if (!req(config.required ?? config.multiImageRequired)) return true;
    return (snap.uploadedFiles?.length ?? 0) > 0 || String(snap.previewFields?.uploadAns ?? '').length > 0;
  }
  return true;
}
