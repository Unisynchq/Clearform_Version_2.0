import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DiscardChangesModal from '../components/profile/DiscardChangesModal';
import ProfileSettingsShell from '../components/profile/ProfileSettingsShell';
import ProfileAccountTab from '../components/profile/ProfileAccountTab';
import ProfileSecurityTab from '../components/profile/ProfileSecurityTab';
import ProfileNotificationsTab from '../components/profile/ProfileNotificationsTab';
import ProfileIntegrationsTab from '../components/profile/ProfileIntegrationsTab';
import { PROFILE_TABS } from '../components/profile/profileSettingsConfig';

const TAB_IDS = new Set(PROFILE_TABS.map((t) => t.id));

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') ?? 'profile';
  const activeTab = TAB_IDS.has(tabParam) ? tabParam : 'profile';

  const [isDirty, setIsDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const discardFnRef = useRef(null);

  const applyTab = useCallback(
    (id) => {
      setSearchParams(id === 'profile' ? {} : { tab: id }, { replace: true });
    },
    [setSearchParams],
  );

  const setTab = useCallback(
    (id) => {
      if (isDirty && id !== activeTab) {
        setPendingTab(id);
        setDiscardOpen(true);
        return;
      }
      applyTab(id);
    },
    [activeTab, applyTab, isDirty],
  );

  const onRequestDiscard = useCallback((resetFn) => {
    discardFnRef.current = resetFn;
    setDiscardOpen(true);
  }, []);

  const handleKeepEditing = () => {
    discardFnRef.current = null;
    setPendingTab(null);
    setDiscardOpen(false);
  };

  const handleDiscard = () => {
    discardFnRef.current?.();
    discardFnRef.current = null;
    setIsDirty(false);
    setDiscardOpen(false);
    if (pendingTab) {
      applyTab(pendingTab);
      setPendingTab(null);
    }
  };

  const content = useMemo(() => {
    switch (activeTab) {
      case 'security':
        return <ProfileSecurityTab onDirtyChange={setIsDirty} />;
      case 'notifications':
        return <ProfileNotificationsTab />;
      case 'integrations':
        return <ProfileIntegrationsTab />;
      default:
        return (
          <ProfileAccountTab onDirtyChange={setIsDirty} onRequestDiscard={onRequestDiscard} />
        );
    }
  }, [activeTab, onRequestDiscard]);

  return (
    <div className="min-h-full w-full bg-[#f5f4f0]">
      <ProfileSettingsShell activeTab={activeTab} onTabChange={setTab}>
        <div key={activeTab}>{content}</div>
      </ProfileSettingsShell>
      <DiscardChangesModal
        open={discardOpen}
        onDiscard={handleDiscard}
        onKeepEditing={handleKeepEditing}
      />
    </div>
  );
}
