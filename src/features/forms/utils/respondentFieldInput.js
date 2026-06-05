/**
 * Shared respondent-facing field chrome — builder preview + live /f/:id forms.
 * Layout/CSS only; pairs with `.respondent-field-input` autofill rules in index.css.
 */

const RESPONDENT_FIELD_BASE =
  'w-full rounded-lg border border-[#e4e4e7] bg-white px-3 py-2.5 text-[14px] font-light text-[#111] placeholder:text-[#bbb] outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-[#18181a]/15 focus:border-transparent';

/** Marker class + Tailwind surface for text/email/tel inputs */
export const RESPONDENT_INPUT_CLASS = `respondent-field-input ${RESPONDENT_FIELD_BASE}`;

export function respondentInputClass(extra = '') {
  return extra ? `${RESPONDENT_INPUT_CLASS} ${extra}`.trim() : RESPONDENT_INPUT_CLASS;
}

export function respondentTextareaClass(extra = '') {
  return respondentInputClass(`resize-y min-h-[72px] leading-[1.5] ${extra}`.trim());
}
