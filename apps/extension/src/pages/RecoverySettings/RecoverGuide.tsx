import { bgGuardianTop } from '@elytro/ui/assets';
import step1Img from '@/assets/guides/rc_1.png';
import step2Img from '@/assets/guides/rc_2.png';
import step3Img from '@/assets/guides/rc_3.png';
import Guide from '@/components/biz/Guide';

interface RecoverGuideProps {
  onClick: () => void;
}

const STEPS = [
  {
    image: bgGuardianTop,
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
  return <Guide steps={STEPS} showSubtitleOnSteps={true} action="Next" onAction={onClick} />;
}
