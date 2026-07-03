import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { RiCheckLine, RiCloseLine, RiLoader4Line } from 'react-icons/ri';
import {
  createFormModalTransition,
  modalEnter,
  modalExit,
  modalInitial,
} from '@/constants/premiumTransition';

const BACKDROP_KEY = 'save-template-backdrop';
const DIALOG_KEY = 'save-template-dialog';

const contentEase = [0.25, 0.1, 0.25, 1];

const labelClass = 'block text-[12.5px] font-semibold text-[#7a7670] leading-[18px] mb-2';
const inputClass =
  'w-full rounded-[8px] border border-[#e4e0da] bg-[#fafaf8] px-[13px] py-[10px] text-[13px] text-[#1a1814] outline-none transition-colors placeholder:text-[rgba(26,24,20,0.5)] focus:border-[#1a1814] disabled:opacity-60';

function SaveTemplateForm({ defaultName, saving, onCancel, onSave }) {
  const [name, setName] = useState(defaultName ?? '');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setName(defaultName ?? '');
    setDescription('');
  }, [defaultName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    onSave?.({ name: trimmed, description: description.trim() });
  };

  return (
    <>
      <div className="relative shrink-0 border-b border-[#e8e6e1] px-6 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pr-6">
            <h2
              id="save-template-title"
              className="text-[15px] font-semibold text-[#1a1814] tracking-[-0.2px] leading-[22.5px]"
            >
              Save as Template
            </h2>
            <p className="mt-1 text-[12.5px] font-normal text-[#7a7670] leading-[18px]">
              Save this form as a reusable template in your workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="absolute top-[13px] right-[13px] flex size-[22px] items-center justify-center rounded-full bg-[#dedede] text-[#1a1814] hover:bg-[#d0d0d0] cursor-pointer disabled:opacity-50"
            aria-label="Close dialog"
          >
            <RiCloseLine size={14} />
          </button>
        </div>
      </div>

      <form
        id="save-template-form"
        onSubmit={handleSubmit}
        className="min-h-0 flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4"
      >
        <div>
          <label htmlFor="save-template-name" className={labelClass}>
            Template name
          </label>
          <input
            id="save-template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Job Application – Engineering"
            disabled={saving}
            autoFocus
            className={inputClass}
          />
          <p className="mt-1.5 text-[11.5px] text-[#9c9a94] leading-[17px]">
            Choose a clear name so your team can find it quickly.
          </p>
        </div>

        <div>
          <label htmlFor="save-template-description" className={labelClass}>
            Description{' '}
            <span className="font-normal text-[#9c9a94]">optional</span>
          </label>
          <textarea
            id="save-template-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this template for? Who should use it?"
            disabled={saving}
            rows={3}
            className={`${inputClass} min-h-[80px] resize-none py-[10px]`}
          />
        </div>
      </form>

      <div className="shrink-0 border-t border-[#e8e6e1] px-6 py-3.5 flex justify-end gap-2 bg-white">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-[17px] py-[9px] text-[12.5px] font-medium text-[#7a7670] border border-[#e4e0da] rounded-[8px] hover:bg-[#fafaf8] cursor-pointer disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="save-template-form"
          disabled={saving || !name.trim()}
          className="inline-flex items-center gap-1.5 bg-[#1a1814] text-white text-[12.5px] font-medium px-4 py-[9px] rounded-[8px] hover:bg-[#2c2c2c] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <RiLoader4Line size={14} className="animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            'Save as Template'
          )}
        </button>
      </div>
    </>
  );
}

function SaveTemplateSuccess({ savedName, onKeepEditing, onViewTemplates }) {
  return (
    <div className="relative flex flex-col items-center px-6 py-8 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22, mass: 0.9 }}
        className="mb-4 flex size-11 items-center justify-center rounded-full bg-[#e8f8ef] border border-[#c6efd8]"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 520, damping: 24 }}
        >
          <RiCheckLine size={20} className="text-[#22a558]" aria-hidden />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.22, ease: contentEase }}
        className="max-w-[300px] text-[13.5px] font-medium leading-[20px] text-[#1a1814]"
      >
        &ldquo;{savedName}&rdquo; is now available in{' '}
        <span className="font-semibold text-[#111110]">My Templates</span>
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.22, ease: contentEase }}
        className="mt-1.5 max-w-[280px] text-[12px] leading-[18px] text-[#7a7670]"
      >
        Anyone in your workspace can use or copy this template.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.22, ease: contentEase }}
        className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center"
      >
        <button
          type="button"
          onClick={onKeepEditing}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-[8px] border border-[#e4e0da] bg-white px-4 text-[12.5px] font-medium text-[#1a1814] hover:bg-[#fafaf8] cursor-pointer sm:flex-none sm:min-w-[128px]"
        >
          Keep Editing
        </button>
        <button
          type="button"
          onClick={onViewTemplates}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-[8px] bg-[#1a1814] px-4 text-[12.5px] font-medium text-white hover:bg-[#2c2c2c] cursor-pointer sm:flex-none sm:min-w-[148px]"
        >
          View My Templates
        </button>
      </motion.div>
    </div>
  );
}

export default function SaveAsTemplateModal({
  open,
  phase = 'form',
  defaultName = '',
  savedName = '',
  saving = false,
  onClose,
  onSave,
  onExitComplete,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === 'undefined') return null;

  const handleViewTemplates = () => {
    onClose?.();
    navigate('/dashboard/templates', { state: { libraryTab: 'mine' } });
  };

  return createPortal(
    <AnimatePresence onExitComplete={onExitComplete}>
      {open ? (
        <>
          <motion.div
            key={BACKDROP_KEY}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={createFormModalTransition}
            onClick={saving ? undefined : onClose}
            className="fixed inset-0 z-[300] bg-black/20"
          />

          <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={DIALOG_KEY}
              role="dialog"
              aria-modal="true"
              aria-labelledby="save-template-title"
              initial={modalInitial}
              animate={modalEnter}
              exit={modalExit}
              transition={createFormModalTransition}
              style={{ transformOrigin: 'center center' }}
              className="pointer-events-auto relative flex w-[min(100%,400px)] max-h-[min(88vh,560px)] flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_8px_48px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]"
            >
              <AnimatePresence mode="wait" initial={false}>
                {phase === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: contentEase }}
                  >
                    <SaveTemplateSuccess
                      savedName={savedName}
                      onKeepEditing={onClose}
                      onViewTemplates={handleViewTemplates}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: contentEase }}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    <SaveTemplateForm
                      defaultName={defaultName}
                      saving={saving}
                      onCancel={onClose}
                      onSave={onSave}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
