import { useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'motion/react';
import { premiumTransition } from '@/constants/premiumTransition';
import FormBuilderLayoutSkeleton from '@/features/forms/components/FormBuilderLayoutSkeleton';

const BuilderRouteTransitionOverlay = () => {
  const pending = useSelector((s) => s.ui.builderRouteTransition.pending);

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          key="builder-route-bridge"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={premiumTransition}
          className="fixed inset-0 z-[350]"
          aria-hidden={!pending}
        >
          <FormBuilderLayoutSkeleton />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuilderRouteTransitionOverlay;
