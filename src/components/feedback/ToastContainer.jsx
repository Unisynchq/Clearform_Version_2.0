import { useSelector } from 'react-redux';
import { AnimatePresence } from 'motion/react';
import Toast from './Toast';

const ToastContainer = () => {
  const toasts = useSelector((state) => state.toast.toasts);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex flex-col gap-3 pointer-events-none z-50">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              type={toast.type}
              message={toast.message}
              duration={toast.duration}
              action={toast.action}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
