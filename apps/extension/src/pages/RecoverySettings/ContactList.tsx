import ContactItem from '@/components/biz/ContactItem';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from '@/contexts/account-context';
import { useTx } from '@/contexts/tx-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { Box, PencilLine, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ContactsImg from '@/assets/contacts.png';
import ShortedAddress from '@/components/ui/ShortedAddress';
import { cn } from '@/utils/shadcn/utils';

interface IContactListProps {
  contacts: TRecoveryContact[];
  threshold: string;
  setThreshold: (threshold: string) => void;
  onAddContact: () => void;
  onEditContact: (contact: TRecoveryContact) => void;
  onDeleteContact: (contact: TRecoveryContact) => void;
}

export default function ContactList({
  contacts,
  threshold,
  setThreshold,
  onAddContact,
  onEditContact,
  onDeleteContact,
}: IContactListProps) {
  const { currentAccount: currentAccount } = useAccount();
  const { wallet } = useWallet();
  const { handleTxRequest } = useTx();
  const [loading, setLoading] = useState(false);

  const isEmptyContacts = contacts.length === 0;

  const [isRecoverContactChanged, setIsRecoverContactChanged] = useState(false);
  const isAddressChanged = useRef(false);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!active) return;
      isAddressChanged.current = await wallet.checkRecoveryContactsSettingChanged(
        contacts.map((contact) => contact.address),
        Number(threshold)
      );

      if (!active) return;
      setIsRecoverContactChanged(isAddressChanged.current);
    }

    check();
    return () => {
      active = false;
    };
  }, [contacts, threshold, wallet, isAddressChanged]);

  const handleConfirmContacts = async () => {
    try {
      setLoading(true);

      const txs = await wallet.generateRecoveryContactsSettingTxs(
        contacts.map((contact) => contact.address),
        Number(threshold)
      );
      handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs);
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
      <div className="flex flex-col gap-y-md">
        <h2 className="elytro-text-small-bold text-gray-600 mt-4">Your wallet</h2>

        {/* Operation Bar */}
        <div className="flex flex-row justify-between">
          <ShortedAddress address={currentAccount.address} chainId={currentAccount.chainId} />

          {isEmptyContacts ? null : (
            <Button className="group" variant="secondary" size="tiny" onClick={onAddContact}>
              <Plus className="size-3 mr-1 group-hover:stroke-gray-0" />
              Add
            </Button>
          )}
        </div>

        {/* <HelperText
          title="How does it work?"
          description="Add 2–3 recovery social contacts via email or wallet address, so they can help you regain access later."
        /> */}

        {contacts?.length ? (
          <div className="flex flex-col gap-y-sm">
            <h2 className="elytro-text-small-bold text-gray-600 mt-4">Your recovery contacts</h2>
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

        <Button className="w-full mt-10" disabled={loading || !isRecoverContactChanged} onClick={handleConfirmContacts}>
          <Box className="size-4 mr-sm" color="#cce1ea" />
          {loading ? 'Confirming...' : 'Confirm contacts'}
        </Button>
      </div>
    </div>
  );
}
