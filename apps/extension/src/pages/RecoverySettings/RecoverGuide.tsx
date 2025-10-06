import ContactsImg from '@/assets/contacts.png';
import TipItem from '@/components/biz/TipItem';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/shadcn/utils';
import { Clock, WalletCards, Shield, Lock } from 'lucide-react';

interface RecoverGuideProps {
  onClick: () => void;
  isPrivacyMode: boolean;
  onPrivacyModeChange: (isPrivacyMode: boolean) => void;
}

export default function RecoverGuide({ onClick, isPrivacyMode, onPrivacyModeChange }: RecoverGuideProps) {
  return (
    <div className="flex flex-col w-full transition-all duration-500">
      {/* Privacy mode switch */}
      <div className="grid grid-cols-2 bg-gray-150 rounded-md text-center p-2xs">
        <div
          className={cn('px-md py-xs rounded-sm font-medium cursor-pointer', !isPrivacyMode && 'bg-white font-medium')}
          onClick={() => onPrivacyModeChange(false)}
        >
          Standard
        </div>
        <div
          className={cn(
            'flex flex-row items-center gap-x-1 px-md py-xs rounded-sm font-medium justify-center cursor-pointer',
            isPrivacyMode && 'bg-white font-medium'
          )}
          onClick={() => onPrivacyModeChange(true)}
        >
          <Lock className="size-4" />
          Private
        </div>
      </div>
      <div className="flex flex-col gap-y-xl items-center mt-10 ">
        <img src={ContactsImg} className="size-36" />
        <div className="elytro-text-subtitle text-center text-dark-blue">
          How Recovery works
          {isPrivacyMode && (
            <>
              <br />
              <span className="text-gray-500">(Private)</span>
            </>
          )}
        </div>
        {!isPrivacyMode && (
          <div>
            <TipItem title="Each wallet has own contacts" description="" Icon={WalletCards} />
            <TipItem title="Add contact by address" description="" Icon={Shield} />
            <TipItem title="Contacts help you recover" description="" Icon={Clock} />
          </div>
        )}
        {isPrivacyMode && (
          <div>
            <TipItem title="Each wallet has own contacts" description="" Icon={WalletCards} />
            <TipItem title="Keep a recovery file off-chain" description="" Icon={Shield} />
            <TipItem
              title="Recovery info revealed after contacts help your regain access"
              description=""
              Icon={Clock}
            />
          </div>
        )}
        <Button onClick={onClick} className="w-full">
          Get started
        </Button>
      </div>
    </div>
  );
}
