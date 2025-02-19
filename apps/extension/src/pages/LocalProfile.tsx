import { useState } from 'react';
import ChangePasswordModal from '@/components/biz/ChangePasswordModal';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';

export default function LocalProfile() {
  const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
  return (
    <SecondaryPageWrapper title="Device Profile">
      <div className="space-y-2">
        <div
          className="elytro-rounded-border-item-wrapper hover:bg-gray-150"
          onClick={() => setOpenChangePasswordModal(true)}
        >
          Change passcode
        </div>
      </div>
      {openChangePasswordModal && (
        <ChangePasswordModal
          open={openChangePasswordModal}
          handleOnOpenChange={() => setOpenChangePasswordModal(false)}
        />
      )}
    </SecondaryPageWrapper>
  );
}
