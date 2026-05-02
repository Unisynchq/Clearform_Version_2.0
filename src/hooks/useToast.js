import { useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/toastSlice';

export const useToast = () => {
  const dispatch = useDispatch();

  const showToast = (options) => {
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
  };

  return { showToast };
};
