import { navigateTo, SidePanelRoutePath } from '@/utils/navigation';
import LogoIcon from '@/assets/logo.svg';

const AddOns = [
  {
    name: 'Social Recovery',
    logo: LogoIcon,
    url: '/recovery-setting' as SidePanelRoutePath,
  },
  {
    name: 'Sign with 2FA',
    logo: LogoIcon,
    url: '/settings/security-hook' as SidePanelRoutePath,
  },
  {
    name: 'Fast Signing',
    logo: LogoIcon,
    url: '/settings/fast-signing' as SidePanelRoutePath,
  },
];

const Item = ({ name, logo, url }: { name: string; logo: string; url: string }) => {
  return (
    <div
      className="flex flex-col gap-y-2 cursor-pointer border border-gray-300 rounded-md p-lg hover:bg-gray-150"
      onClick={() => navigateTo('side-panel', url as SidePanelRoutePath)}
    >
      <div className="flex flex-row">
        <img src={logo} alt={name} className="size-10 rounded-full border border-gray-300 p-1 bg-white" />
      </div>

      <div className="flex flex-col gap-y-2">
        <div className="elytro-text-small-bold">{name}</div>
      </div>
    </div>
  );
};

export default function AddOnsTab() {
  return (
    <>
      <div className="grid grid-cols-3 gap-x-2 gap-y-2 px-lg">
        {AddOns.map((addOn) => (
          <Item key={addOn.name} {...addOn} />
        ))}
      </div>

      <div className="elytro-text-tiny-body mt-2xl text-center text-gray-450">
        <a href="https://t.me/+l9coqJq9QHgyYjI1" target="_blank" rel="noopener noreferrer">
          Interested in developing new Add-ons?
        </a>
      </div>
    </>
  );
}
