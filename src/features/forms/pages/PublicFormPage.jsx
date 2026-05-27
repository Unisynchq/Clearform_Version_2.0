import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { readPublishedForm } from '@/features/forms/utils/publishedFormStorage';
import { readBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import { readUserForms } from '@/features/forms/utils/userFormsStorage';
import FormRespondentView from '@/features/forms/components/FormRespondentView';

/**
 * Public respondent route — loads published snapshot and runs logicEngine navigation.
 */
export default function PublicFormPage() {
  const { formId } = useParams();

  const { draft, blocked } = useMemo(() => {
    if (!formId) {
      return { draft: null, blocked: 'invalid' };
    }
    const forms = readUserForms();
    const meta = forms.find((f) => String(f.id) === formId);
    if (!meta) {
      return { draft: null, blocked: 'not_found' };
    }
    if (meta.status !== 'live') {
      return { draft: null, blocked: 'not_live' };
    }
    const published = readPublishedForm(formId) ?? readBuilderDraft(formId);
    if (!published?.screens?.length) {
      return { draft: null, blocked: 'no_draft' };
    }
    return { draft: published, blocked: null };
  }, [formId]);

  if (blocked === 'invalid' || blocked === 'not_found') {
    return (
      <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-[16px] font-medium text-[#18181b]">Form not found</p>
        <Link to="/" className="text-[14px] text-[#7c3aed] hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (blocked === 'not_live') {
    return (
      <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-[16px] font-medium text-[#18181b]">This form is not published yet</p>
      </div>
    );
  }

  if (blocked === 'no_draft') {
    return (
      <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-[16px] font-medium text-[#18181b]">Form content is unavailable</p>
        <p className="text-[13px] text-[#71717a]">Republish from the builder to refresh the live snapshot.</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f4f3ef] flex flex-col"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <header className="shrink-0 border-b border-[#e4e4e7] bg-white px-6 py-4">
        <p className="text-[13px] text-[#71717a]">Clearform</p>
        <h1 className="text-[18px] font-semibold text-[#18181b]">{draft.formTitle || 'Form'}</h1>
      </header>
      <main className="flex-1 flex items-start justify-center py-10">
        <div className="w-full max-w-xl rounded-xl border border-[#e4e4e7] bg-white shadow-sm">
          <FormRespondentView draft={draft} formTitle={draft.formTitle} />
        </div>
      </main>
    </div>
  );
}
