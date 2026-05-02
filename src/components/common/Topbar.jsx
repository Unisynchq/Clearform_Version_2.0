import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RiNotification3Line } from 'react-icons/ri';
import { openFormOverlay } from '../../redux/slices/uiSlice';
import SearchDropdown from '../ui/SearchPalette';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)]';
const Sk = ({ className }) => <div className={`bg-[#ece9e3] ${shimmer} ${className}`} />;

const SearchIcon = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <circle cx="4.5" cy="5.5" r="3.75" stroke="#a8a6a0" strokeWidth="1.5" />
    <path d="M7.5 9L9.5 11.5" stroke="#a8a6a0" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Topbar = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((s) => s.forms.isLoading);
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
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleFormClick = (form) => {
    close();
    dispatch(openFormOverlay(form.id));
  };

  if (isLoading) {
    return (
      <header className="h-[52px] shrink-0 bg-white border-b border-[#e5e3dc] flex items-center justify-between px-6 relative z-10">
        <Sk className="h-[20px] w-[80px] rounded-[6px]" />
        <Sk className="h-[38px] w-[400px] rounded-[8px]" />
        <Sk className="h-8 w-8 rounded-[6px]" />
      </header>
    );
  }

  return (
    <header className="h-[52px] shrink-0 bg-white border-b border-[#e5e3dc] flex items-center justify-between px-6 relative z-10">
      {/* Page title */}
      <h1 className="text-[20px] font-medium text-[#1a1a1c] tracking-[-0.2px] leading-[25px] whitespace-nowrap">
        All forms
      </h1>

      {/* Search bar — elevated above backdrop when dropdown is open */}
      <div
        ref={containerRef}
        className={`relative w-[400px] ${isOpen ? 'z-[401]' : ''}`}
        style={isOpen ? { position: 'relative' } : {}}
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

      {/* Notification bell */}
      <div className="relative p-0.5">
        <button className="w-8 h-8 bg-white border border-[rgba(0,0,0,0.08)] rounded-[6px] flex items-center justify-center hover:bg-[#f4f3ef] transition-colors cursor-pointer">
          <RiNotification3Line size={15} className="text-[#6b6966]" />
        </button>
        <span className="absolute top-[5px] right-[5px] w-[6px] h-[6px] bg-[#d4522a] rounded-[3px] border border-[#f4f3ef]" />
      </div>

      {/* Dropdown — fixed-positioned below the search bar */}
      <SearchDropdown
        open={isOpen}
        query={query}
        anchorRef={containerRef}
        onClose={close}
        onSelectRecent={(label) => {
          setQuery(label);
          inputRef.current?.focus();
        }}
        onFormClick={handleFormClick}
      />
    </header>
  );
};

export default Topbar;
