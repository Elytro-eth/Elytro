import { Check } from 'lucide-react';
import { ShortedAddress } from '@elytro/ui';
import { CHAIN_LOGOS } from '@/constants/chains';

interface SidebarStepperProps {
  currentStep: number;
  address?: string;
  chainId?: number;
}

export const SidebarStepper = ({ currentStep, address, chainId }: SidebarStepperProps) => {
  const getStepStyles = (step: number) => {
    const isActive = step === currentStep;
    const isCompleted = step < currentStep;
    return {
      circle: `flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-sm font-bold ${
        isActive ? 'bg-blue-750 text-white' : isCompleted ? 'bg-green-300 text-blue-900' : 'bg-gray-450 text-white'
      }`,
      text: `text-base font-medium ${isActive ? 'text-blue-900' : isCompleted ? 'text-blue-900' : 'text-gray-600'}`,
      content: isCompleted ? <Check className="w-3.5 h-3.5" /> : step,
    };
  };

  return (
    <div className="w-64 bg-gray-0 rounded-lg p-2xl">
      {address && chainId && (
        <>
          <div className="mb-lg">
            <h2 className="text-small-bold text-blue-900 mb-sm">Account in recovery</h2>
            <ShortedAddress
              address={address}
              chainIconUrl={CHAIN_LOGOS[chainId]}
              className="bg-gray-150 px-4 rounded-sm"
            />
          </div>
          <div className="border-t border-gray-300 mb-lg" />
        </>
      )}
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
