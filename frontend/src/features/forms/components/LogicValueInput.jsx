import {
  getLogicChoiceOptionsForCondition,
  isChoiceLogicFieldId,
} from '@/features/forms/constants/logicFieldCatalog';
import { isNumericFieldId } from '@/features/forms/utils/logicEngine';

/**
 * Value editor for logic conditions — choice fields use option dropdowns from screen config.
 */
export default function LogicValueInput({
  screens = [],
  sourceScreenId,
  fieldId,
  operator,
  value,
  onChange,
  className = '',
  inputClassName = '',
  selectClassName = '',
}) {
  const hideValue = operator === 'is_empty' || operator === 'is_not_empty';
  if (hideValue) {
    return <span className={`text-[11px] text-[#a1a1aa] px-1 ${className}`}>—</span>;
  }

  const choiceOptions = isChoiceLogicFieldId(fieldId)
    ? getLogicChoiceOptionsForCondition(screens, sourceScreenId, fieldId)
    : [];

  if (choiceOptions.length > 0) {
    const showIncludesHint = operator === 'includes' || operator === 'not_includes';
    return (
      <div className={`flex flex-col gap-0.5 min-w-0 ${className}`}>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={
            selectClassName ||
            `bg-white border border-[#e4e4e7] rounded-[5px] px-[9px] py-[6px] text-[12px] text-[#18181b] outline-none cursor-pointer min-w-0 w-full max-w-full ${inputClassName}`
          }
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <option value="">Select option…</option>
          {choiceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {showIncludesHint ? (
          <span className="text-[10px] text-[#a1a1aa] leading-tight">
            Matches if this choice is selected.
          </span>
        ) : null}
      </div>
    );
  }

  const numeric = isNumericFieldId(fieldId);
  return (
    <input
      type={numeric ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={numeric ? '0' : '…'}
      className={
        inputClassName ||
        `bg-white border border-[#e4e4e7] rounded-[5px] px-[9px] py-[6px] text-[12px] text-[#18181b] outline-none min-w-0 ${className}`
      }
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    />
  );
}
