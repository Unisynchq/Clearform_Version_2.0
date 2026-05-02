import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'motion/react';
import { RiCloseLine, RiCheckLine, RiErrorWarningLine, RiAlertLine, RiInformationLine, RiArrowGoBackLine } from 'react-icons/ri';
import { removeToast } from '../../redux/slices/toastSlice';

const Toast = ({ id, type, message, duration, action }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(id));
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, dispatch]);

  const getToastConfig = () => {
    const configs = {
      success: {
        bgColor: '#dbeafe', // Light blue background (matching design)
        borderColor: '#86efac', // Green border
        textColor: '#166534', // Dark green text
        icon: RiCheckLine,
        iconColor: '#16a34a',
      },
      error: {
        bgColor: '#fee2e2',
        borderColor: '#fca5a5',
        textColor: '#991b1b',
        icon: RiErrorWarningLine,
        iconColor: '#dc2626',
      },
      warning: {
        bgColor: '#fef3c7',
        borderColor: '#fcd34d',
        textColor: '#92400e',
        icon: RiAlertLine,
        iconColor: '#f59e0b',
      },
      info: {
        bgColor: '#dbeafe',
        borderColor: '#93c5fd',
        textColor: '#1e40af',
        icon: RiInformationLine,
        iconColor: '#3b82f6',
      },
      undo: {
        bgColor: '#e5e3dc',
        borderColor: '#d4d0c0',
        textColor: '#6b6966',
        icon: RiArrowGoBackLine,
        iconColor: '#6b6966',
      },
    };
    return configs[type] || configs.info;
  };

  const config = getToastConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm max-w-sm"
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor,
      }}
    >
      {/* Icon */}
      <Icon size={20} color={config.iconColor} className="shrink-0" />

      {/* Message */}
      <div className="flex-1 text-sm font-medium">{message}</div>

      {/* Action Button (optional) */}
      {action && (
        <button
          onClick={() => {
            action.onClick?.();
            dispatch(removeToast(id));
          }}
          className="px-3 py-1 rounded border text-xs font-medium whitespace-nowrap hover:opacity-80 transition-opacity"
          style={{
            borderColor: config.textColor,
            color: config.textColor,
          }}
        >
          {action.label}
        </button>
      )}

      {/* Close Button */}
      <button
        onClick={() => dispatch(removeToast(id))}
        className="p-1 hover:opacity-70 transition-opacity shrink-0"
      >
        <RiCloseLine size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;
