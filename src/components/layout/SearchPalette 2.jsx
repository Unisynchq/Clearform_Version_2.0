import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  RiEditLine,
  RiGroupLine,
  RiFileCopyLine,
  RiLayoutGridLine,
  RiBarChartLine,
  RiAddLine,
  RiLink,
  RiSearchLine,
} from 'react-icons/ri';
import { selectNavWorkspaces } from '@/store/slices/formsSlice';
import { openFormOverlay, openCreateNewFormModal } from '@/store/slices/uiSlice';
import { readRecentSearches, saveRecentSearch } from '@/utils/searchRecentStorage';
import { useToast } from '@/hooks/useToast';

const WORKSPACE_COLORS = ['#2e7d52', '#1d6fd8', '#b45309', '#6b6966', '#7c3aed', '#c2410c'];

const Kbd = ({ children }) => (
  <span className="inline-flex items-center bg-[#f4f3ef] border border-[#e5e3dc] text-[#a8a6a0] text-[10px] font-normal px-[7px] py-[2px] rounded-[4px] leading-normal whitespace-nowrap shrink-0">
    {children}
  </span>
);

const IconBox = ({ icon: Icon, bg = '#f4f3ef', borderColor = '#e5e3dc', color = '#6b6966' }) => (
  <div
    className="flex items-center justify-center rounded-[7px] shrink-0 border"
    style={{ width: 28, height: 28, background: bg, borderColor }}
  >
    <Icon size={13} style={{ color }} />
  </div>
);

const SectionLabel = ({ children }) => (
  <p className="px-4 pt-3 pb-[6px] text-[10px] font-semibold text-[#a8a6a0] tracking-[1px] uppercase leading-normal">
    {children}
  </p>
);

