const FormBuilderLoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e5e3dc] border-t-[#1a1a18]" />
      <p className="text-[13px] text-[#6b6b68]">Loading form builder…</p>
    </div>
  </div>
);

export default FormBuilderLoadingFallback;
