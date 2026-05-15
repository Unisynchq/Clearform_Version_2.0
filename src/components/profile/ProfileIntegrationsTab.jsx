import { RiAddLine, RiFileExcel2Line, RiWebhookLine } from 'react-icons/ri';
import {
  CardHeader,
  IntegrationRow,
  OutlineButton,
  PrimaryButton,
  SettingsCard,
  StatusBadge,
  TextLinkButton,
} from './ProfileSettingsUi';
import {
  GoogleSheetsConfigureModal,
  GoogleSheetsConnectModal,
  GoogleSheetsConnectingModal,
  GoogleSheetsFailedModal,
  useGoogleSheetsFlow,
} from './GoogleSheetsModals';

export default function ProfileIntegrationsTab() {
  const sheets = useGoogleSheetsFlow();

  return (
    <>
      <SettingsCard className="pt-3">
        <CardHeader title="Connected apps" subtitle="Apps currently linked to your Clearform account" />
        <IntegrationRow
          icon={RiWebhookLine}
          iconWrapClass="border-[#fdba74] bg-[#fff7ed] text-[#ea580c]"
          title="Webhook"
          description="Push responses to an endpoint"
          actions={
            <>
              <StatusBadge label="Connected" />
              <OutlineButton className="px-[15px] py-2">Configure</OutlineButton>
              <TextLinkButton className="px-[15px] py-2">Disconnect</TextLinkButton>
            </>
          }
        />
        <IntegrationRow
          icon={RiFileExcel2Line}
          iconWrapClass="border-[#bbf7d0] bg-[#f7f7f6] text-[#34a853]"
          title="Google Sheets"
          description="Auto-sync responses to a spreadsheet in real time"
          actions={
            sheets.connected ? (
              <>
                <StatusBadge label="Connected" />
                <OutlineButton className="px-[15px] py-2" onClick={sheets.openConfigure}>
                  Configure
                </OutlineButton>
                <TextLinkButton className="px-[15px] py-2" onClick={sheets.disconnect}>
                  Disconnect
                </TextLinkButton>
              </>
            ) : (
              <>
                <StatusBadge label="Not connected" variant="muted" />
                <PrimaryButton type="button" icon={RiAddLine} className="px-4 py-2 text-[13px]" onClick={sheets.startConnect}>
                  Connect
                </PrimaryButton>
              </>
            )
          }
        />
      </SettingsCard>

      <GoogleSheetsConnectModal
        open={sheets.modal === 'connect'}
        onClose={sheets.closeModal}
        onConnect={sheets.confirmConnect}
      />
      <GoogleSheetsConnectingModal open={sheets.modal === 'connecting'} />
      <GoogleSheetsConfigureModal
        open={sheets.modal === 'configure'}
        onClose={sheets.closeModal}
        onSave={sheets.saveConfigure}
      />
      <GoogleSheetsFailedModal
        open={sheets.modal === 'failed'}
        onClose={sheets.closeModal}
        onRetry={sheets.retry}
      />
    </>
  );
}