const RowItem = ({
  icon,
  iconBg,
  iconBorderColor,
  iconColor,
  title,
  subtitle,
  badge,
  badgeCls,
  kbd,
  active = false,
  onClick,
}) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-[8px] text-left transition-colors cursor-pointer ${
      active ? 'bg-[#f4f3ef]' : 'hover:bg-[#f4f3ef]'
    }`}
  >
    <IconBox icon={icon} bg={iconBg} borderColor={iconBorderColor} color={iconColor} />
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium text-[#1a1a1c] leading-snug truncate">{title}</p>
      {subtitle && (
        <p className="text-[11px] text-[#a8a6a0] leading-snug truncate">{subtitle}</p>
      )}
    </div>
    {badge && (
      <span className={`text-[10px] font-medium px-[7px] py-[2px] rounded-full whitespace-nowrap shrink-0 ${badgeCls}`}>
        {badge}
      </span>
    )}
    {kbd && <Kbd>{kbd}</Kbd>}
  </button>
);

const Divider = () => <div className="h-px bg-[#e5e3dc] mx-4" />;

function formPublicSlug(title) {
  return (title || 'form')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'form';
}

function statusBadge(form) {
  if (form.status === 'live') {
    return { label: 'Live', cls: 'bg-[#e6f5ee] text-[#2d7a53]' };
  }
  if (form.status === 'draft') {
    return { label: 'Draft', cls: 'bg-[#fef3cd] text-[#b45309]' };
  }
  return { label: 'Archived', cls: 'bg-[#f4f3ef] text-[#6b6966]' };
}

const DefaultState = ({ recentSearches, onSelectRecent, onNavigate, onCreateNewForm }) => (
  <div>
    {recentSearches.length > 0 ? (
      <>
        <SectionLabel>Recent searches</SectionLabel>
        <div className="flex flex-wrap gap-[6px] px-4 pb-3">
          {recentSearches.map((label, i) => (
            <button
              key={label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelectRecent(label)}
              className="flex items-center gap-[6px] bg-white border border-[#e5e3dc] rounded-full px-3 py-[5px] text-[12px] text-[#1a1a1c] hover:bg-[#f4f3ef] transition-colors leading-normal cursor-pointer"
            >
              <span
                className="w-[7px] h-[7px] rounded-full shrink-0"
                style={{ background: WORKSPACE_COLORS[i % WORKSPACE_COLORS.length] }}
              />
              {label}
            </button>
          ))}
        </div>
        <Divider />
      </>
    ) : null}

    <SectionLabel>Jump to</SectionLabel>
    <div className="pb-2">
      <RowItem
        icon={RiLayoutGridLine}
        title="All forms"
        kbd="G F"
        onClick={() => onNavigate('/dashboard')}
      />
      <RowItem
        icon={RiBarChartLine}
        title="Analytics"
        kbd="G A"
        onClick={() => onNavigate('/dashboard/analytics')}
      />
      <RowItem icon={RiAddLine} title="Create new form" kbd="⌘N" onClick={onCreateNewForm} />
    </div>
  </div>
);

const FilledState = ({
  matchingForms,
  query,
  workspaceLabel,
  onFormClick,
  onEditForm,
  onViewResponses,
  onCopyLink,
  onNavigate,
  onCreateNewForm,
}) => {
  const primary = matchingForms[0];
  const slug = formPublicSlug(primary?.title);

  return (
    <div>
      <SectionLabel>
        Forms matching &ldquo;{query}&rdquo;
      </SectionLabel>
      <div className="flex flex-col">
        {matchingForms.map((form, i) => {
          const badge = statusBadge(form);
          return (
            <RowItem
              key={form.id}
              icon={RiFileCopyLine}
              iconBg={i === 0 ? '#eff0ff' : '#f4f3ef'}
              iconBorderColor={i === 0 ? '#d5d7ff' : '#e5e3dc'}
              iconColor={i === 0 ? '#6b78ff' : '#6b6966'}
              title={form.title}
              subtitle={`${workspaceLabel(form.workspace)} · ${form.responses ?? 0} responses`}
              badge={badge.label}
              badgeCls={badge.cls}
              active={i === 0}
              onClick={() => onFormClick(form)}
            />
          );
        })}
      </div>

      {primary ? (
        <>
          <Divider />
          <SectionLabel>Actions</SectionLabel>
          <div className="flex flex-col">
            <RowItem
              icon={RiEditLine}
              title={`Edit "${primary.title}"`}
              subtitle="Open form builder"
              kbd="↵"
              onClick={() => onEditForm(primary)}
            />
            <RowItem
              icon={RiGroupLine}
              title={`View responses for "${primary.title}"`}
              subtitle="Open analytics responses"
              onClick={() => onViewResponses(primary)}
            />
            <RowItem
              icon={RiLink}
              title="Copy form link"
              subtitle={`form.clearform.io/${slug}`}
              kbd="⌘C"
              onClick={() => onCopyLink(primary)}
            />
          </div>
        </>
      ) : null}

      <Divider />
      <SectionLabel>Navigate</SectionLabel>
      <div className="flex flex-col pb-1">
        <RowItem icon={RiLayoutGridLine} title="All forms" onClick={() => onNavigate('/dashboard')} />
        <RowItem icon={RiBarChartLine} title="Analytics" onClick={() => onNavigate('/dashboard/analytics')} />
        <RowItem icon={RiAddLine} title="Create new form" kbd="⌘N" onClick={onCreateNewForm} />
      </div>
    </div>
  );
};

const EmptyState = ({ query, onCreateNewForm }) => (
  <div>
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
      <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f4f3ef] border border-[#e5e3dc]">
        <RiSearchLine size={17} className="text-[#a8a6a0]" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[13px] font-medium text-[#1a1a1c] leading-snug">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-[12px] text-[#a8a6a0] leading-snug">
          Try a different search or create a new form
        </p>
      </div>
    </div>
    <div className="px-4 pb-4">
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCreateNewForm}
        className="w-full flex items-center justify-between px-3 py-2 border border-[#e5e3dc] rounded-[8px] text-[13px] text-[#1a1a1c] hover:bg-[#f4f3ef] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <RiAddLine size={14} className="text-[#6b6966]" />
          <span className="font-medium">Create new form</span>
        </div>
        <Kbd>⌘N</Kbd>
      </button>
    </div>
  </div>
);

const SearchDropdown = ({ open, query, anchorRef, onClose, onQueryChange, onCreateNewForm }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const forms = useSelector((s) => s.forms.forms);
  const workspaces = useSelector(selectNavWorkspaces);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 400 });
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);

  useEffect(() => {
    if (open) setRecentSearches(readRecentSearches());
  }, [open]);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open, anchorRef, query]);

  const workspaceLabel = useCallback(
    (workspaceId) => {
      if (!workspaceId || workspaceId === 'all') return 'All workspaces';
      const ws = workspaces.find((w) => w.id === workspaceId);
      return ws?.label ?? 'Workspace';
    },
    [workspaces]
  );

  const trimmed = query.trim();
  const matchingForms = useMemo(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    return forms.filter((f) => {
      const title = f.title?.toLowerCase() ?? '';
      const ws = workspaceLabel(f.workspace).toLowerCase();
      return title.includes(q) || ws.includes(q);
    });
  }, [forms, trimmed, workspaceLabel]);

  const isDefault = !trimmed;
  const hasResults = matchingForms.length > 0;
  const isEmpty = trimmed.length > 0 && !hasResults;

  const handleNavigate = useCallback(
    (path) => {
      onClose();
      navigate(path);
    },
    [navigate, onClose]
  );

  const handleFormClick = useCallback(
    (form) => {
      if (trimmed) {
        const next = saveRecentSearch(trimmed);
        setRecentSearches(next);
      }
      onClose();
      dispatch(openFormOverlay(form.id));
      navigate('/dashboard');
    },
    [trimmed, onClose, dispatch, navigate]
  );

  const handleEditForm = useCallback(
    (form) => {
      if (trimmed) saveRecentSearch(trimmed);
      onClose();
      navigate(`/dashboard/form-builder/${form.id}`);
    },
    [trimmed, onClose, navigate]
  );

  const handleViewResponses = useCallback(
    (form) => {
      if (trimmed) saveRecentSearch(trimmed);
      onClose();
      navigate(`/dashboard/analytics?form=${form.id}&tab=responses`);
    },
    [trimmed, onClose, navigate]
  );

  const handleCopyLink = useCallback(
    async (form) => {
      const url = `https://form.clearform.io/${formPublicSlug(form.title)}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast({ type: 'success', message: 'Form link copied' });
      } catch {
        showToast({ type: 'info', message: url });
      }
    },
    [showToast]
  );

  const handleSelectRecent = useCallback(
    (label) => {
      onQueryChange(label);
    },
    [onQueryChange]
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            onMouseDown={onClose}
            className="fixed inset-0 z-400 bg-black/30"
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-401 bg-white border border-[#e5e3dc] rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.14)] overflow-hidden"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div className="max-h-[520px] overflow-y-auto">
              {isDefault && (
                <DefaultState
                  recentSearches={recentSearches}
                  onSelectRecent={handleSelectRecent}
                  onNavigate={handleNavigate}
                  onCreateNewForm={onCreateNewForm}
                />
              )}
              {isEmpty && <EmptyState query={query} onCreateNewForm={onCreateNewForm} />}
              {hasResults && (
                <FilledState
                  matchingForms={matchingForms}
                  query={query}
                  workspaceLabel={workspaceLabel}
                  onFormClick={handleFormClick}
                  onEditForm={handleEditForm}
                  onViewResponses={handleViewResponses}
                  onCopyLink={handleCopyLink}
                  onNavigate={handleNavigate}
                  onCreateNewForm={onCreateNewForm}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SearchDropdown;
