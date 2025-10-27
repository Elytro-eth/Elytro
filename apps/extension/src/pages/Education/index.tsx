import WalletImg from '@/assets/wallet.png';
import ContactsImg from '@/assets/contacts.png';
import PasscodeImg from '@/assets/passcode.png';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';
import { navigateTo } from '@/utils/navigation';
import FullPageWrapper from '@/components/biz/FullPageWrapper';
import DoorImg from '@/assets/door.png';

const STEPS = [
  {
    title: 'Elytro is a new kind of wallet',
    img: DoorImg,
    noDescription: true,
  },
  {
    title: 'There’s no seed phrase to remember',
    img: WalletImg,
  },
  {
    title: 'Built entirely on Ethereum mainnet',
    img: PasscodeImg,
  },
  {
    title: 'You wallet is recoverable',
    img: ContactsImg,
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
    <FullPageWrapper className="h-full flex flex-col items-center justify-center">
      <div>
        <img src={STEPS[currentStep].img} alt={STEPS[currentStep].title} className="size-[220px] mb-10" />

        {STEPS[currentStep].noDescription ? null : (
          <div className="w-full text-center text-[#95979C] text-sm font-normal">A new kind of wallet</div>
        )}
      </div>
      <h1 className="font-medium text-3xl text-center mt-md">{STEPS[currentStep].title}</h1>
      <Button className="w-full mt-9 text-lg font-medium" onClick={handleNext}>
        {currentStep < STEPS.length - 1 ? 'Next' : 'Create wallet'}
      </Button>
    </FullPageWrapper>
  );
};

export default Education;
