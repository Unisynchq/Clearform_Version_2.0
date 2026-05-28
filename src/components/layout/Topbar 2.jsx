import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'motion/react';
import { RiNotification3Line } from 'react-icons/ri';
import {
  openCreateNewFormModal,
  toggleNotificationCenter,
} from '@/store/slices/uiSlice';
import SearchDropdown from './SearchPalette';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]';
const Sk = ({ className }) => <div className={`bg-[#ece9e3] ${shimmer} ${className}`} />;

const topbarEase = [0.25, 0.1, 0.25, 1];

const SearchIcon = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <circle cx="4.5" cy="5.5" r="3.75" stroke="#a8a6a0" strokeWidth="1.5" />
    <path d="M7.5 9L9.5 11.5" stroke="#a8a6a0" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TITLE_CLASS = {
  default: 'text-[18px] font-semibold text-[#111110] tracking-[-0.3px] leading-[24px]',
  sm: 'text-[13px] font-medium text-[#111110] leading-[19.5px]',
};

const Topbar = ({ title = 'All forms', titleSize = 'default', useFormsLoading = true }) => {
  const dispatch = useDispatch();
  const formsLoading = useSelector((s) => s.forms.isLoading);
  const isLoading = useFormsLoading ? formsLoading : false;
  const unreadCount = useSelector((s) => s.notifications.notifications.filter((item) => item.unread).length);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const open = () => setIsOpen(true);

  const close = () => {
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  /* ⌘K → focus & open; ESC → close */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        open();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        close();
        dispatch(openCreateNewFormModal());
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleCreateNewForm = () => {
    close();
    dispatch(openCreateNewFormModal());
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.header
          key="topbar-skel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="h-[52px] shrink-0 bg-white border-b border-[#e5e3dc] flex items-center justify-between px-6 relative z-10"
        >
          <Sk className="h-[20px] w-[88px] rounded-[6px]" />
          <Sk className="h-[38px] w-[400px] rounded-[8px]" />
          <Sk className="h-8 w-8 rounded-[6px]" />
        </motion.header>
      ) : (
        <motion.header
          key="topbar-main"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: topbarEase }}
          className="h-[52px] shrink-0 bg-white border-b border-[#e5e3dc] flex items-center justify-between px-6"
        >
          {/* Page title */}
          <h1
            className={`whitespace-nowrap antialiased ${TITLE_CLASS[titleSize] ?? TITLE_CLASS.default}`}
          >
            {title}
          </h1>

          {/* Search bar — elevated above backdrop when dropdown is open */}
          <div
            ref={containerRef}
            className={`relative w-[400px] ${isOpen ? 'z-[402]' : ''}`}
            onClick={() => inputRef.current?.focus()}
          >
            <div
              className={`w-full bg-[#f4f3ef] flex items-center gap-2 px-[13px] py-[9px] rounded-[8px] border transition-colors ${
                isOpen
                  ? 'border-[#1a1a1c] shadow-[0_0_0_3px_rgba(0,0,0,0.08)]'
                  : 'border-[#e5e3dc] hover:border-[#c9c7bf]'
              }`}
            >
              <SearchIcon />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={open}
                placeholder="Search forms, responses…"
                className="flex-1 text-[13px] text-[#1a1a1c] placeholder-[#a8a6a0] bg-transparent outline-none leading-normal"
              />
              {isOpen ? (
                <button
                  onMouseDown={(e) => { e.preventDefault(); close(); }}
                  className="inline-flex items-center bg-white border border-[#e5e3dc] text-[#a8a6a0] text-[10px] font-normal px-[6px] py-[2px] rounded-[4px] leading-normal hover:bg-[#f4f3ef] transition-colors shrink-0 cursor-pointer"
                >
                  ESC
                </button>
              ) : (
                <div className="flex items-center gap-[2px] shrink-0 pointer-events-none">
                  <kbd className="bg-white border border-[#c9c7bf] rounded-[3px] px-[5px] py-[2px] text-[10px] text-[#a8a6a0] leading-[15px] font-normal">
                    ⌘
                  </kbd>
                  <kbd className="bg-white border border-[#c9c7bf] rounded-[3px] px-[5px] py-[2px] text-[10px] text-[#a8a6a0] leading-[15px] font-normal">
                    K
                  </kbd>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="flex items-center gap-2">
            <div className="relative p-0.5">
              <button
                type="button"
                onClick={() => dispatch(toggleNotificationCenter())}
                className="flex size-8 items-center justify-center rounded-[6px] border border-[rgba(0,0,0,0.08)] bg-white transition-colors hover:bg-[#f4f3ef] cursor-pointer"
                aria-label="Toggle notifications"
              >
                <RiNotification3Line size={15} className="text-[#6b6966]" />
              </button>
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    key="unread-badge"
                    initial={{ opacity: 0, scale: 0.65 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.65 }}
                    transition={{ duration: 0.16, ease: topbarEase }}
                    className="absolute -top-[1px] -right-[1px] min-w-[15px] h-[15px] px-[4px] bg-[#d4522a] rounded-full border border-white text-[9px] text-white font-semibold leading-[13px] text-center"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Dropdown — fixed-positioned below the search bar */}
          <SearchDropdown
            open={isOpen}
            query={query}
            anchorRef={containerRef}
            onClose={close}
            onQueryChange={(label) => {
              setQuery(label);
              inputRef.current?.focus();
            }}
            onCreateNewForm={handleCreateNewForm}
          />
        </motion.header>
      )}
    </AnimatePresence>
  );
};

export default Topbar;
