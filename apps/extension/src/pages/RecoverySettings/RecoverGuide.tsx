import ContactsImg from '@/assets/contacts.png';
import TipItem from '@/components/biz/TipItem';
import { Button } from '@/components/ui/button';
import { Clock, WalletCards, Shield } from 'lucide-react';

export default function RecoverGuide({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col gap-y-xl items-center mt-10 ">
      <img src={ContactsImg} className="size-36" />
      <div className="elytro-text-subtitle text-center text-dark-blue">How Recovery works</div>
      <div>
        <TipItem
          title="Each wallet has own contacts"
          description="Add recovery contacts for each wallet."
          Icon={WalletCards}
        />
        <TipItem title="Add contact by address" description="Contact will be stored on chain." Icon={Shield} />
        <TipItem title="Contacts help you recover" description="Regain access once contacts confirmed." Icon={Clock} />
      </div>
      <Button onClick={onClick} className="w-full">
        Get started
      </Button>
    </div>
  );
}
