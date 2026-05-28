import { useMemo } from 'react';
import { useAnimatedListClear } from '@/hooks/useAnimatedListClear';

import { useDispatch, useSelector } from 'react-redux';

import { useNavigate } from 'react-router-dom';

import { AnimatePresence, motion } from 'motion/react';

import { RiAlertLine, RiMessage2Line, RiCheckboxCircleLine } from 'react-icons/ri';

import { closeNotificationCenter } from '@/store/slices/uiSlice';

import {

  clearAllNotifications,

  markNotificationRead,

  setNotificationTab,

} from '@/store/slices/notificationsSlice';

import { executeNotificationAction } from '@/utils/notificationNavigation';

const panelEase = [0.25, 0.1, 0.25, 1];
const CLEAR_EXIT_MS = 280;
const CLEAR_STAGGER_S = 0.028;



const TABS = [

  { id: 'all', label: 'All' },

  { id: 'alerts', label: 'Alerts' },

  { id: 'forms', label: 'Forms' },

];



const ACTION_STYLES = {

  dark: 'bg-[#1a1a1a] text-white',

  danger: 'bg-[#fde8e8] text-[#c0392b]',

  primary: 'bg-[#e8f0fe] text-[#2563eb]',

  outline: 'border border-[#d8d3cc] text-[#3a3a3a] bg-white',

};



const IconDisplay = ({ item }) => {

  if (item.iconType === 'emoji') {

    return <span className="text-[17px] leading-none select-none">{item.iconEmoji}</span>;

  }

  if (item.iconType === 'check') return <RiCheckboxCircleLine size={16} className="text-[#15803d]" />;

  if (item.iconType === 'warning') return <RiAlertLine size={16} className="text-[#b45309]" />;

  if (item.iconType === 'chat') return <RiMessage2Line size={16} className="text-[#0d9488]" />;

  return null;

};



const BodyText = ({ segments }) => (

  <p className="text-[12px] leading-[18px] m-0">

    {segments.map((seg, i) => (

      <span

        key={i}

        className={seg.bold ? 'font-medium text-[#3a3a3a]' : 'text-[#7a7670] font-normal'}

      >

        {seg.text}

      </span>

    ))}

  </p>

);



const NotificationItem = ({ item, onRead, onAction }) => (

  <div

    onClick={onRead}

    className="relative flex gap-3 items-start px-[18px] pt-[13px] pb-[14px] border-b border-[#f5f3f0] bg-[#fdfcfb] cursor-pointer hover:bg-[#f9f7f4] transition-colors"

  >

    {item.unread && (

      <div className="absolute left-[7px] top-[16px] w-[5px] h-[5px] rounded-[2.5px] bg-[#3b82b6]" />

    )}



    <div

      className="shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center"

      style={{ backgroundColor: item.iconBg }}

    >

      <IconDisplay item={item} />

    </div>



    <div className="flex-1 min-w-0 flex flex-col gap-[1.9px]">

      <div className="flex items-baseline justify-between gap-2">

        <span

          className="text-[12.5px] font-semibold leading-[16.88px]"

          style={{ color: item.titleColor || '#1a1a1a' }}

        >

          {item.title}

        </span>

        <span className="text-[10.5px] text-[#b0aba4] shrink-0 font-normal">{item.timestamp}</span>

      </div>



      <div className="pb-[5.1px]">

        <BodyText segments={item.bodySegments} />

      </div>



      {item.action && (

        <button

          type="button"

          onClick={(e) => {

            e.stopPropagation();

            onAction(item);

          }}

          className={`self-start px-[10px] py-[4px] rounded-[8px] text-[11px] font-semibold leading-[14px] cursor-pointer transition-opacity hover:opacity-85 ${ACTION_STYLES[item.action.style]}`}

        >

          {item.action.label}

        </button>

      )}



      {item.tag && (

        <div className="self-start flex items-center gap-1 px-2 py-[2px] rounded-[6px] bg-[#f5f3f0] border border-[#e2ded8]">

          <div className="w-[5px] h-[5px] rounded-[2.5px] shrink-0" style={{ backgroundColor: item.tag.color }} />

          <span className="text-[10.5px] font-medium text-[#5a5652] leading-[13px]">{item.tag.label}</span>

        </div>

      )}

    </div>

  </div>

);



