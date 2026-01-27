import ContactItem from '@/components/biz/ContactItem';
import { Button } from '@/components/ui/button';
import { useAccount } from '@/contexts/account-context';
import { useTx } from '@/contexts/tx-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { Box, Minus, PencilLine, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ContactsImg from '@/assets/contacts.png';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { cn } from '@/utils/shadcn/utils';
import { setLocalContacts, setLocalThreshold } from '@/utils/contacts';
import HelperText from '@/components/ui/HelperText';
import Copy from '@/components/ui/Copy';

interface IContactListProps {
  contacts: TRecoveryContact[];
  threshold: string;
  setThreshold: (threshold: string) => void;
  onAddContact: () => void;
  onEditContact: (contact: TRecoveryContact) => void;
  onDeleteContact: (contact: TRecoveryContact) => void;
  hasOnchainContacts: boolean;
}

export default function ContactList({
  contacts,
  threshold,
  setThreshold,
  onAddContact,
  onEditContact,
  onDeleteContact,
  hasOnchainContacts,
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
      const thresholdNumber = contacts.length === 0 ? 0 : Number(threshold);

      // If clearing all contacts, allow threshold to be 0
      const isClearing = contacts.length === 0 && hasOnchainContacts;

      if (!isClearing && (!threshold || Number(threshold) < 1)) {
        toast({
          title: 'Please set threshold',
          description: '',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const isChanged = await wallet.checkRecoveryContactsSettingChanged(contactAddresses, thresholdNumber);

      if (!isChanged) {
        toast({
          title: 'No changes',
          description: '',
        });
        setLoading(false);
        return;
      }

      const txs = await wallet.generateRecoveryContactsSettingTxs(contactAddresses, thresholdNumber, false);

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

  return (
    <div className="flex flex-col justify-between">
      <div className="flex flex-col gap-y-sm">
        <div className="flex flex-row items-center gap-x-md px-4 py-3 rounded-md bg-gray-50">
          <span className="elytro-text-small-bold">Your wallet</span>
          <div className="flex flex-row items-center gap-x-2 ml-auto">
            <ShortedAddress address={currentAccount.address} chainId={currentAccount.chainId} className="bg-gray-50" />
            <Copy text={currentAccount.address} size="sm" iconOnly />
          </div>
        </div>

        <HelperText description="Take a note of your address in case of recovery." />

        {contacts?.length ? (
          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-center my-4">
              <h2 className="elytro-text-small text-gray-600">Your recovery contacts</h2>

              {isEmptyContacts ? null : (
                <Button className="group" variant="secondary" size="tiny" onClick={onAddContact}>
                  <Plus className="size-3 mr-1" />
                  Add
                </Button>
              )}
            </div>

            <div className="rounded-md overflow-hidden">
              {contacts.map((contact, index) => (
                <ContactItem
                  key={contact.address}
                  contact={contact}
                  isFirst={index === 0}
                  isLast={index === contacts.length - 1}
                  rightContent={
                    <div className="flex items-center gap-x-sm flex-shrink-0">
                      <PencilLine
                        onClick={() => onEditContact(contact)}
                        className="size-4 cursor-pointer stroke-gray-600 hover:stroke-gray-900"
                      />
                      <Trash2
                        onClick={() => onDeleteContact(contact)}
                        className="size-4 cursor-pointer stroke-gray-600 hover:stroke-gray-900"
                      />
                    </div>
                  }
                />
              ))}
            </div>

            <div className="mb-2">
              <h2 className="elytro-text-small text-gray-600 mt-4 mb-2">Confirmations</h2>

              <div className="flex flex-row items-center gap-x-md px-4 py-3 rounded-md bg-gray-50 justify-between">
                <span className="elytro-text-small-bold flex-shrink-0">Minimum required</span>
                <div className="flex flex-row items-center gap-x-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const current = Number(threshold) || 1;
                      if (current > 1) {
                        setThreshold((current - 1).toString());
                      }
                    }}
                    disabled={contacts.length === 0 || Number(threshold) <= 1}
                    className={cn(
                      'size-8 rounded-full border border-gray-300 bg-white flex items-center justify-center flex-shrink-0',
                      'disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
                    )}
                  >
                    <Minus className="size-4 stroke-gray-600" />
                  </button>
                  <span className="elytro-text-small-bold text-center">
                    {threshold || '1'} of {contacts.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = Number(threshold) || 0;
                      if (current < contacts.length) {
                        setThreshold((current + 1).toString());
                      }
                    }}
                    disabled={contacts.length === 0 || Number(threshold) >= contacts.length}
                    className={cn(
                      'group size-8 rounded-full bg-blue-300 flex items-center justify-center flex-shrink-0',
                      'disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-450 transition-colors'
                    )}
                  >
                    <Plus className="size-4 stroke-gray-900 group-hover:stroke-white" />
                  </button>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={loading || !threshold || Number(threshold) < 1}
              onClick={handleConfirmContacts}
            >
              <Box className="size-4 mr-sm stroke-white" />
              {loading ? 'Confirming...' : 'Confirm contacts'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-y-md">
            <div className="flex flex-col gap-y-md items-center mt-4xl">
              <img src={ContactsImg} className="size-36" />
              <span className="elytro-text-subtitle text-center">Add a new contact</span>

              <Button variant="secondary" className="w-full mt-4" onClick={onAddContact}>
                <Plus className="h-4 w-4 mr-1 stroke-[1.5px] group-hover:stroke-white" />
                Add contact
              </Button>
            </div>
            {hasOnchainContacts && (
              <Button className="w-full mt-4" disabled={loading} variant="destructive" onClick={handleConfirmContacts}>
                <Box className="size-4 mr-sm stroke-white" />
                {loading ? 'Clearing...' : 'Clear recovery settings'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
