import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  RiLayoutGridLine,
  RiAddLine,
  RiLayoutMasonryLine,
  RiBarChartLine,
  RiQuestionLine,
  RiArrowLeftSLine,
} from 'react-icons/ri';
import {
  setActiveWorkspace,
  selectNavWorkspaces,
  selectTotalFormCount,
} from '@/store/slices/formsSlice';
import { readProfileSettings } from '@/features/profile/utils/profileSettingsStorage';
import { openCreateWorkspaceModal, openWorkspaceContextMenu } from '@/store/slices/uiSlice';
import clearformLogo from '@/assets/clearform-high-resolution-logo-transparent.png';
import clearformLogoIcon from '@/assets/clearform-high-resolution-logo-transparent (1).png';
import SidebarSkeleton from './SidebarSkeleton';

const getProfileDisplay = ({ firstName, lastName, email, displayName: savedName }) => {
  const saved = savedName?.trim();
  if (saved) return { displayName: saved, initials: saved.slice(0, 2).toUpperCase() };
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (name) return { displayName: name, initials: name.slice(0, 2).toUpperCase() };
  const local = email?.split('@')[0]?.trim();
  if (local) {
    return {
      displayName: local,
      initials: local.slice(0, 2).toUpperCase(),
    };
  }
  return { displayName: 'Profile', initials: '?' };
};

const ProfileFooter = ({ expanded, active, displayName, initials, email, onClick }) => {
  if (!expanded) {
    return (
      <motion.button
        type="button"
        title={displayName}
        onClick={onClick}
        whileHover={{ backgroundColor: '#eceae4' }}
        className={`flex w-full items-center justify-center rounded-[6px] px-2 py-[7px] transition-colors ${
          active ? 'bg-[#eceae4]' : ''
        }`}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e5e3dc]">
          <span className="text-[10px] font-semibold text-[#1a1a1c]">{initials}</span>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ backgroundColor: active ? '#ebe8e0' : '#f4f3ef' }}
      className={`mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
        active ? 'bg-[#f4f3ef]' : ''
      }`}
      title={email}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e5e3dc]">
        <span className="text-[11px] font-semibold tracking-[0.2px] text-[#1a1a1c]">
          {initials}
        </span>
      </div>
      <div className="min-w-0 flex flex-col">
        <span className="truncate text-[13px] font-medium leading-[18px] text-[#1a1a1c]">
          {displayName}
        </span>
        {email ? (
          <span className="truncate text-[11px] leading-[16px] text-[#a8a6a0]">{email}</span>
        ) : null}
      </div>
    </motion.button>
  );
};

const NavItem = ({ icon: Icon, label, badge, active, onClick }) => (
  <motion.button
    whileHover={{ backgroundColor: '#f4f3ef' }}
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer transition-colors ${
      active ? 'bg-[#f4f3ef] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : ''
    }`}
  >
    <div className="flex items-center gap-2">
      {Icon && <Icon size={16} className="text-[#6b6966] shrink-0" />}
      <span
        className={`text-[13px] font-medium leading-[19.5px] ${
          active ? 'text-[#1a1a1c]' : 'text-[#6b6966]'
        }`}
      >
        {label}
      </span>
    </div>
    {badge !== undefined && (
      <span className="text-[12px] font-medium text-[#a8a6a0] leading-[18px]">
        {badge}
      </span>
    )}
  </motion.button>
);

const WorkspaceItem = ({ workspace, active, onClick, onContextMenu }) => (
  <motion.button
    whileHover={{ backgroundColor: '#f4f3ef' }}
    onClick={onClick}
    onContextMenu={onContextMenu}
    className={`w-full flex items-center justify-between px-4 py-2 rounded-lg cursor-pointer transition-colors ${
      active ? 'bg-[#f4f3ef] shadow-[0_1px_3px_rgba(0,0,0,0.08)]' : ''
    }`}
  >
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-[4px] shrink-0"
        style={{ backgroundColor: workspace.color }}
      />
      <span className={`text-[13px] font-medium leading-[19.5px] ${
        active ? 'text-[#1a1a1c]' : 'text-[#6b6966]'
      }`}>
        {workspace.label}
      </span>
    </div>
    {typeof workspace.count === 'number' && workspace.count > 0 ? (
      <span className="text-[12px] font-medium text-[#a8a6a0] leading-[18px]">
        {workspace.count}
      </span>
    ) : null}
  </motion.button>
);

const CollapsedIconBtn = ({ icon: Icon, active, onClick, title }) => (
  <motion.button
    whileHover={{ backgroundColor: '#eceae4' }}
    onClick={onClick}
    title={title}
    className="w-full flex items-center justify-center px-2 py-[7px] rounded-[6px] transition-colors"
  >
    <div className={`p-[3px] rounded-[4px] transition-colors ${active ? 'bg-[#d8d8d8]' : ''}`}>
      <Icon size={16} className="text-[#6b6966]" />
    </div>
  </motion.button>
);

/** Help & Support — matches Figma footer row: muted label, full-width pill when active. */
const HelpSupportNavButton = ({ expanded, active, onClick }) => {
  if (!expanded) {
    return (
      <CollapsedIconBtn
        icon={RiQuestionLine}
        active={active}
        title="Help & Support"
        onClick={onClick}
      />
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ backgroundColor: active ? '#ebe8e0' : '#f4f3ef' }}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
        active ? 'bg-[#f4f3ef]' : ''
      }`}
    >
      <RiQuestionLine size={16} className="text-[#6b6966] shrink-0" />
      <span className="text-[13px] font-medium text-[#6b6966] leading-[19.5px]">
        Help & Support
      </span>
    </motion.button>
  );
};

