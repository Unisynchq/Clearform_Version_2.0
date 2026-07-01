import { RiAddLine, RiDeleteBin6Line } from 'react-icons/ri';
import LogicFieldPicker from '@/features/forms/components/LogicFieldPicker';
import LogicValueInput from '@/features/forms/components/LogicValueInput';
import { getLogicFieldsForScreenLabel } from '@/features/forms/constants/logicFieldCatalog';
import { getOperatorsForFieldId } from '@/features/forms/utils/logicEngine';

const createEmptyVisibilityCondition = (priorScreens) => {
  const first = priorScreens[0];
  const fieldId = getLogicFieldsForScreenLabel(first?.label)[0]?.id ?? 'short-text';
  const ops = getOperatorsForFieldId(fieldId);
  return {
    id: `vis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceScreenId: first?.id ?? null,
    fieldId,
    operator: ops[0]?.id ?? 'eq',
    value: '',
  };
};

const LogicSelect = ({ value, onChange, options, className = '' }) => (
  <select
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className={`bg-white border border-[rgba(0,0,0,0.12)] rounded-[6px] px-2 py-[6px] text-[11px] text-[#111] outline-none cursor-pointer min-w-0 ${className}`}
    style={{ fontFamily: "'DM Sans', sans-serif" }}
  >
    {options.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt.label}
      </option>
    ))}
  </select>
);

/**
 * "SHOW THIS BLOCK IF" editor — conditions reference answers from prior screens only.
 */
export default function BlockVisibilityConditions({
  conditions = [],
  onChange,
  priorScreens = [],
  screens = [],
  compact = true,
}) {
  const canAdd = priorScreens.length > 0;

  const updateCondition = (condId, patch) => {
    onChange(
      conditions.map((c) => {
        if (c.id !== condId) return c;
        const next = { ...c, ...patch };
        if (patch.sourceScreenId != null && patch.sourceScreenId !== c.sourceScreenId) {
          const screen = priorScreens.find((s) => s.id === Number(patch.sourceScreenId));
          const fields = getLogicFieldsForScreenLabel(screen?.label);
          const newFieldId = fields[0]?.id ?? 'short-text';
          const ops = getOperatorsForFieldId(newFieldId);
          next.fieldId = newFieldId;
          if (!ops.some((o) => o.id === next.operator)) {
            next.operator = ops[0]?.id ?? 'eq';
          }
        }
        if (patch.fieldId && patch.fieldId !== c.fieldId) {
          const ops = getOperatorsForFieldId(patch.fieldId);
          if (!ops.some((o) => o.id === next.operator)) {
            next.operator = ops[0]?.id ?? 'eq';
          }
        }
        return next;
      })
    );
  };

  const removeCondition = (condId) => {
    onChange(conditions.filter((c) => c.id !== condId));
  };

  const addCondition = () => {
    if (!canAdd) return;
    onChange([...conditions, createEmptyVisibilityCondition(priorScreens)]);
  };

  if (!canAdd) {
    return null;
  }

  return (
    <div className="bg-[#f8f8f8] rounded-[8px] px-3 py-[10px] flex flex-col gap-[8px]">
      <span className="text-[10px] font-bold tracking-[0.55px] uppercase text-[#aaa]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        SHOW THIS BLOCK IF
      </span>

      {conditions.length === 0 ? (
        <p className="text-[11px] text-[#888] leading-snug" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          No conditions — block is always shown.
        </p>
      ) : (
        conditions.map((cond, idx) => {
          const sourceScreen = priorScreens.find((s) => s.id === Number(cond.sourceScreenId));
          const fieldOptions = getLogicFieldsForScreenLabel(sourceScreen?.label);
          const screenOptions = priorScreens.map((s) => ({
            id: String(s.id),
            label: s.name || s.label || `Screen ${s.id}`,
          }));

          return (
            <div key={cond.id} className="flex flex-col gap-1">
              {idx > 0 ? (
                <span className="text-[9px] font-semibold text-[#aaa] uppercase tracking-wide">AND</span>
              ) : null}
              <div className={`flex flex-col gap-[6px] ${compact ? '' : 'p-2 bg-white rounded-[6px] border border-[rgba(0,0,0,0.08)]'}`}>
                <LogicSelect
                  value={cond.sourceScreenId ?? ''}
                  onChange={(v) => updateCondition(cond.id, { sourceScreenId: Number(v) })}
                  options={screenOptions}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-[5px] items-center">
                  <LogicFieldPicker
                    value={cond.fieldId}
                    onChange={(v) => updateCondition(cond.id, { fieldId: v })}
                    options={fieldOptions}
                    className="flex-[1_1_90px] min-w-[90px]"
                  />
                  <LogicSelect
                    value={cond.operator}
                    onChange={(v) => updateCondition(cond.id, { operator: v })}
                    options={getOperatorsForFieldId(cond.fieldId)}
                    className="flex-[1_1_80px] min-w-[80px]"
                  />
                  <LogicValueInput
                    screens={screens}
                    sourceScreenId={cond.sourceScreenId}
                    fieldId={cond.fieldId}
                    operator={cond.operator}
                    value={cond.value}
                    onChange={(v) => updateCondition(cond.id, { value: v })}
                    selectClassName="bg-white border border-[rgba(0,0,0,0.12)] rounded-[6px] px-2 py-[6px] text-[11px] text-[#111] outline-none cursor-pointer min-w-0 flex-1"
                    inputClassName="bg-white border border-[rgba(0,0,0,0.12)] rounded-[6px] px-2 py-[6px] text-[11px] text-[#111] outline-none min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeCondition(cond.id)}
                    className="shrink-0 p-1 text-[#999] hover:text-[#c00] cursor-pointer transition-colors"
                    aria-label="Remove condition"
                  >
                    <RiDeleteBin6Line size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}

      <button
        type="button"
        onClick={addCondition}
        className="flex items-center gap-[5px] cursor-pointer hover:opacity-70 transition-opacity self-start"
      >
        <RiAddLine size={14} className="text-[#555] shrink-0" />
        <span className="text-[12px] text-[#555]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          Add condition
        </span>
      </button>
    </div>
  );
}
