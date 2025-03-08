import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { navigateTo } from '@/utils/navigation';
import { SIDE_PANEL_ROUTE_PATHS } from '@/routes';

export default function LocalProfile() {
  return (
    <SecondaryPageWrapper title="Device profile">
      <div className="space-y-2">
        <div
          className="elytro-rounded-border-item-wrapper hover:bg-gray-150"
          onClick={() =>
            navigateTo('side-panel', SIDE_PANEL_ROUTE_PATHS.ChangePassword)
          }
        >
          Change passcode
        </div>
      </div>
    </SecondaryPageWrapper>
  );
}
