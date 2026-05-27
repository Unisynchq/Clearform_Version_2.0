import { RiAddLine } from 'react-icons/ri';

const outlineBtnClass =
  'rounded-[6px] border border-[#e8e8e6] bg-white px-[15px] py-2 text-[13px] font-medium text-[#1a1a18] hover:bg-[#f7f7f6] transition-colors';

const disconnectBtnClass =
  'rounded-[6px] px-[15px] py-2 text-[13px] font-medium text-[#c53030] hover:bg-[#fff5f5] transition-colors';

const connectBtnClass =
  'inline-flex items-center gap-1.5 rounded-[6px] bg-[#1a1a18] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors';

const StatusBadge = ({ connected }) =>
  connected ? (
    <span className="inline-flex items-center gap-[5px] rounded-[4px] border border-[#c6f0d8] bg-[#f7f7f6] px-2.5 py-1 text-[11.5px] font-medium text-[#2e7d52]">
      <span className="size-[6px] shrink-0 rounded-[3px] bg-[#2e7d52]" aria-hidden />
      Connected
    </span>
  ) : (
    <span className="inline-flex items-center rounded-[4px] border border-[#e8e8e6] bg-[#f7f7f6] px-2.5 py-1 text-[11.5px] font-medium text-[#9e9e9a]">
      Not connected
    </span>
  );

/**
 * Single integration row — shared by profile settings and topbar panel.
 */
const IntegrationAppRow = ({
  icon,
  iconClassName,
  title,
  description,
  connected,
  onConnect,
  onConfigure,
  onDisconnect,
  compact = false,
}) => (
  <div
    className={`flex flex-wrap items-center gap-4 border-b border-[#f0f0ee] last:border-b-0 ${
      compact ? 'px-4 py-3.5' : 'px-7 py-[18px]'
    }`}
  >
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <div
        className={`flex size-[42px] shrink-0 items-center justify-center rounded-[10px] border p-px ${iconClassName}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-[#1a1a18]">{title}</p>
        <p className="mt-0.5 text-[12.5px] text-[#6b6b68]">{description}</p>
      </div>
    </div>

    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
      <StatusBadge connected={connected} />
      {connected ? (
        <>
          <button type="button" className={outlineBtnClass} onClick={onConfigure}>
            Configure
          </button>
          <button type="button" className={disconnectBtnClass} onClick={onDisconnect}>
            Disconnect
          </button>
        </>
      ) : (
        <button type="button" className={connectBtnClass} onClick={onConnect}>
          <RiAddLine size={12} aria-hidden />
          Connect
        </button>
      )}
    </div>
  </div>
);

export default IntegrationAppRow;
