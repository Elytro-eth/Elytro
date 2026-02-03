import { useState } from 'react';
import { Button } from '@elytro/ui';
import { bgWalletLg, bgContactsLg, bgPasscodeLg } from '@elytro/ui/assets';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import FullPageWrapper from '@/components/biz/FullPageWrapper';

const STEPS = [
  {
    title: 'Elytro is a new kind of wallet',
    img: bgWalletLg,
    noDescription: true,
  },
  {
    title: 'No seed phrase to remember',
    img: bgPasscodeLg,
  },
  {
    title: 'Different network, different address',
    img: bgWalletLg,
  },
  {
    title: 'Your wallet is recoverable',
    img: bgContactsLg,
  },
];

const Education = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreateAccount);
    }
  };

  return (
    <FullPageWrapper className={`h-full flex flex-col items-center justify-center page-fade-in`}>
      <div key={currentStep} className="page-fade-in">
        <img src={STEPS[currentStep].img} alt={STEPS[currentStep].title} className="width-full mb-10" />

        {STEPS[currentStep].noDescription ? null : (
          <div className="w-full text-left text-gray-600 text-base font-normal">A new kind of wallet</div>
        )}
      </div>
      <h1 key={`title-${currentStep}`} className="font-bold text-4xl text-left mt-md page-fade-in">
        {STEPS[currentStep].title}
      </h1>
      <Button className="w-full mt-9 text-lg font-bold" onClick={handleNext}>
        {currentStep < STEPS.length - 1 ? 'Next' : 'Create wallet'}
      </Button>
    </FullPageWrapper>
  );
};

export default Education;
