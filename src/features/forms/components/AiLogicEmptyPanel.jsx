const AiLogicEmptyPanel = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <img 
        src="https://gw.alipayobjects.com/zos/antfincdn/ZHxpyaYfgs/Empty.svg" 
        alt="Empty" 
        className="h-16 mb-4 opacity-50"
      />
      <span className="text-gray-500 font-medium mb-2">No AI Logic Configured</span>
      <p className="text-gray-400 text-sm max-w-xs">
        Configure AI rules to automate responses and actions based on
        submission data.
      </p>
    </div>
  );
};

export default AiLogicEmptyPanel;
