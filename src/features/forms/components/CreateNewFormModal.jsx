import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { RiArrowRightSLine, RiCloseLine } from 'react-icons/ri';
import { closeCreateNewFormModal } from '@/store/slices/uiSlice';
import { addForm } from '@/store/slices/formsSlice';
import { completeOnboarding, selectIsOnboardingActive } from '@/store/slices/onboardingSlice';
import { FORM_COLOR_OPTIONS, getFormColorTheme } from '../constants/formColorThemes';

const CreateNewFormModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector((s) => s.ui.createNewFormModal.open);
  const activeWorkspace = useSelector((s) => s.forms.activeWorkspace);
  const isOnboardingActive = useSelector(selectIsOnboardingActive);

  const [name, setName] = useState('');
  const [colorId, setColorId] = useState(FORM_COLOR_OPTIONS[0].id);

  const resetAndClose = () => {
    dispatch(closeCreateNewFormModal());
    setName('');
    setColorId(FORM_COLOR_OPTIONS[0].id);
  };

  const handleCreate = () => {
    const title = name.trim() || 'Untitled';
    const theme = getFormColorTheme(colorId);
    const workspace = activeWorkspace === 'all' ? 'product' : activeWorkspace;
    const newForm = {
      id: Date.now(),
      title,
      status: 'draft',
      responses: 0,
      timeAgo: 'just now',
      workspace,
      gradientFrom: theme.gradientFrom,
      gradientTo: theme.gradientTo,
      overlayColor: theme.overlayColor,
      iconGradient: theme.iconGradient,
    };

    dispatch(addForm(newForm));
    if (isOnboardingActive) dispatch(completeOnboarding());
    dispatch(closeCreateNewFormModal());
    setName('');
    setColorId(FORM_COLOR_OPTIONS[0].id);
    navigate('/dashboard/form-builder', {
      state: { formTitle: title, formId: newForm.id, formColor: theme.value },
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={resetAndClose}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-new-form-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] bg-white rounded-[14px] shadow-[0_8px_16px_rgba(0,0,0,0.12)] p-6 flex flex-col gap-1"
          >
            <button
              type="button"
              onClick={resetAndClose}
              aria-label="Close"
              className="absolute top-[13px] right-[13px] w-[22px] h-[22px] flex items-center justify-center rounded-[11px] bg-[#dedede] text-[#1a1814] hover:bg-[#d0d0d0] transition-colors cursor-pointer"
            >
              <RiCloseLine size={14} />
            </button>

            <h2
              id="create-new-form-title"
              className="text-[15px] font-semibold text-[#1a1814] leading-[22.5px] tracking-[-0.2px] pr-8"
            >
              Name your form before creating it
            </h2>

            <motion.div className="pt-4 flex flex-col gap-0">
              <label
                htmlFor="new-form-name"
                className="text-[11.5px] font-semibold text-[#7a7670] leading-[17.25px]"
              >
                Form name
              </label>
              <input
                id="new-form-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Untitled"
                autoFocus
                className="mt-2 w-full px-[13px] py-[11px] text-[13px] text-[#1a1814] placeholder:text-[rgba(26,24,20,0.5)] bg-[#fafaf8] border border-[#e4e0da] rounded-[8px] outline-none focus:border-[#1a1814] transition-colors leading-normal"
              />
            </motion.div>

            <motion.div className="pt-3 flex flex-col gap-0">
              <p className="text-[11.5px] font-semibold text-[#7a7670] leading-[17.25px]">Colour</p>
              <motion.div className="flex items-center gap-2 pt-1">
                {FORM_COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setColorId(opt.id)}
                    aria-label={`${opt.id} colour`}
                    aria-pressed={colorId === opt.id}
                    className={`w-[22px] h-[22px] rounded-[11px] shrink-0 transition-transform hover:scale-110 cursor-pointer ${
                      colorId === opt.id
                        ? 'border-2 border-[#1a1814] ring-2 ring-white ring-offset-0'
                        : 'border-2 border-transparent'
                    }`}
                    style={{ backgroundColor: opt.value }}
                  />
                ))}
              </motion.div>
            </motion.div>

            <motion.div className="flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-[17px] py-[9px] text-[12.5px] font-medium text-[#7a7670] border border-[#e4e0da] rounded-[8px] hover:bg-[#fafaf8] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="flex items-center gap-0.5 bg-[#1a1814] text-white text-[12.5px] font-medium px-4 py-[9px] rounded-[8px] hover:bg-[#2c2c2c] transition-colors cursor-pointer whitespace-nowrap"
              >
                Create Form
                <RiArrowRightSLine size={16} className="-mr-0.5" />
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateNewFormModal;
