import { Check } from 'lucide-react';

export const SidebarStepper = ({ currentStep }: { currentStep: number }) => {
  const getStepStyles = (step: number) => {
    const isActive = step === currentStep;
    const isCompleted = step < currentStep;
    return {
      circle: `flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold ${
        isActive ? 'bg-blue text-white' : isCompleted ? 'bg-blue text-white' : 'bg-gray-450 text-white'
      }`,
      text: `text-base font-medium ${isActive ? 'text-black-blue' : isCompleted ? 'text-black-blue' : 'text-gray-600'}`,
      content: isCompleted ? <Check className="w-3.5 h-3.5 stroke-white" /> : step,
    };
  };

  return (
    <div className="w-64 bg-gray-0 rounded-lg p-2xl">
      <div className="space-y-sm">
        {/* Step 1: Find details */}
        <div className="flex items-center space-x-md">
          <div className={getStepStyles(1).circle}>{getStepStyles(1).content}</div>
          <div className="flex-1 min-w-0">
            <h3 className={getStepStyles(1).text}>Verify</h3>
          </div>
        </div>

        {/* Step 2: Collect Confirmations */}
        <div className="flex items-center space-x-md">
          <div className={getStepStyles(2).circle}>{getStepStyles(2).content}</div>
          <div className="flex-1 min-w-0">
            <h3 className={getStepStyles(2).text}>Confirm</h3>
          </div>
        </div>

        {/* Step 3: Recover wallet */}
        <div className="flex items-center space-x-md">
          <div className={getStepStyles(3).circle}>{getStepStyles(3).content}</div>
          <div className="flex-1 min-w-0">
            <h3 className={getStepStyles(3).text}>Recover</h3>
          </div>
        </div>
      </div>
    </div>
  );
};
