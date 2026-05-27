/**
 * White framed surface matching Figma compare / “select forms” picker.
 */
function ComparePickerShell({ children, className = '' }) {
  return (
    <div
      className={`bg-white border border-[#d2d2d2] rounded-[10px] shadow-[0px_2px_5px_rgba(0,0,0,0.15)] p-4 flex flex-col gap-6 w-full ${className}`}
    >
      {children}
    </div>
  );
}

export default ComparePickerShell;