const Sidebar = ({ hideLogo = false, exit }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { firstName, lastName, email } = useSelector((s) => s.auth);
  const savedProfile = readProfileSettings(email);
  const profile = getProfileDisplay({
    firstName,
    lastName,
    email,
    displayName: savedProfile?.displayName,
  });
  const { activeWorkspace, isLoading: formsLoading } = useSelector((state) => state.forms);
  const workspaces = useSelector(selectNavWorkspaces);

  const handleWorkspaceContextMenu = (e, wsId) => {
    e.preventDefault();
    dispatch(openWorkspaceContextMenu({ workspaceId: wsId, x: e.clientX, y: e.clientY }));
  };
  const totalFormCount = useSelector(selectTotalFormCount);
  const showFormCounts = !formsLoading;

  const isTemplatesActive = location.pathname === '/dashboard/templates';
  const isAnalyticsActive = location.pathname.startsWith('/dashboard/analytics');
  const isHelpSupportActive = location.pathname === '/dashboard/help';
  const isProfileActive = location.pathname === '/dashboard/profile';
  const isDashboardActive =
    !isTemplatesActive &&
    !isAnalyticsActive &&
    !isHelpSupportActive &&
    !isProfileActive;

  const showSidebarSkeleton = isDashboardActive && formsLoading;

  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={{ opacity: 1, x: 0 }}
      animate={{ width: isCollapsed ? 60 : 196, opacity: 1, x: 0 }}
      exit={exit ?? { opacity: 0, x: -20, transition: { duration: 0.2, ease: 'easeIn' } }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative shrink-0 bg-white border-r border-[rgba(0,0,0,0.08)] flex flex-col h-full"
    >
      {/* Collapse / expand button — sits on the right border, aligned with "All Forms" */}
      {!showSidebarSkeleton && (
        <button
          onClick={() => setIsCollapsed((v) => !v)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`absolute -right-[10px] z-20 h-5 w-5 rounded-full bg-white border border-[#e9e7e0] flex items-center justify-center hover:bg-[#f4f3ef] transition-colors ${hideLogo ? 'top-[22px]' : 'top-[75px]'}`}
        >
          <RiArrowLeftSLine
            size={12}
            className={`text-[#6b6966] transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      )}
      <AnimatePresence mode="sync" initial={false}>
        {showSidebarSkeleton ? (
          <motion.div
            key="skeleton"
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <SidebarSkeleton />
          </motion.div>
        ) : isCollapsed ? (
          /* ── Collapsed sidebar ── */
          <motion.div
            key="collapsed"
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {/* Logo header — only when logo is visible */}
            {!hideLogo && (
              <div className="h-[52px] shrink-0 border-b border-[rgba(0,0,0,0.08)] flex items-center px-[14px] bg-white">
                <img
                  src={clearformLogoIcon}
                  alt="Clearform"
                  className="h-[26px] w-auto object-contain"
                />
              </div>
            )}

            {/* Gray nav body */}
            <div className="flex-1 bg-[#f7f7f8] flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto flex flex-col gap-[4px] px-[10px] py-3">
                {/* All Forms */}
                <CollapsedIconBtn
                  icon={RiLayoutGridLine}
                  active={isDashboardActive && activeWorkspace === 'all'}
                  title="All forms"
                  onClick={() => {
                    navigate('/dashboard');
                    dispatch(setActiveWorkspace('all'));
                  }}
                />

                {/* New workspace */}
                <CollapsedIconBtn
                  icon={RiAddLine}
                  title="New workspace"
                  onClick={() => dispatch(openCreateWorkspaceModal())}
                />

                {/* Templates */}
                <CollapsedIconBtn
                  icon={RiLayoutMasonryLine}
                  active={isTemplatesActive}
                  title="Templates"
                  onClick={() => navigate('/dashboard/templates')}
                />

                {/* Analytics */}
                <CollapsedIconBtn
                  icon={RiBarChartLine}
                  active={isAnalyticsActive}
                  title="Analytics"
                  onClick={() => navigate('/dashboard/analytics')}
                />
              </div>

              {/* Footer */}
              <div className="border-t border-[rgba(0,0,0,0.08)] px-[10px] pb-[14px] pt-[11px] flex flex-col gap-[2px] shrink-0">
                <HelpSupportNavButton
                  expanded={false}
                  active={isHelpSupportActive}
                  onClick={() => navigate('/dashboard/help')}
                />
                <ProfileFooter
                  expanded={false}
                  active={isProfileActive}
                  {...profile}
                  email={email}
                  onClick={() => navigate('/dashboard/profile')}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── Expanded sidebar ── */
          <motion.div
            key="expanded"
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {/* Logo header — only shown when logo is visible */}
            {!hideLogo && (
              <div className="h-[52px] shrink-0 border-b border-[#e5e3dc] flex items-center px-4">
                <img
                  src={clearformLogo}
                  alt="Clearform"
                  className="h-[26px] w-auto object-contain"
                />
              </div>
            )}

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto py-[13px] pl-2 pr-4 flex flex-col gap-0">
              {/* All Forms */}
              <NavItem
                icon={RiLayoutGridLine}
                label="All forms"
                badge={
                  showFormCounts && totalFormCount > 0 ? totalFormCount : undefined
                }
                active={isDashboardActive && activeWorkspace === 'all'}
                onClick={() => {
                  navigate('/dashboard');
                  dispatch(setActiveWorkspace('all'));
                }}
              />

              {/* Divider */}
              <div className="h-px bg-[#e5e3dc] mx-1 my-[9px]" />

              {/* Workspace list */}
              {workspaces.map((ws) => (
                <WorkspaceItem
                  key={ws.id}
                  workspace={
                    showFormCounts ? ws : { ...ws, count: 0 }
                  }
                  active={isDashboardActive && activeWorkspace === ws.id}
                  onClick={() => {
                    navigate('/dashboard');
                    dispatch(setActiveWorkspace(ws.id));
                  }}
                  onContextMenu={(e) => handleWorkspaceContextMenu(e, ws.id)}
                />
              ))}

              {/* New workspace */}
              <motion.button
                whileHover={{ backgroundColor: '#f4f3ef' }}
                onClick={() => dispatch(openCreateWorkspaceModal())}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors"
              >
                <RiAddLine size={13} className="text-[#6b6966] shrink-0" />
                <span className="text-[13px] font-medium text-[#6b6966] leading-[19.5px]">
                  New workspace
                </span>
              </motion.button>

              {/* Divider */}
              <div className="h-px bg-[#e5e3dc] mx-1 my-[9px]" />

              {/* Templates */}
              <NavItem
                icon={RiLayoutMasonryLine}
                label="Templates"
                active={isTemplatesActive}
                onClick={() => navigate('/dashboard/templates')}
              />

              {/* Intelligence section */}
              <div className="px-4 pt-4 pb-1">
                <span className="text-[10px] font-semibold text-[#a8a6a0] tracking-[0.7px] uppercase leading-[15px]">
                  INTELLIGENCE
                </span>
              </div>

              {/* Analytics */}
              <NavItem
                icon={RiBarChartLine}
                label="Analytics"
                active={isAnalyticsActive}
                onClick={() => navigate('/dashboard/analytics')}
              />
            </div>

            {/* Utility corner */}
            <div className="border-t border-[#e5e3dc] px-2 py-[14px] flex flex-col gap-px shrink-0">
              <HelpSupportNavButton
                expanded
                active={isHelpSupportActive}
                onClick={() => navigate('/dashboard/help')}
              />
              <ProfileFooter
                expanded
                active={isProfileActive}
                {...profile}
                email={email}
                onClick={() => navigate('/dashboard/profile')}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

export default Sidebar;
