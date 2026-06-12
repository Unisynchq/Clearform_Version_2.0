import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { getPublishedForm } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';
import { readPublishedForm } from '@/features/forms/utils/publishedFormStorage';
import { readUserForms } from '@/features/forms/utils/userFormsStorage';
import FormRespondentView from '@/features/forms/components/FormRespondentView';

function BlockedView({ title, detail }) {
  return (
    <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center gap-3 p-8">
      <p className="text-[16px] font-medium text-[#18181b]">{title}</p>
      {detail ? <p className="text-[13px] text-[#71717a] text-center max-w-md">{detail}</p> : null}
    </div>
  );
}

/**
 * Public respondent route — loads published snapshot only (no builder draft fallback).
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
        .catch((err) => {
          if (err instanceof ApiError && err.status === 404) {
            setBlocked('not_found');
          } else if (err instanceof ApiError && err.status === 401) {
            setBlocked('unavailable');
          } else {
            setBlocked(err instanceof ApiError && err.status ? 'unavailable' : 'not_found');
          }
        })
        .finally(() => setLoading(false));
      return;
    }

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
      const published = readPublishedForm(numId);
      if (!published?.screens?.length) {
        setBlocked('no_draft');
      } else {
        setDraft(published);
        setBlocked(null);
      }
    }
    setLoading(false);
  }, [formId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-full max-w-[560px] rounded-[16px] bg-white border border-[#ebebeb] p-8 shadow-sm animate-pulse">
          <div className="h-3 w-24 bg-[#f0f0f0] rounded mb-6" />
          <div className="h-6 w-3/4 bg-[#ececec] rounded mb-3" />
          <div className="h-4 w-full bg-[#f4f4f4] rounded mb-2" />
          <div className="h-4 w-5/6 bg-[#f4f4f4] rounded mb-8" />
          <div className="h-28 w-full bg-[#f8f8f8] rounded mb-6" />
          <div className="flex justify-between">
            <div className="h-10 w-20 bg-[#f0f0f0] rounded" />
            <div className="h-10 w-28 bg-[#e8e8e8] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (blocked === 'invalid' || blocked === 'not_found') {
    return <BlockedView title="Form not found" />;
  }

  if (blocked === 'not_live') {
    return <BlockedView title="This form is not published yet" />;
  }

  if (blocked === 'no_draft' || blocked === 'unavailable') {
    return (
      <BlockedView
        title={blocked === 'unavailable' ? 'Unable to load this form' : 'Form content is unavailable'}
        detail={
          blocked === 'unavailable'
            ? 'Please try again in a moment. If this keeps happening, contact the form owner.'
            : 'Republish from the builder to refresh the live snapshot.'
        }
      />
    );
  }

  return <FormRespondentView draft={draft} formId={formId} />;
}
