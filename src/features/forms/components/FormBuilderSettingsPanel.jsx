import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiChat1Line,
  RiExternalLinkLine,
  RiInformationLine,
  RiLayoutGridLine,
  RiTimeLine,
  RiUpload2Line,
} from 'react-icons/ri';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import ManageIntegrationsModal from '@/features/forms/components/ManageIntegrationsModal';
import { clearBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import { useToast } from '@/hooks/useToast';
import { openDeleteModal } from '@/store/slices/uiSlice';

const SECTION_LABEL =
  'pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.7px] text-[#9b9b97]';

const ACCESS_SECTION_LABEL =
  'text-[10px] font-bold uppercase tracking-[1.3px] text-[#b0aea8]';

const CARD_CLASS = 'overflow-hidden rounded-[12px] border border-[#e4e3de] bg-white';

const ACCESS_CARD_CLASS = 'overflow-hidden rounded-[12px] border border-[#e5e4e0] bg-white';

const ROW_BORDER = 'border-b border-[#eeede9]';

const DANGER_BTN =
  'shrink-0 rounded-[6px] border border-[#f5c6c3] px-[13px] py-[6px] text-[12px] font-medium text-[#c0392b] transition-colors hover:bg-[#fce8e6]';

function SettingsRow({ icon: Icon, title, description, borderBottom = true, children }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-[14px] ${borderBottom ? ROW_BORDER : ''}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-[7px]">
          {Icon ? (
            <Icon size={15} className="mt-[2px] shrink-0 text-[#9b9b97]" aria-hidden />
          ) : null}
          <div className="min-w-0">
            <p className="text-[13px] font-medium leading-[19.5px] text-[#1a1a18]">{title}</p>
            {description ? (
              <p className="mt-0.5 text-[12px] leading-[16.8px] text-[#9b9b97]">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function AccessSecurityRow({ icon: Icon, title, description, borderTop = true, children }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 px-5 pb-4 pt-[17px] ${
        borderTop ? 'border-t border-[#e5e4e0]' : ''
      }`}
    >
      <div className="flex min-w-0 flex-1 gap-2.5">
        {Icon ? (
          <Icon size={14} className="mt-0.5 shrink-0 text-[#9b9b97]" aria-hidden />
        ) : null}
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold tracking-[-0.1px] text-[#0a0a0a]">{title}</p>
          {description ? (
            <p className="mt-px text-[12px] leading-[17.4px] text-[#6b6965]">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function SettingsToggle({ checked, onChange }) {
  return <ToggleSwitch checked={checked} onChange={onChange} variant="figma" />;
}

export default function FormBuilderSettingsPanel({
  settingsAutoAdvance,
  setSettingsAutoAdvance,
  settingsBackButton,
  setSettingsBackButton,
  settingsResubmission,
  setSettingsResubmission,
  settingsConfirmationEmail,
  setSettingsConfirmationEmail,
  settingsResponseLimit,
  setSettingsResponseLimit,
  settingsResponseLimitCount,
  setSettingsResponseLimitCount,
  onDiscardDraft,
  activeFormId,
  formTitle,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [manageIntegrationsOpen, setManageIntegrationsOpen] = useState(false);
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  const handleDeleteClick = () => {
    if (!activeFormId) return;
    dispatch(
      openDeleteModal({
        formId: activeFormId,
        formTitle: formTitle || 'Untitled form',
        redirectAfterDelete: true,
      })
    );
  };

  const confirmDiscard = () => {
    onDiscardDraft();
    if (activeFormId) {
      clearBuilderDraft(activeFormId);
    }
    setDiscardModalOpen(false);
    showToast({ type: 'success', message: 'Draft discarded' });
    navigate('/dashboard');
  };

  return (
    <>
      <div
        className="flex-1 overflow-y-auto bg-[#fafaf9]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="mx-auto max-w-[678px] px-6 py-5">
          <div className="flex flex-col gap-2.5">
            {/* FORM BEHAVIOR */}
            <section>
              <p className={SECTION_LABEL}>Form Behavior</p>
              <div className={CARD_CLASS}>
                <SettingsRow
                  icon={RiTimeLine}
                  title="Auto-advance on selection"
                  description="Move to next question automatically when a choice is clicked"
                >
                  <SettingsToggle
                    checked={settingsAutoAdvance}
                    onChange={setSettingsAutoAdvance}
                  />
                </SettingsRow>
                <SettingsRow
                  icon={RiArrowLeftLine}
                  title="Allow respondents to go back"
                  description="Show a back button so respondents can review previous answers"
                  borderBottom={false}
                >
                  <SettingsToggle checked={settingsBackButton} onChange={setSettingsBackButton} />
                </SettingsRow>
              </div>
            </section>

            {/* SUBMISSION */}
            <section>
              <p className={SECTION_LABEL}>Submission</p>
              <div className={CARD_CLASS}>
                <SettingsRow
                  icon={RiUpload2Line}
                  title="Allow re-submission"
                  description="Let the same respondent fill out the form more than once"
                >
                  <SettingsToggle checked={settingsResubmission} onChange={setSettingsResubmission} />
                </SettingsRow>
                <SettingsRow
                  icon={RiChat1Line}
                  title="Confirmation email"
                  description="Send an automatic confirmation to respondents after they submit"
                  borderBottom={false}
                >
                  <SettingsToggle
                    checked={settingsConfirmationEmail}
                    onChange={setSettingsConfirmationEmail}
                  />
                </SettingsRow>
              </div>
            </section>

            {/* ACCESS & SECURITY */}
            <section className="flex flex-col gap-2.5">
              <p className={ACCESS_SECTION_LABEL}>Access &amp; Security</p>
              <div className={ACCESS_CARD_CLASS}>
                <AccessSecurityRow
                  icon={RiInformationLine}
                  title="Response limit"
                  description="Close the form after a set number of responses"
                  borderTop={false}
                >
                  <SettingsToggle
                    checked={settingsResponseLimit}
                    onChange={setSettingsResponseLimit}
                  />
                  <input
                    type="number"
                    value={settingsResponseLimitCount}
                    onChange={(e) => setSettingsResponseLimitCount(e.target.value)}
                    disabled={!settingsResponseLimit}
                    className={`h-8 w-[60px] rounded-[7px] border border-[#e5e4e0] bg-[#f2f1ee] text-center text-[13px] focus:border-[#0a0a0a] focus:outline-none disabled:text-[#b0aea8] ${
                      settingsResponseLimit ? 'text-[#0a0a0a]' : 'text-[#b0aea8]'
                    }`}
                  />
                </AccessSecurityRow>
                <AccessSecurityRow
                  icon={RiLayoutGridLine}
                  title="Connect integrations"
                  description="Send responses to Zapier, Slack, Google Sheets, and more"
                >
                  <button
                    type="button"
                    onClick={() => setManageIntegrationsOpen(true)}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0a0a0a] transition-opacity hover:opacity-70"
                  >
                    Manage
                    <RiExternalLinkLine size={12} aria-hidden />
                  </button>
                </AccessSecurityRow>
              </div>
            </section>

            {/* DANGER ZONE */}
            <section>
              <div className="overflow-hidden rounded-[12px] border border-[#f5c6c3] bg-[#fdf2f1]">
                <div className="px-4 pb-1 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.7px] text-[#c0392b]">
                    Danger zone
                  </p>
                </div>
                <div
                  className={`flex items-center justify-between gap-4 px-4 py-3 ${ROW_BORDER} border-[#f5c6c3]`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-[13px] font-medium text-[#1a1a18]">Discard draft</p>
                    <p className="mt-0.5 text-[12px] leading-[16.8px] text-[#9b9b97]">
                      Remove all unsaved changes and reset to last published version
                    </p>
                  </div>
                  <button
                    type="button"
                    className={DANGER_BTN}
                    onClick={() => setDiscardModalOpen(true)}
                  >
                    Discard draft
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#1a1a18]">Delete form</p>
                    <p className="mt-0.5 text-[12px] leading-[16.8px] text-[#9b9b97]">
                      Permanently delete this form and all its responses. Cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={DANGER_BTN}
                    onClick={handleDeleteClick}
                    disabled={!activeFormId}
                    title={activeFormId ? undefined : 'Save the form first to enable deletion'}
                  >
                    Delete form
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <ManageIntegrationsModal
        open={manageIntegrationsOpen}
        onClose={() => setManageIntegrationsOpen(false)}
      />

      <ConfirmActionModal
        open={discardModalOpen}
        onCancel={() => setDiscardModalOpen(false)}
        onConfirm={confirmDiscard}
        title="Discard draft?"
        warning="All unsaved changes will be removed and the form will reset to the last published version."
        confirmLabel="Discard draft"
        confirmClassName="border border-[#f5c6c3] bg-white text-[#c0392b] hover:bg-[#fce8e6]"
        headerIconClass="bg-[#fdf2f1] text-[#c0392b]"
        widthClass="w-[min(100%,420px)]"
      />
    </>
  );
}
