import ContactsImg from '@/assets/contacts.png';
import { Button } from '@/components/ui/button';
import step1Img from '@/assets/guides/rc_1.png';
import step2Img from '@/assets/guides/rc_2.png';
import step3Img from '@/assets/guides/rc_3.png';
import { useState } from 'react';
import { cn } from '@/utils/shadcn/utils';

interface RecoverGuideProps {
  onClick: () => void;
}

const STEPS = [
  {
    image: ContactsImg,
    title: 'How Recovery works',
  },
  {
    image: step1Img,
    title: 'Add recovery contacts for each wallet',
  },
  {
    image: step2Img,
    title: 'Recovery contacts confirm recovery if lost',
  },
  {
    image: step3Img,
    title: 'Finalize recovery after 48 hours',
  },
];

export default function RecoverGuide({ onClick }: RecoverGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
    if (currentStep === STEPS.length - 1) {
      onClick();
    }
  };

  return (
    <div className="flex flex-col w-full transition-all duration-500 items-center justify-center">
      <div className="mt-10">
        <img
          src={STEPS[currentStep].image}
          alt={STEPS[currentStep].title}
          className={cn('mb-10 mx-auto', currentStep === 0 ? 'size-[180px]' : 'w-[90%]')}
        />

        {currentStep === 0 ? null : (
          <div className="w-full text-center text-[#95979C] text-sm font-normal">How Recovery works</div>
        )}
      </div>
      <h1 className="font-bold text-3xl text-center mt-md">{STEPS[currentStep].title}</h1>
      <Button className="w-full mt-9 text-lg font-medium" onClick={handleNext}>
        Next
      </Button>
    </div>
  );
}
