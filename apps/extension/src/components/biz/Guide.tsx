import TipItem from '@/components/biz/TipItem';
import { Button } from '@elytro/ui';
import { LucideProps } from 'lucide-react';
import { useState } from 'react';

type GuideStep = {
  image: string;
  title: string;
  imgClassName?: string;
};

interface GuideProps {
  // Single-step mode
  imgSrc?: string;
  title?: string;
  imgClassName?: string;

  // Multi-step mode
  steps?: GuideStep[];
  showSubtitleOnSteps?: boolean; // Show "How X works" subtitle on non-first steps

  // Common props
  action?: string;
  onAction: () => void;
  tips?: {
    title: string;
    description: string;
    Icon: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
  }[];
  children?: React.ReactNode;
}

export default function Guide({
  imgSrc,
  title,
  action = 'Next',
  onAction,
  tips,
  children,
  imgClassName,
  steps,
  showSubtitleOnSteps: _showSubtitleOnSteps = false,
}: GuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Multi-step mode
  const isMultiStep = !!steps && steps.length > 0;
  const currentStepData = isMultiStep ? steps[currentStep] : null;
  const isLastStep = isMultiStep && currentStep === steps.length - 1;

  const handleAction = () => {
    if (isMultiStep && !isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      onAction();
    }
  };

  // Determine current display values
  const displayImg = currentStepData?.image || imgSrc || '';
  const displayTitle = currentStepData?.title || title || '';
  const displayImgClassName = currentStepData?.imgClassName || imgClassName || 'w-full h-full object-contain mb-3';

  return (
    <div className="flex flex-col h-full">
      {/* Full-bleed image section */}
      <div className="w-full">
        <img src={displayImg} className={displayImgClassName} />
      </div>

      {/* Content section with padding */}
      <div className="flex-1 flex flex-col px-lg">
        {/* Step indicators for multi-step mode */}
        {isMultiStep && steps.length > 1 && (
          <div className="flex gap-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                  index === currentStep ? 'bg-brown-600 text-white' : 'bg-gray-450 text-white'
                }`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        )}

        <h3 className="text-xl font-bold text-gray-900 mb-4 leading-tight">{displayTitle}</h3>

        {/* Show subtitle on non-first steps (multi-step mode) */}
        {/* {isMultiStep && showSubtitleOnSteps && currentStep > 0 && steps[0]?.title && (
          <div className="w-full text-center text-gray-500 text-sm font-normal mb-8">
            {steps[0].title}
          </div>
        )} */}

        {/* Render custom children OR default tips list */}
        {children ? (
          children
        ) : tips ? (
          <div className="flex flex-col gap-y-1 mb-8">
            {tips.map((tip) => (
              <TipItem key={tip.title} title={tip.title} description={tip.description} Icon={tip.Icon} />
            ))}
          </div>
        ) : null}

        <Button onClick={handleAction} className="w-full mt-auto">
          {action}
        </Button>
      </div>
    </div>
  );
}
