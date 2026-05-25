import hooksSvg from '@/assets/icons/hooks.svg?raw';

/**
 * Webhooks panel icon — renders src/assets/icons/hooks.svg at runtime via ?raw
 * so SVG file replacements are picked up without stale bundled asset URLs.
 */
const HooksIcon = ({ className = 'inline-flex size-6 shrink-0 items-center justify-center' }) => (
  <span
    className={`${className} [&>svg]:block [&>svg]:size-full`}
    aria-hidden
    dangerouslySetInnerHTML={{ __html: hooksSvg }}
  />
);

export default HooksIcon;
