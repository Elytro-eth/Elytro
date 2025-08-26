export const SidebarStepper = () => {
  return (
    <div className="w-64 bg-gray-0 rounded-lg p-2xl">
      <div className="space-y-sm">
        {/* Step 1: Find details - Active */}
        <div className="flex items-center space-x-md">
          <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold bg-blue text-white">
            1
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-black-blue">Find details</h3>
          </div>
        </div>

        {/* Step 2: Collect Confirmations - Inactive */}
        <div className="flex items-center space-x-md">
          <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold bg-gray-450 text-white">
            2
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-600">Collect Confirmations</h3>
          </div>
        </div>

        {/* Step 3: Recover wallet - Inactive */}
        <div className="flex items-center space-x-md">
          <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold bg-gray-450 text-white">
            3
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-600">Recover wallet</h3>
          </div>
        </div>
      </div>
    </div>
  );
};
