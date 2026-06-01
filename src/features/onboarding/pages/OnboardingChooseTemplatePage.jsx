import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { RiSearchLine } from 'react-icons/ri';
import { useTemplates } from '@/features/templates/hooks/useTemplates';
import { TEMPLATE_FILTER_TABS } from '@/features/templates/constants';
import {
  filterTemplatesByCategory,
  searchTemplates,
} from '@/features/templates/utils/templateFilters';
import TemplateCard from '@/features/templates/components/TemplateCard';
import {
  selectOnboardingStep,
  selectOnboardingTemplate,
  setOnboardingStep,
} from '@/store/slices/onboardingSlice';
import { addForm } from '@/store/slices/formsSlice';
import { createForm } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';
import { useToast } from '@/hooks/useToast';
import OnboardingTopbar from '../components/OnboardingTopbar';
import OnboardingTemplatePreviewModal from '../components/OnboardingTemplatePreviewModal';
import { buildFormFromTemplate as buildBuilderScreensFromTemplate } from '@/features/templates/utils/buildFormFromTemplate';
import { buildBlankOnboardingForm, buildFormFromTemplate } from '../utils/createFormFromTemplate';
import { navigateToFormBuilder } from '@/features/forms/utils/navigateToFormBuilder';

const OnboardingChooseTemplatePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { templates, status } = useTemplates();
  const step = useSelector(selectOnboardingStep);
  const selectedTemplateId = useSelector((s) => s.onboarding.selectedTemplateId);

  useEffect(() => {
    if (step < 1) {
      navigate('/onboarding', { replace: true });
    }
  }, [step, navigate]);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const gridTemplates = useMemo(() => {
    const withSearch = searchQuery.trim()
      ? searchTemplates(templates, searchQuery)
      : templates;
    return filterTemplatesByCategory(withSearch, activeTab);
  }, [templates, searchQuery, activeTab]);

  const previewOpen = previewTemplate !== null;

  const openPreview = (template) => {
    dispatch(selectOnboardingTemplate(template.id));
    dispatch(setOnboardingStep(2));
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    dispatch(setOnboardingStep(1));
  };

  const goToBuilder = async (template) => {
    if (!template) return;

    const built = buildBuilderScreensFromTemplate(template.id);
    const newForm = buildFormFromTemplate({
      ...template,
      title: built?.formTitle ?? template.title,
    });
    let formId = newForm.id;

    if (isApiConfigured()) {
      try {
        const created = await createForm({
          title: newForm.title,
          workspaceId: undefined,
          gradientFrom: newForm.gradientFrom,
          gradientTo: newForm.gradientTo,
          overlayColor: newForm.overlayColor,
          iconGradient: newForm.iconGradient,
        });
        formId = created.id;
      } catch {
        showToast({ type: 'error', message: 'Could not create form. Please try again.' });
        return;
      }
    }

    setPreviewTemplate(null);
    dispatch(addForm({ ...newForm, id: formId }));
    dispatch(setOnboardingStep(3));

    navigateToFormBuilder(
      navigate,
      dispatch,
      {
        templateId: template.id,
        templateTitle: template.title,
        formTitle: built?.formTitle ?? template.title,
        formId,
        fromOnboarding: true,
      },
      { replace: true },
    );
  };

  const handleContinue = () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) openPreview(template);
  };

  const handleCustomForm = async () => {
    const blankForm = buildBlankOnboardingForm();
    let formId = blankForm.id;

    if (isApiConfigured()) {
      try {
        const created = await createForm({
          title: blankForm.title,
          workspaceId: undefined,
          gradientFrom: blankForm.gradientFrom,
          gradientTo: blankForm.gradientTo,
          overlayColor: blankForm.overlayColor,
          iconGradient: blankForm.iconGradient,
        });
        formId = created.id;
      } catch {
        showToast({ type: 'error', message: 'Could not create form. Please try again.' });
        return;
      }
    }

    const newForm = { ...blankForm, id: formId };
    dispatch(addForm(newForm));
    dispatch(setOnboardingStep(3));
    navigateToFormBuilder(
      navigate,
      dispatch,
      { formTitle: newForm.title, formId: newForm.id, fromOnboarding: true },
      { replace: true },
    );
  };

  const isLoading = status === 'loading';

  return (
    <>
      <motion.div
        animate={{ opacity: previewOpen ? 0.55 : 1 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        className={`flex flex-col min-h-full ${previewOpen ? 'pointer-events-none select-none' : ''}`}
        aria-hidden={previewOpen}
      >
        <OnboardingTopbar
          activeStep={previewOpen ? 2 : 1}
          showBack
          onBack={
            previewOpen
              ? closePreview
              : () => {
                  dispatch(setOnboardingStep(0));
                  navigate('/onboarding');
                }
          }
          onContinue={previewOpen ? () => goToBuilder(previewTemplate) : handleContinue}
          continueDisabled={previewOpen ? false : !selectedTemplateId}
        />

        <div
          className={`flex-1 min-h-0 px-8 py-10 max-w-[1200px] mx-auto w-full ${
            previewOpen ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          <div className="flex flex-col gap-1.5 mb-5">
            <h1 className="text-[34px] font-medium text-[#0f0e0c] leading-[40px] tracking-[-0.6px]">
              What are you building today?
            </h1>
            <p className="text-[14px] text-[#6b6860]">Choose a template or start from scratch.</p>
          </div>

          <div className="flex gap-2.5 items-center mb-4 pt-4">
            <div className="relative flex-1">
              <RiSearchLine
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9c9a94] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templatesâ€¦"
                className="w-full h-[42px] bg-white border border-[#e4e2dc] rounded-[10px] pl-10 pr-4 text-[14px] text-[#0f0e0c] outline-none focus:border-[#1a1a1a] placeholder:text-[#9c9a94]"
              />
            </div>
            <button
              type="button"
              onClick={handleCustomForm}
              className="h-[42px] shrink-0 px-[18px] rounded-[10px] bg-[#0f0e0c] text-white text-[13.5px] font-medium tracking-[-0.1px] hover:bg-[#2c2c2e] transition-colors cursor-pointer"
            >
              Custom form
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mb-6">
            {TEMPLATE_FILTER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-[29px] px-[9px] rounded-full text-[10px] font-medium cursor-pointer transition-colors ${
                  activeTab === tab
                    ? 'bg-[#1a1a1c] text-white border border-[#1a1a1c]'
                    : 'bg-white text-[#6b6966] border border-[#e5e3dc] hover:bg-[#f4f3ef]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[180px] rounded-[12px] bg-[#ece9e3] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {gridTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <TemplateCard
                    template={template}
                    selected={selectedTemplateId === template.id}
                    onSelect={(t) => dispatch(selectOnboardingTemplate(t.id))}
                    onUseTemplate={goToBuilder}
                    onPreview={openPreview}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {!isLoading && gridTemplates.length === 0 && (
            <p className="text-center text-[14px] text-[#6b6860] py-12">
              No templates match your search. Try another term or category.
            </p>
          )}
        </div>
      </motion.div>

      <OnboardingTemplatePreviewModal
        open={previewOpen}
        template={previewTemplate}
        onClose={closePreview}
        onUseTemplate={() => previewTemplate && goToBuilder(previewTemplate)}
      />
    </>
  );
};

export default OnboardingChooseTemplatePage;