const NotificationCenter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isOpen = useSelector((state) => state.ui.notificationCenter.open);
  const { activeTab, notifications } = useSelector((state) => state.notifications);
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter((item) => item.category === activeTab);
  }, [activeTab, notifications]);

  const { isClearing: isClearingAll, startClear, resolveDisplayList } = useAnimatedListClear({
    onClear: () => dispatch(clearAllNotifications()),
  });

  const displayNotifications = resolveDisplayList(filteredNotifications);
  const unreadCount = notifications.filter((item) => item.unread).length;

  const groupedNotifications = useMemo(
    () =>
      displayNotifications.reduce((acc, item) => {
        if (!acc[item.dateGroup]) acc[item.dateGroup] = [];
        acc[item.dateGroup].push(item);
        return acc;
      }, {}),
    [displayNotifications],
  );

  const handleMarkAllRead = () => {
    startClear(filteredNotifications);
  };



  const handleAction = (item) => {
    dispatch(markNotificationRead(item.id));
    executeNotificationAction({ dispatch, navigate }, item.action);
  };



  return (

    <AnimatePresence>

      {isOpen && (

        <>

          <motion.button

            type="button"

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            transition={{ duration: 0.15, ease: panelEase }}

            onClick={() => dispatch(closeNotificationCenter())}

            className="fixed inset-0 z-30 cursor-default border-0 bg-black/5"

            aria-label="Close notifications"

          />



          <motion.div

            key="notification-center-panel"

            initial={{ opacity: 0, y: -8, scale: 0.98 }}

            animate={{ opacity: 1, y: 0, scale: 1 }}

            exit={{ opacity: 0, y: -6, scale: 0.98 }}

            transition={{ duration: 0.16, ease: panelEase }}

            style={{ transformOrigin: 'top right' }}

            className="fixed right-4 top-[62px] w-[360px] z-40 rounded-[16px] border border-[#e2ded8] bg-white shadow-[0px_8px_32px_0px_rgba(0,0,0,0.1),0px_1px_4px_0px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden"

          >

            <div className="px-[18px] pt-4 pb-[13px] border-b border-[#eceae5] flex items-center justify-between">

              <div className="flex items-center gap-2">

                <span className="text-[14px] font-semibold text-[#1a1a1a] leading-[18px]">Notifications</span>

                <AnimatePresence initial={false}>
                  {unreadCount > 0 && !isClearingAll ? (
                    <motion.span
                      key="unread-badge"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.16, ease: panelEase }}
                      className="px-[6px] py-px rounded-[20px] bg-[#e8443a] text-white text-[10px] font-semibold leading-[16px] min-w-[18px] text-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  ) : null}
                </AnimatePresence>

              </div>

              {(unreadCount > 0 || notifications.length > 0) && !isClearingAll ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11.5px] font-medium text-[#3b82b6] cursor-pointer hover:opacity-75 transition-opacity leading-normal"
                >
                  Clear all
                </button>
              ) : null}

            </div>



            <div className="px-[14px] pt-[10px] pb-px border-b border-[#eceae5] flex items-start gap-[2px]">

              {TABS.map((tab) => (

                <button

                  key={tab.id}

                  type="button"

                  onClick={() => dispatch(setNotificationTab(tab.id))}

                  className={`px-3 pt-[6px] pb-[10px] text-[12px] font-medium leading-[16px] cursor-pointer border-b-2 transition-colors ${

                    activeTab === tab.id

                      ? 'border-[#1a1a1a] text-[#1a1a1a]'

                      : 'border-transparent text-[#8c8880] hover:text-[#1a1a1a]'

                  }`}

                >

                  {tab.label}

                </button>

              ))}

            </div>



            <div className="max-h-[420px] overflow-y-auto overflow-x-hidden">
              {Object.keys(groupedNotifications).length === 0 && !isClearingAll ? (
                <div className="h-[120px] flex items-center justify-center">
                  <p className="text-[13px] text-[#9b978d]">No notifications in this tab.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {(() => {
                    let itemIndex = 0;
                    return Object.entries(groupedNotifications).flatMap(([dateGroup, items]) => {
                    const header =
                      items.length > 0 ? (
                        <motion.div
                          key={`header-${dateGroup}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.14, ease: panelEase }}
                          className="overflow-hidden"
                        >
                          <div className="px-[18px] pt-[10px] pb-[7px] bg-[#fafaf8] border-b border-[#eceae5]">
                            <span className="text-[10.5px] font-semibold text-[#b0aba4] tracking-[0.63px] uppercase">
                              {dateGroup}
                            </span>
                          </div>
                        </motion.div>
                      ) : null;

                    const rows = items.map((item) => {
                      const delay = itemIndex * CLEAR_STAGGER_S;
                      itemIndex += 1;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            x: 12,
                            height: 0,
                          }}
                          transition={{
                            duration: CLEAR_EXIT_MS / 1000,
                            delay,
                            ease: panelEase,
                          }}
                          className="overflow-hidden"
                        >
                          <NotificationItem
                            item={item}
                            onRead={() => dispatch(markNotificationRead(item.id))}
                            onAction={handleAction}
                          />
                        </motion.div>
                      );
                    });

                    return header ? [header, ...rows] : rows;
                  });
                  })()}
                </AnimatePresence>
              )}
            </div>

          </motion.div>

        </>

      )}

    </AnimatePresence>

  );

};



export default NotificationCenter;

