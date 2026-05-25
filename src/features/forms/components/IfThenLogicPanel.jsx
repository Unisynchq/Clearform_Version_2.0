import { useMemo, useState } from 'react';
import { RiAddLine, RiCloseLine, RiDeleteBin6Line } from 'react-icons/ri';
import LogicFieldPicker from '@/features/forms/components/LogicFieldPicker';
import LogicScreenPicker from '@/features/forms/components/LogicScreenPicker';
import { getLogicFieldById, findLogicQuestionOption, parseLogicQuestionKey, logicQuestionKey } from '@/features/forms/constants/logicFieldCatalog';
import {
  getOperatorsForFieldId,
  isNumericFieldId,
  validateIfThenDraft,
} from '@/features/forms/utils/logicEngine';

const operatorSymbol = (id) => {
  const map = {
    gt: '>',
    lt: '<',
    eq: '=',
    neq: '≠',
    gte: '≥',
    lte: '≤',
    contains: 'contains',
    not_contains: 'does not contain',
    includes: 'includes',
    not_includes: 'does not include',
    is_empty: 'is empty',
    is_not_empty: 'is not empty',
  };
  return map[id] ?? id;
};

const createEmptyCondition = (questionOptions = []) => {
  const first = questionOptions[0];
  const fieldId = first?.fieldId ?? '';
  const ops = getOperatorsForFieldId(fieldId);
  return {
    id: `cond-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceScreenId: first?.sourceScreenId ?? null,
    fieldId,
    operator: ops[0]?.id ?? 'eq',
    value: '',
  };
};

export const createEmptyRule = (questionOptions = []) => ({
  id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  conditions: [createEmptyCondition(questionOptions)],
  thenScreenId: null,
});

const conditionPickerValue = (cond, questionOptions) => {
  if (cond?.sourceScreenId != null && cond?.fieldId) {
    return logicQuestionKey(cond.sourceScreenId, cond.fieldId);
  }
  const match = questionOptions.find((o) => o.fieldId === cond?.fieldId);
  return match?.id ?? questionOptions[0]?.id ?? '';
};

const LogicSelect = ({ value, onChange, options, className = '' }) => (
  <select
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className={`bg-white border border-[#e4e4e7] rounded-[5px] px-[9px] py-[6px] text-[12px] text-[#18181b] outline-none cursor-pointer min-w-0 ${className}`}
    style={{ fontFamily: "'DM Sans', sans-serif" }}
  >
    {options.map((opt) => (
      <option key={opt.id} value={opt.id}>
        {opt.label}
      </option>
    ))}
  </select>
);

const LogicValueInput = ({ fieldId, operator, value, onChange, className = '' }) => {
  const hideValue = operator === 'is_empty' || operator === 'is_not_empty';
  if (hideValue) {
    return <span className={`text-[11px] text-[#a1a1aa] px-1 ${className}`}>—</span>;
  }

  const numeric = isNumericFieldId(fieldId);
  return (
    <input
      type={numeric ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={numeric ? '0' : '…'}
      className={`bg-white border border-[#e4e4e7] rounded-[5px] px-[9px] py-[6px] text-[12px] text-[#18181b] outline-none min-w-0 ${className}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    />
  );
};

const IfThenLogicPanel = ({
  screenSubtitle,
  /** All question cards in the form (sidebar list) — one option per card */
  questionOptions = [],
  destinationOptions,
  draft,
  onDraftChange,
  onClose,
  onCancel,
  onSave,
}) => {
  const [validationErrors, setValidationErrors] = useState([]);

  const previewLines = useMemo(() => {
    const questionLabel = (cond) => {
      const opt = findLogicQuestionOption(questionOptions, cond.sourceScreenId, cond.fieldId);
      if (opt) return opt.label;
      if (cond.fieldId) return getLogicFieldById(cond.fieldId)?.label ?? 'Question';
      return 'Question';
    };
    const destLabel = (id) => destinationOptions.find((d) => Number(d.id) === Number(id))?.label ?? '…';
    const destColor = (idx) => (idx === 0 ? '#3b5bdb' : idx === 1 ? '#16a34a' : '#7c3aed');

    const ruleLines = (draft.rules ?? []).map((rule, ruleIdx) => {
      const conditions = rule.conditions ?? [];
      if (!conditions.length) return null;
      const condText = conditions
        .map((cond) => {
          const op = operatorSymbol(cond.operator);
          const val =
            cond.operator === 'is_empty' || cond.operator === 'is_not_empty'
              ? ''
              : ` ${cond.value || '…'}`;
          return `${questionLabel(cond)} ${op}${val}`;
        })
        .join(' AND ');
      const dest = destLabel(rule.thenScreenId);
      return {
        key: rule.id,
        parts: [
          { text: 'If ', bold: false },
          { text: `${condText} → `, bold: false },
          { text: dest, bold: true, color: destColor(ruleIdx) },
        ],
      };
    });

    const elseDest = destLabel(draft.elseScreenId);
    return {
      rules: ruleLines.filter(Boolean),
      elseLine: {
        parts: [
          { text: 'Else', bold: false },
          { text: ` → ${elseDest}`, bold: false },
        ],
      },
    };
  }, [draft, questionOptions, destinationOptions]);

  const updateRule = (ruleId, patch) => {
    onDraftChange({
      ...draft,
      rules: draft.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
    });
  };

  const updateCondition = (ruleId, condId, patch) => {
    onDraftChange({
      ...draft,
      rules: draft.rules.map((r) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          conditions: r.conditions.map((c) => {
            if (c.id !== condId) return c;
            const next = { ...c, ...patch };
            if (patch.fieldId && typeof patch.fieldId === 'string' && patch.fieldId.includes(':')) {
              const { sourceScreenId, fieldId } = parseLogicQuestionKey(patch.fieldId);
              next.sourceScreenId = sourceScreenId;
              next.fieldId = fieldId;
            }
            if (patch.fieldId && patch.fieldId !== c.fieldId && !String(patch.fieldId).includes(':')) {
              const ops = getOperatorsForFieldId(patch.fieldId);
              if (!ops.some((o) => o.id === next.operator)) {
                next.operator = ops[0]?.id ?? 'eq';
              }
            }
            if (patch.sourceScreenId != null || (patch.fieldId && !String(patch.fieldId).includes(':'))) {
              const ops = getOperatorsForFieldId(next.fieldId);
              if (!ops.some((o) => o.id === next.operator)) {
                next.operator = ops[0]?.id ?? 'eq';
              }
            }
            return next;
          }),
        };
      }),
    });
  };

  const addConditionToRule = (ruleId) => {
    onDraftChange({
      ...draft,
      rules: draft.rules.map((r) =>
        r.id === ruleId
          ? { ...r, conditions: [...r.conditions, createEmptyCondition(questionOptions)] }
          : r
      ),
    });
  };

  const addRule = () => {
    const lastThen = draft.rules[draft.rules.length - 1]?.thenScreenId ?? null;
    onDraftChange({
      ...draft,
      rules: [...draft.rules, { ...createEmptyRule(questionOptions), thenScreenId: lastThen }],
    });
  };

  const removeCondition = (ruleId, condId) => {
    onDraftChange({
      ...draft,
      rules: draft.rules.map((r) => {
        if (r.id !== ruleId || r.conditions.length <= 1) return r;
        return { ...r, conditions: r.conditions.filter((c) => c.id !== condId) };
      }),
    });
  };

  const removeRule = (ruleId) => {
    if ((draft.rules ?? []).length <= 1) return;
    onDraftChange({
      ...draft,
      rules: draft.rules.filter((r) => r.id !== ruleId),
    });
  };

  const handleSaveClick = () => {
    const errors = validateIfThenDraft(draft, destinationOptions);
    setValidationErrors(errors);
    if (errors.length) return;
    setValidationErrors([]);
    onSave();
  };

  return (
    <div
      className="relative z-[1] w-[320px] h-full bg-white border-l border-[#e4e4e7] flex flex-col"
      style={{ boxShadow: '-8px 0 24px rgba(0,0,0,0.12)', fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="border-b border-[#e4e4e7] shrink-0">
        <div className="flex items-center justify-between px-4 pt-[14px] pb-[15px]">
          <div className="flex flex-col gap-px min-w-0">
            <h2 className="text-[14px] font-bold text-[#18181b] leading-normal">If / Then Logic</h2>
            <p className="text-[11px] text-[#7c3aed] leading-normal truncate">{screenSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-6 shrink-0 items-center justify-center rounded-[5px] text-[#a1a1aa] hover:bg-[#f4f4f5] cursor-pointer transition-colors"
            aria-label="Close panel"
          >
            <RiCloseLine size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-visible px-4 py-[14px] flex flex-col gap-4">
        {validationErrors.length > 0 ? (
          <div className="rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[11px] text-[#b91c1c]">
            {validationErrors.map((err, i) => (
              <p key={i} className="mb-0 leading-snug">
                {err}
              </p>
            ))}
          </div>
        ) : null}

        {questionOptions.length === 0 ? (
          <div className="rounded-[6px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[11px] text-[#92400e] leading-snug">
            Add at least one question card to the form before setting If / Then conditions.
          </div>
        ) : null}

        {(draft.rules ?? []).map((rule, ruleIndex) => (
          <div key={rule.id} className="flex flex-col gap-[7px]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold tracking-[0.7px] uppercase text-[#a1a1aa]">
                RULE {ruleIndex + 1} — CONDITION
              </p>
              {(draft.rules ?? []).length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  className="shrink-0 p-0.5 text-[#a1a1aa] hover:text-[#dc2626] cursor-pointer transition-colors"
                  aria-label={`Delete rule ${ruleIndex + 1}`}
                >
                  <RiDeleteBin6Line size={14} />
                </button>
              ) : null}
            </div>

            <div className="bg-[#f5f5f4] border border-[#e4e4e7] rounded-[6px] px-[11px] pt-[11px] pb-[19px] flex flex-col gap-2 overflow-visible">
              {rule.conditions.map((cond, condIdx) => (
                <div key={cond.id} className="flex flex-col gap-1 w-full">
                  {condIdx > 0 ? (
                    <span className="text-[10px] font-semibold text-[#a1a1aa] uppercase tracking-wide pl-0.5">
                      AND
                    </span>
                  ) : null}
                  <div className="flex gap-[6px] items-start flex-wrap">
                    <LogicFieldPicker
                      value={conditionPickerValue(cond, questionOptions)}
                      onChange={(v) => updateCondition(rule.id, cond.id, { fieldId: v })}
                      options={questionOptions}
                      className="flex-[1_1_140px] max-w-[180px] z-[1]"
                    />
                    <LogicSelect
                      value={cond.operator}
                      onChange={(v) => updateCondition(rule.id, cond.id, { operator: v })}
                      options={getOperatorsForFieldId(cond.fieldId)}
                      className="flex-[1_1_100px] max-w-[130px]"
                    />
                    <LogicValueInput
                      fieldId={cond.fieldId}
                      operator={cond.operator}
                      value={cond.value}
                      onChange={(v) => updateCondition(rule.id, cond.id, { value: v })}
                      className="w-[52px] shrink-0"
                    />
                    {rule.conditions.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeCondition(rule.id, cond.id)}
                        className="shrink-0 p-1 text-[#a1a1aa] hover:text-[#dc2626] cursor-pointer transition-colors self-center"
                        aria-label="Remove condition"
                      >
                        <RiDeleteBin6Line size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}

              <div className="flex gap-[6px] items-center">
                <span className="text-[11px] text-[#71717a] shrink-0 whitespace-nowrap">Then go to</span>
                <LogicScreenPicker
                  value={rule.thenScreenId}
                  onChange={(v) => updateRule(rule.id, { thenScreenId: v })}
                  options={destinationOptions}
                  placeholder="Select screen…"
                  className="flex-1 min-w-0 z-[1]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => addConditionToRule(rule.id)}
              className="w-full border border-dashed border-[#e4e4e7] rounded-[6px] py-[8px] px-[11px] text-[12px] font-medium text-[#71717a] hover:bg-[#fafaf9] cursor-pointer transition-colors text-center"
            >
              + Add condition
            </button>
          </div>
        ))}

        <div className="flex flex-col gap-[7px]">
          <p className="text-[10px] font-bold tracking-[0.7px] uppercase text-[#a1a1aa]">ELSE (FALLBACK)</p>
          <div className="bg-[#f5f5f4] border border-[#e4e4e7] rounded-[6px] p-[11px] overflow-visible">
            <div className="flex gap-[6px] items-center w-full">
              <span className="text-[11px] text-[#71717a] shrink-0 whitespace-nowrap">If none match, go to</span>
              <LogicScreenPicker
                value={draft.elseScreenId}
                onChange={(v) => onDraftChange({ ...draft, elseScreenId: v })}
                options={destinationOptions}
                className="flex-1 min-w-0 z-[1]"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={addRule}
          className="w-full border border-dashed border-[#e4e4e7] rounded-[6px] py-[7px] px-[11px] flex items-center justify-center gap-[5px] text-[12px] font-medium text-[#71717a] hover:bg-[#fafaf9] cursor-pointer transition-colors"
        >
          <RiAddLine size={12} aria-hidden />
          Add rule
        </button>

        <div className="bg-[#f5f3ff] border border-[#ddd6fe] rounded-[6px] p-[11px] flex flex-col gap-2">
          <p className="text-[10px] font-bold tracking-[0.6px] uppercase text-[#7c3aed]">LOGIC PREVIEW</p>
          <div className="text-[11.5px] leading-[19.55px] text-[#374151]">
            {previewLines.rules.map((line) => (
              <p key={line.key} className="mb-0">
                {line.parts.map((part, i) => (
                  <span
                    key={i}
                    className={part.bold ? 'font-medium' : 'font-normal'}
                    style={part.color ? { color: part.color } : undefined}
                  >
                    {part.text}
                  </span>
                ))}
              </p>
            ))}
            <p className="mb-0">
              {previewLines.elseLine.parts.map((part, i) => (
                <span key={i} className={part.bold ? 'font-medium' : 'font-normal'}>
                  {part.text}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#e4e4e7] shrink-0 px-4 pt-[13px] pb-3 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-[6px] border border-[#e4e4e7] px-[15px] py-[9px] text-[13px] font-medium text-[#71717a] hover:bg-[#fafaf9] cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          className="flex-1 min-w-0 rounded-[6px] bg-[#18181b] px-2 py-[9px] text-[13px] font-semibold text-white hover:bg-[#27272a] cursor-pointer transition-colors"
        >
          Save Logic
        </button>
      </div>
    </div>
  );
};

export default IfThenLogicPanel;
