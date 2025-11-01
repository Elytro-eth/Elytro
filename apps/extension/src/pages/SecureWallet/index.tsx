import CurrentAddress from '@/components/biz/CurrentAddress';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import ContactsIcon from '@/assets/contacts.png';
import PasscodeIcon from '@/assets/passcode.png';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';

const Item = ({
  title,
  description,
  icon,
  tag,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  tag?: string;
  onClick?: () => void;
}) => {
  return (
    <div
      className={'flex items-center gap-x-4  px-4 py-5 rounded-lg border border-gray-300 cursor-pointer'}
      onClick={onClick}
    >
      <img src={icon} alt={title} className="size-[70px]" />
      <div className="flex flex-col gap-y-2 min-w-0 flex-1">
        <div className="flex items-center gap-x-2 min-w-0 overflow-hidden">
          <span className="font-medium text-lg text-dark-blue truncate flex-shrink-0 min-w-0">{title}</span>
          {tag && (
            <span className="font-medium text-sm text-dark-blue bg-light-green rounded-2xs px-2 py-1 flex-shrink whitespace-nowrap overflow-hidden text-ellipsis">
              {tag}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default function SecureWallet() {
  return (
    <SecondaryPageWrapper title="Secure wallet">
      <div className="flex flex-col items-center gap-y-2xs">
        <h1 className="text-3xl font-bold text-dark-blue">Secure your wallet</h1>
        <p className="text-sm text-gray-600">In case you lose access to your wallet</p>
        <CurrentAddress className="mt-2 bg-gray-150" />
      </div>

      <div className="flex flex-col gap-y-md mt-3xl">
        <Item
          title="Social Recovery"
          description="Set up trusted wallets or friends to help you recover this wallet."
          icon={ContactsIcon}
          tag="Recommended"
          onClick={() => {
            navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.RecoverySetting);
          }}
        />
        <Item
          title="Local Backup"
          description="Keep an encrypted file to restore all your local wallets anytime."
          icon={PasscodeIcon}
          onClick={() => {
            navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.ExportBackup);
          }}
        />
      </div>
    </SecondaryPageWrapper>
  );
}
