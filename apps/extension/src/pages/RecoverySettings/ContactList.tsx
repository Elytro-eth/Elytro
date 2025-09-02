import ContactItem from '@/components/biz/ContactItem';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from '@/contexts/account-context';
import { useTx } from '@/contexts/tx-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { Box, LockIcon, PencilLine, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ContactsImg from '@/assets/contacts.png';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { cn } from '@/utils/shadcn/utils';
import { setLocalContacts, setLocalThreshold } from '@/utils/contacts';
// import { writeFile } from '@/utils/file';
// import dayjs from 'dayjs';

interface IContactListProps {
  contacts: TRecoveryContact[];
  threshold: string;
  setThreshold: (threshold: string) => void;
  onAddContact: () => void;
  onEditContact: (contact: TRecoveryContact) => void;
  onDeleteContact: (contact: TRecoveryContact) => void;
  isPrivacyMode: boolean;
}

export default function ContactList({
  contacts,
  threshold,
  setThreshold,
  onAddContact,
  onEditContact,
  onDeleteContact,
  isPrivacyMode,
}: IContactListProps) {
  const { currentAccount: currentAccount } = useAccount();
  const { wallet } = useWallet();
  const { handleTxRequest } = useTx();
  const [loading, setLoading] = useState(false);
  const isEmptyContacts = contacts.length === 0;

  const handleConfirmContacts = async () => {
    try {
      setLoading(true);
      const contactAddresses = contacts.map((contact) => contact.address);

      const isChanged = await wallet.checkRecoveryContactsSettingChanged(contactAddresses, Number(threshold));

      if (!isChanged) {
        toast({
          title: 'No changes',
          description: '',
        });
        setLoading(false);
        return;
      }

      const txs = await wallet.generateRecoveryContactsSettingTxs(contactAddresses, Number(threshold), isPrivacyMode);

      handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs);

      await Promise.all([
        setLocalContacts(currentAccount.address, contacts),
        setLocalThreshold(currentAccount.address, threshold),
      ]);
    } catch (error) {
      toast({
        title: 'Failed',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // const handleDownloadRecoveryContacts = async () => {
  //   const { contacts, threshold } = await getLocalContactsSetting(currentAccount.address);

  //   const isOnchainContactsChanged = await wallet.checkRecoveryContactsSettingChanged(
  //     contacts.map((contact) => contact.address),
  //     Number(threshold)
  //   );

  //   if (isOnchainContactsChanged) {
  //     toast({
  //       title: 'Local recovery contacts setting is not the same as onchain',
  //       description:
  //         'We are not able to download the recovery contacts because the local setting is not the same as onchain.',
  //     });
  //     return;
  //   }

  //   const date = dayjs().format('YYYY-MM-DD-HH-mm');
  //   const data = {
  //     address: currentAccount.address,
  //     chainId: currentAccount.chainId,
  //     contacts,
  //     threshold: String(threshold),
  //   };
  //   writeFile(JSON.stringify(data), `${currentAccount.address}-elytro-recovery-contacts-${date}.json`);
  //   toast({
  //     title: 'Recovery contacts downloaded',
  //     description: 'You can find it in the Downloads folder',
  //   });
  // };

  return (
    <div className="flex flex-col justify-between">
      {isPrivacyMode && (
        <div className="w-full px-4 py-3 mb-4 bg-light-purple rounded-xl inline-flex justify-start items-center gap-1">
          <LockIcon className="size-3 stroke-purple" />
          <span className="flex-1 justify-center text-purple text-xs leading-none">Private mode</span>
        </div>
      )}
      <div className="flex flex-col gap-y-md">
        <h2 className="elytro-text-small-bold text-gray-600">Your wallet</h2>

        {/* Operation Bar */}
        <div className="flex flex-row justify-between">
          <ShortedAddress address={currentAccount.address} chainId={currentAccount.chainId} />
        </div>

        {/* <HelperText
          title="How does it work?"
          description="Add 2–3 recovery social contacts via email or wallet address, so they can help you regain access later."
        /> */}

        {contacts?.length ? (
          <div className="flex flex-col gap-y-sm">
            <div className="flex flex-row justify-between items-center mt-4">
              <h2 className="elytro-text-small-bold text-gray-600">Your recovery contacts</h2>

              {isEmptyContacts ? null : (
                <Button className="group" variant="secondary" size="tiny" onClick={onAddContact}>
                  <Plus className="size-3 mr-1 group-hover:stroke-gray-0" />
                  Add
                </Button>
              )}
            </div>

            {contacts.map((contact) => (
              <ContactItem
                key={contact.address}
                contact={contact}
                rightContent={
                  <div className="flex items-center gap-x-sm flex-shrink-0">
                    <PencilLine
                      onClick={() => onEditContact(contact)}
                      className="size-xl cursor-pointer stroke-gray-600 hover:stroke-gray-900"
                    />
                    <Trash2
                      onClick={() => onDeleteContact(contact)}
                      className="size-xl cursor-pointer stroke-gray-600 hover:stroke-gray-900"
                    />
                  </div>
                }
              />
            ))}

            <div>
              <h2 className="elytro-text-small-bold text-gray-600 mt-4 mb-2">Confirmations required</h2>

              <div className="flex flex-row gap-x-md items-center">
                <Select value={threshold} onValueChange={setThreshold}>
                  <SelectTrigger
                    className={cn('w-fit', Number(threshold) < 1 && 'border-red')}
                    disabled={contacts.length === 0}
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="elytro-select-content">
                    {Array.from({ length: contacts.length }, (_, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="elytro-text-small-bold">out of {contacts.length} contacts need to confirm</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-y-md items-center mt-4xl">
            <img src={ContactsImg} className="size-36" />
            <span className="elytro-text-subtitle text-center">Add a new contact</span>

            <Button variant="secondary" size="tiny" onClick={onAddContact}>
              <Plus className="h-4 w-4 mr-1 stroke-[1.5px] group-hover:stroke-white" />
              Add contact
            </Button>
          </div>
        )}

        <Button className="w-full" disabled={loading || !threshold} onClick={handleConfirmContacts}>
          <Box className="size-4 mr-sm" color="#cce1ea" />
          {loading ? 'Confirming...' : !isPrivacyMode ? 'Confirm contacts' : 'Confirm contacts privately'}
        </Button>
      </div>

      {/* {!isEmptyContacts && (
        <div className="flex flex-row justify-end items-center mt-4">
          <Button variant="link" onClick={handleDownloadRecoveryContacts}>
            Download recovery contacts
          </Button>
        </div>
      )} */}
    </div>
  );
}
