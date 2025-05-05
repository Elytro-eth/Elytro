import ContactsImg from '@/assets/contacts.png';
import TipItem from '@/components/biz/TipItem';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Shield } from 'lucide-react';

export default function RecoverGuide({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col gap-y-xl items-center mt-10">
      <img src={ContactsImg} className="size-36" />
      <div className="elytro-text-subtitle text-center">
        How recovery
        <br />
        contact works
      </div>
      <div>
        <TipItem
          title="1. Each wallet has own contacts"
          description="Add recovery contacts for each wallet."
          Icon={Mail}
        />
        <TipItem title="2. Add by address or email" description="Contact can be stored in either ways." Icon={Shield} />
        <TipItem
          title="3. Contacts help you recover"
          description="Recovery contacts need to confirm the recovery."
          Icon={Clock}
        />
      </div>
      <Button onClick={onClick} className="w-full">
        Get Started
      </Button>
    </div>
  );
}
