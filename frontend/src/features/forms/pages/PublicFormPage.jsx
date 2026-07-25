import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { getPublishedForm } from '@/api/services/formsService';
import { isApiConfigured } from '@/config/env';
import { readPublishedForm } from '@/features/forms/utils/publishedFormStorage';
import { readUserForms } from '@/features/forms/utils/userFormsStorage';
import { isFormPaused } from '@/features/forms/utils/formPause';
import FormRespondentView from '@/features/forms/components/FormRespondentView';
import { RiErrorWarningLine } from 'react-icons/ri';

function PausedModal({ title, ownerEmail }) {
  return (
    <div className="min-h-screen bg-[#f4f3ef] flex items-center justify-center p-6 select-none">
      <div
        className="w-full max-w-[480px] bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#e5e5e0] flex flex-col items-center text-center"
        style={{ padding: '40px 36px' }}
      >
        <div className="w-14 h-14 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center text-[24px] mb-5">
          ⏸
        </div>

        {title ? (
          <h2 className="text-[14px] font-semibold text-[#6b7280] tracking-wide uppercase mb-1">
            {title}
          </h2>
        ) : null}

        <h1 className="text-[22px] font-bold text-[#111827] leading-tight mb-3">
          Form Temporarily Paused
        </h1>

        <p className="text-[15px] text-[#4b5563] leading-relaxed mb-4">
          This form has been temporarily paused by the author.
        </p>

        <p className="text-[13.5px] font-medium text-[#6b7280] bg-[#f9fafb] px-4 py-2 rounded-[8px] border border-[#f3f4f6] mb-6">
          Responses are currently not being accepted.
        </p>

        {ownerEmail ? (
          <div className="w-full pt-4 border-t border-[#f3f4f6] flex flex-col items-center gap-1">
            <span className="text-[12.5px] font-medium text-[#9ca3af]">
              For assistance, contact:
            </span>
            <a
              href={`mailto:${ownerEmail}`}
              className="text-[14px] font-semibold text-[#111827] hover:underline"
            >
              {ownerEmail}
            </a>
          </div>
        ) : null}

        <p className="text-[12px] text-[#9ca3af] mt-6">
          Please try again later.
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
 * Public respondent route.
 *
 * When the API is configured (production), the database is the ONLY source of
 * truth. We do NOT fall back to localStorage for form status or pause state —
 * that would allow stale data to bypass DB-enforced rules on a different device
 * or in incognito.
 *
 * Flow (API mode):
 *   1. Fetch published snapshot from GET /api/v1/forms/:id/published
 *   2. If response indicates isPaused → render PausedModal
 *   3. If 404 → form not found / draft / archived → render BlockedView
 *   4. Otherwise render FormRespondentView with snapshot
 *
 * Flow (offline/demo mode — no API):
 *   Reads from localStorage as before.
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
      // ── API mode ────────────────────────────────────────────────────────
      if (isApiConfigured()) {
        return (async () => {
          try {
            const data = await getPublishedForm(formId);
            if (cancelled) return;

            // DB is authoritative: check isPaused from the API response only
            if (data?._paused === true || data?.isPaused === true) {
              setBlocked('paused');
              setOwnerEmail(data.ownerEmail || '');
              if (data.title) setDraft({ title: data.title });
              return;
            }

            // Render published snapshot if it has screens
            if (data?.screens?.length) {
              setDraft(data);
              setBlocked(null);
            } else {
              setBlocked('no_draft');
            }
          } catch (err) {
            if (cancelled) return;
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

      // ── Offline/demo mode ────────────────────────────────────────────────
      const numId = Number(formId);
      if (Number.isNaN(numId)) {
        setBlocked('invalid');
        setLoading(false);
        return Promise.resolve();
      }
      const forms = readUserForms();
      const meta = forms.find((f) => Number(f.id) === numId || String(f.id) === String(formId));
      if (!meta) {
        setBlocked('not_found');
      } else if (meta.isPaused || meta.status === 'paused' || (meta.pauseSettings?.confirmed && isFormPaused(meta))) {
        setBlocked('paused');
        setOwnerEmail(meta.ownerEmail || '');
      } else if (meta.status !== 'live' && meta.status !== 'published') {
        setBlocked('not_live');
      } else {
        const published = readPublishedForm(formId);
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

    // Re-check on tab focus / visibility change (handles pause while tab was in background)
    const refreshIfVisible = () => {
      if (document.visibilityState !== 'visible') return;

      getPublishedForm(formId).then((data) => {
        if (cancelled) return;

        // If the form became paused while the user had the tab open, show the paused UI
        if (data?._paused === true || data?.isPaused === true) {
          setBlocked('paused');
          setOwnerEmail(data.ownerEmail || '');
          return;
        }

        // Refresh published content if it changed
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
    return <PausedModal title={draft?.title} ownerEmail={ownerEmail} />;
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
