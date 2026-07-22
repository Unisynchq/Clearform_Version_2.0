import { usePageTitle } from '@/hooks/usePageTitle';

/** Syncs browser tab title with the active route. */
export default function PageTitle() {
  usePageTitle();
  return null;
}
