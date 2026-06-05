import { RiAddLine, RiLayoutGridLine } from 'react-icons/ri';
import HooksIcon from '@/features/forms/components/icons/HooksIcon';
import sheetsIcon from '@/assets/Icons/sheets.svg';
import googleDriveIcon from '@/assets/Icons/google-drive.svg';
import slackIcon from '@/assets/Icons/slack.svg';

const PANEL_CLASS =
  'w-[224px] rounded-[12px] border border-[rgba(81,76,84,0.15)] bg-white shadow-[0_4px_18px_rgba(0,0,0,0.06)]';

const TILE_CLASS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#e8e6e1] bg-white transition-colors hover:border-[#d4d2cc] hover:bg-[#faf9f7] cursor-pointer';

const AssetIcon = ({ src, className = 'size-4' }) => (
  <img src={src} alt="" className={`object-contain ${className}`} aria-hidden />
);

const AddTileButton = ({ label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={TILE_CLASS}
    aria-label={label}
  >
    <RiAddLine size={16} className="text-[#8a8880]" aria-hidden />
  </button>
);

const LogicCanvasIntegratePanel = ({
  onOpenSheets,
  onOpenDrive,
  onOpenSlack,
  onAddIntegration,
}) => (
  <div className={PANEL_CLASS}>
    <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
      <RiLayoutGridLine size={16} className="shrink-0 text-[#1a1a1a]" aria-hidden />
      <h3 className="text-[13px] font-semibold leading-none text-[#1a1a1a]">Integrate</h3>
    </div>
    <div className="flex items-center gap-2 px-4 pb-4">
      <button type="button" className={TILE_CLASS} aria-label="Google Sheets" onClick={onOpenSheets}>
        <AssetIcon src={sheetsIcon} />
      </button>
      <button type="button" className={TILE_CLASS} aria-label="Google Drive" onClick={onOpenDrive}>
        <AssetIcon src={googleDriveIcon} />
      </button>
      <button type="button" className={TILE_CLASS} aria-label="Slack" onClick={onOpenSlack}>
        <AssetIcon src={slackIcon} />
      </button>
      <AddTileButton label="Add integration" onClick={onAddIntegration} />
    </div>
  </div>
);

const LogicCanvasWebhooksPanel = ({ onAddWebhook }) => (
  <div className={PANEL_CLASS}>
    <div className="flex items-center gap-2 px-4 pt-3.5 pb-1.5">
      <HooksIcon />
      <h3 className="text-[13px] font-semibold leading-none text-[#1a1a1a]">Webhooks</h3>
    </div>
    <p className="px-4 pb-3 text-[11.5px] font-normal leading-[16px] text-[#7a7a72]">
      Connect with any app to send responses or trigger actions.
    </p>
    <div className="px-4 pb-4">
      <AddTileButton label="Add webhook" onClick={onAddWebhook} />
    </div>
  </div>
);

/**
 * Fixed overlay on the logic canvas viewport — stays at 1:1 scale while the board pans/zooms.
 */
const LogicCanvasActionsPanel = ({
  onOpenSheets,
  onOpenDrive,
  onOpenSlack,
  onAddIntegration,
  onAddWebhook,
}) => (
  <div
    className="pointer-events-none absolute right-4 top-4 z-20 flex w-[224px] flex-col gap-2.5"
    style={{ fontFamily: "'DM Sans', sans-serif" }}
    aria-label="Logic canvas actions"
  >
    <p className="pointer-events-none text-[10px] font-semibold uppercase tracking-[0.7px] text-[#a0a09c]">
      Actions
    </p>
    <div className="pointer-events-auto flex flex-col gap-2.5">
      <LogicCanvasIntegratePanel
        onOpenSheets={onOpenSheets}
        onOpenDrive={onOpenDrive}
        onOpenSlack={onOpenSlack}
        onAddIntegration={onAddIntegration}
      />
      <LogicCanvasWebhooksPanel onAddWebhook={onAddWebhook} />
    </div>
  </div>
);

export default LogicCanvasActionsPanel;
