import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { getPublishedForm, getForm } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';
import { readPublishedForm } from '@/features/forms/utils/publishedFormStorage';
import { readUserForms } from '@/features/forms/utils/userFormsStorage';
import FormRespondentView from '@/features/forms/components/FormRespondentView';
import { isFormPaused } from '@/features/forms/utils/formPause';
import { readStoredPauseSettings } from '@/features/forms/utils/pauseSettingsStorage';
import { RiErrorWarningLine } from 'react-icons/ri';

function PausedModal({ ownerEmail }) {
  return (
    <div className="min-h-screen bg-[#f4f3ef] flex items-center justify-center p-8">
      <div
        className="w-full max-w-[500px] bg-white rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex flex-col items-center"
        style={{ padding: '36px 40px 32px' }}
      >
        <div className="w-12 h-12 rounded-full bg-[#fff4e5] flex items-center justify-center">
          <RiErrorWarningLine size={20} className="text-[#f59e0b]" />
        </div>
        <h1
          className="mt-6 text-center font-bold text-[#1f2937]"
          style={{ fontSize: '22px', lineHeight: '1.3' }}
        >
          This form is not accepting responses
        </h1>
        <p
          className="mt-4 text-center text-[#6b7280]"
          style={{ fontSize: '16px', lineHeight: '1.5' }}
        >
          Contact the owner of the form for assistance.
        </p>
        {ownerEmail ? (
          <p
            className="mt-3 text-center text-[#6b7280]"
            style={{ fontSize: '14px', lineHeight: '1.5' }}
          >
            Reach out to <span className="font-semibold text-[#1f2937]">{ownerEmail}</span>
          </p>
        ) : null}
        <p
          className="mt-6 text-center text-[#6b7280]"
          style={{ fontSize: '15px', lineHeight: '1.5' }}
        >
          Thank you.
        </p>
      </div>
    </div>
  );
}

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
  const [ownerEmail, setOwnerEmail] = useState('');

  useEffect(() => {
    if (!formId) {
      setBlocked('invalid');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadPublished = () => {
      if (isApiConfigured()) {
        return (async () => {
          try {
            // 1. Load published form (public endpoint, no auth required)
            const data = await getPublishedForm(formId);
            if (cancelled) return;

            // 2. Check for _paused flag embedded in the published snapshot
            //    (stored there by pauseFormOnServer/resumeFormOnServer thunks).
            //    This works cross-device because the snapshot lives on the backend.
            const pausedMeta = data?._paused;
            if (pausedMeta?.confirmed && isFormPaused({ pauseSettings: pausedMeta })) {
              if (!cancelled) {
                setBlocked('paused');
                setOwnerEmail(pausedMeta.ownerEmail || '');
              }
              return;
            }

            // 3. Same-browser fallback — check localStorage bridge
            const stored = readStoredPauseSettings(formId);
            const ps = stored?.pauseSettings;
            if (ps?.confirmed && isFormPaused({ pauseSettings: ps })) {
              if (!cancelled) {
                setBlocked('paused');
                setOwnerEmail(stored.ownerEmail || '');
              }
              return;
            }

            // 4. Not paused — render published form
            if (data?.screens?.length) {
              setDraft(data);
              setBlocked(null);
            } else {
              setBlocked('no_draft');
            }
          } catch (err) {
            if (cancelled) return;
            // Published endpoint failed — check localStorage as fallback
            const fallbackStored = readStoredPauseSettings(formId);
            if (fallbackStored?.pauseSettings?.confirmed) {
              setBlocked('paused');
              setOwnerEmail(fallbackStored.ownerEmail || '');
              return;
            }
            if (err instanceof ApiError && err.status === 404) {
              setBlocked('not_found');
            } else if (err instanceof ApiError && err.status === 401) {
              setBlocked('unavailable');
            } else {
              setBlocked(err instanceof ApiError && err.status ? 'unavailable' : 'not_found');
            }
          } finally {
            if (!cancelled) setLoading(false);
          }
        })();
      }

      const numId = Number(formId);
      if (Number.isNaN(numId)) {
        setBlocked('invalid');
        setLoading(false);
        return Promise.resolve();
      }
      const forms = readUserForms();
      const meta = forms.find((f) => Number(f.id) === numId);
      if (!meta) {
        setBlocked('not_found');
      } else if (meta.status !== 'live') {
        setBlocked('not_live');
      } else if (meta.pauseSettings?.confirmed && isFormPaused(meta)) {
        setBlocked('paused');
        setOwnerEmail(meta.ownerEmail || '');
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
      return Promise.resolve();
    };

    setLoading(true);
    loadPublished();

    if (!isApiConfigured()) return () => { cancelled = true; };

    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') return;

      getPublishedForm(formId).then((data) => {
        if (cancelled) return;

        // Check _paused flag from published snapshot (cross-device)
        const pausedMeta = data?._paused;
        if (pausedMeta?.confirmed && isFormPaused({ pauseSettings: pausedMeta })) {
          setBlocked('paused');
          setOwnerEmail(pausedMeta.ownerEmail || '');
          return;
        }

        // Same-browser localStorage fallback
        const stored = readStoredPauseSettings(formId);
        if (stored?.pauseSettings?.confirmed) {
          setBlocked('paused');
          setOwnerEmail(stored.ownerEmail || '');
          return;
        }

        // Not paused — refresh published content
        if (!data?.screens?.length) return;
        setDraft((prev) => {
          if (!prev) return data;
          const prevSavedAt = prev.savedAt ?? prev.publishedAt;
          const nextSavedAt = data.savedAt ?? data.publishedAt;
          const prevIds = (prev.screens ?? []).map((s) => s.id).join(',');
          const nextIds = (data.screens ?? []).map((s) => s.id).join(',');
          if (prevSavedAt === nextSavedAt && prevIds === nextIds) return prev;
          return data;
        });
        setBlocked(null);
      }).catch(() => {});
    };

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
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

  if (blocked === 'paused') {
    return <PausedModal ownerEmail={ownerEmail} />;
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
