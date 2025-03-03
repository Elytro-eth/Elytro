import ContactsImg from '@/assets/contacts.png';
import TipItem from '@/components/biz/TipItem';
import { Button } from '@/components/ui/button';
import { Clock, Mail, Shield } from 'lucide-react';

export default function RecoverGuide({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-col gap-y-xl">
      <img src={ContactsImg} className="size-36" />
      <div className="elytro-text-subtitle">How recovery contact works</div>
      <div>
        <TipItem
          title="1. Each account has own contacts"
          description="You will need to add recovery contacts for each of your Elytro accounts."
          Icon={Mail}
        />
        <TipItem
          title="2. Add by address or email"
          description="Each contact can be stored either as an account address contact or an email contact "
          Icon={Shield}
        />
        <TipItem
          title="3. Contacts help you recover"
          description="If you lost access of the account, recovery contacts can confirm the recovery so you can regain access"
          Icon={Clock}
        />
      </div>
      <Button onClick={onClick}>Get Started</Button>
    </div>
  );
}
