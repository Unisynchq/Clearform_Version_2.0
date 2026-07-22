import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/store/slices/toastSlice';

// Wrapped in useCallback so consumers can safely list `showToast` in
// useEffect deps without triggering the effect on every parent render.
export const useToast = () => {
  const dispatch = useDispatch();

  const showToast = useCallback(
    (options) => {
      const {
        type = 'info', // 'success', 'error', 'warning', 'info', 'undo'
        message = '',
        duration = 3000,
        action = null, // { label: 'Undo', onClick: () => {} }
      } = options;

      dispatch(
        addToast({
          type,
          message,
          duration,
          action,
        })
      );
    },
    [dispatch]
  );

  return { showToast };
};
