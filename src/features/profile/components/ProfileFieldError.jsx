import { RiErrorWarningLine } from 'react-icons/ri';

export default function ProfileFieldError({ message, id }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-[12px] text-[#c53030]" role="alert">
      <RiErrorWarningLine className="size-[14px] shrink-0" aria-hidden />
      {message}
    </p>
  );
}
