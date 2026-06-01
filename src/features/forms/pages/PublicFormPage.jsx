import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublishedForm } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';
import { readPublishedForm } from '@/features/forms/utils/publishedFormStorage';
import { readBuilderDraft } from '@/features/forms/utils/builderDraftStorage';
import { readUserForms } from '@/features/forms/utils/userFormsStorage';
import FormRespondentView from '@/features/forms/components/FormRespondentView';

/**
 * Public respondent route — loads published snapshot and runs logicEngine navigation.
 */
export default function PublicFormPage() {
  const { formId } = useParams();
  const [draft, setDraft] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!formId) {
      setBlocked('invalid');
      setLoading(false);
      return;
    }

    if (isApiConfigured()) {
      getPublishedForm(formId)
        .then((data) => {
          if (data?.screens?.length) {
            setDraft(data);
            setBlocked(null);
          } else {
            setBlocked('no_draft');
          }
        })
        .catch(() => setBlocked('not_found'))
        .finally(() => setLoading(false));
    } else {
      // localStorage fallback for local-only mode (numeric IDs)
      const numId = Number(formId);
      if (Number.isNaN(numId)) {
        setBlocked('invalid');
        setLoading(false);
        return;
      }
      const forms = readUserForms();
      const meta = forms.find((f) => Number(f.id) === numId);
      if (!meta) {
        setBlocked('not_found');
      } else if (meta.status !== 'live') {
        setBlocked('not_live');
      } else {
        const published = readPublishedForm(numId) ?? readBuilderDraft(numId);
        if (!published?.screens?.length) {
          setBlocked('no_draft');
        } else {
          setDraft(published);
          setBlocked(null);
        }
      }
      setLoading(false);
    }
  }, [formId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center">
        <p className="text-[14px] text-[#71717a]">Loading…</p>
      </div>
    );
  }

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
          <FormRespondentView draft={draft} formTitle={draft.formTitle} formId={formId} />
        </div>
      </main>
    </div>
  );
}
