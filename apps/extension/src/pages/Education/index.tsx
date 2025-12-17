import WalletImg from '@/assets/bg-images/wallet-bg-lg.png';
import ContactsImg from '@/assets/bg-images/guardian-bg-lg.png';
import PasscodeImg from '@/assets/bg-images/key-bg-lg.png';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import DoorImg from '@/assets/bg-images/wallet-bg-lg.png';

const STEPS = [
  {
    title: 'Elytro is a new kind of wallet',
    img: DoorImg,
    noDescription: true,
  },
  {
    title: 'No seed phrase to remember',
    img: PasscodeImg,
  },
  {
    title: 'Different network, different address',
    img: WalletImg,
  },
  {
    title: 'Your wallet is recoverable',
    img: ContactsImg,
  },
];

const Education = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isStepFading, setIsStepFading] = useState(false);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setIsStepFading(true);
      // Wait for fade-out animation before changing step
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsStepFading(false);
      }, 150); // Match animation duration
    } else {
      setIsFadingOut(true);
      // Wait for fade-out animation before navigating
      setTimeout(() => {
        navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.CreateAccount);
      }, 150); // Match animation duration
    }
  };

  return (
    <FullPageWrapper
      className={`h-full flex flex-col items-center justify-center page-fade-in ${isFadingOut ? 'page-fade-out' : ''}`}
    >
      <div key={currentStep} className={`page-fade-in ${isStepFading ? 'page-fade-out' : ''}`}>
        <img src={STEPS[currentStep].img} alt={STEPS[currentStep].title} className="mb-10" />

        {STEPS[currentStep].noDescription ? null : (
          <div className="w-full text-left text-gray-600 text-base font-normal">A new kind of wallet</div>
        )}
      </div>
      <h1
        key={`title-${currentStep}`}
        className={`font-bold text-4xl text-left mt-md page-fade-in ${isStepFading ? 'page-fade-out' : ''}`}
      >
        {STEPS[currentStep].title}
      </h1>
      <Button className="w-full mt-9 text-lg font-bold" onClick={handleNext}>
        {currentStep < STEPS.length - 1 ? 'Next' : 'Create wallet'}
      </Button>
    </FullPageWrapper>
  );
};

export default Education;
