import * as RadixSelect from '@radix-ui/react-select';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

const triggerBase =
  'inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[#e9e7e0] bg-white px-[11px] py-[7px] text-left text-[13px] text-[#17160e] shadow-none transition-[border-color,box-shadow] appearance-none cursor-pointer outline-none focus:outline-none focus-visible:border-[#4b43b0] focus-visible:ring-2 focus-visible:ring-[#4b43b0]/15 disabled:cursor-not-allowed disabled:opacity-50';

const contentBase =
  'z-[600] overflow-hidden rounded-[8px] border border-[#ebeae6] bg-white p-1 shadow-[0_10px_30px_rgba(0,0,0,0.1)] will-change-[transform,opacity] data-[state=open]:animate-select-in data-[state=closed]:animate-select-out';

const itemBase =
  'relative flex w-full cursor-pointer select-none items-center rounded-[6px] py-1.5 pl-8 pr-2.5 text-[13px] leading-snug text-[#17160e] outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-[rgba(0,0,0,0.045)] data-[highlighted]:outline-none';

/**
 * Portal-based select (Radix) — matches settings inputs; menu is never clipped by overflow parents.
 *
 * @param {{ value: string, onValueChange: (v: string) => void, options: { value: string, label?: string }[], placeholder?: string, disabled?: boolean, triggerClassName?: string, className?: string, id?: string, 'aria-label'?: string }} props
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  triggerClassName = '',
  className = '',
  id,
  'aria-label': ariaLabel,
}) {
  return (
    <div className={className}>
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={id}
          aria-label={ariaLabel}
          className={`group ${triggerBase} ${triggerClassName}`}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon asChild>
            <RiArrowDownSLine
              size={16}
              className="shrink-0 text-[#8e8c86] transition-transform duration-200 group-data-[state=open]:rotate-180"
              aria-hidden
            />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={contentBase}
            position="popper"
            sideOffset={6}
            align="start"
            collisionPadding={12}
          >
            <RadixSelect.Viewport className="max-h-[min(280px,var(--radix-select-content-available-height))] w-full min-w-[var(--radix-select-trigger-width)]">
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label ?? opt.value}
                </SelectItem>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}

function SelectItem({ value, children }) {
  return (
    <RadixSelect.Item value={value} className={itemBase}>
      <span className="absolute left-2 flex size-4 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <RiCheckLine size={14} className="text-[#4b43b0]" aria-hidden />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

export default Select;
