/** Shared on/off switch — light grey track when off, green when on (no black fill). */
export const TOGGLE_TRACK_ON = '#2a9d6e';
export const TOGGLE_TRACK_OFF = '#e4e2dc';

export const toggleTrackClassName = (on, variant = 'default') => {
  if (variant === 'figma') return on ? 'bg-[#1a1a18]' : 'bg-[#d1d0cb]';
  return on ? 'bg-[#2a9d6e]' : 'bg-[#e4e2dc]';
};

const ToggleSwitch = ({ checked, onChange, className = '', size = 'md', variant = 'default' }) => {
  const dims =
    size === 'sm'
      ? { track: 'w-[28px] h-[16px]', knob: 'w-[12px] h-[12px]', onX: 'translate-x-[14px]', offX: 'translate-x-[2px]' }
      : { track: 'w-[34px] h-[20px]', knob: 'w-[14px] h-[14px]', onX: 'translate-x-[16px]', offX: 'translate-x-[3px]' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors cursor-pointer focus:outline-none appearance-none border-0 p-0 ${dims.track} ${toggleTrackClassName(checked, variant)} ${className}`}
    >
      <span
        className={`absolute ${dims.knob} bg-white rounded-full transition-transform ${checked ? dims.onX : dims.offX}`}
      />
    </button>
  );
};

export default ToggleSwitch;
