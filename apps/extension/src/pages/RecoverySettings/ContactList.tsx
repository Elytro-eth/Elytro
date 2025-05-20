import ContactItem from '@/components/biz/ContactItem';
import { Button } from '@/components/ui/button';
import HelperText from '@/components/ui/HelperText';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount } from '@/contexts/account-context';
import { useTx } from '@/contexts/tx-context';
import { TxRequestTypeEn } from '@/contexts/tx-context';
import { useWallet } from '@/contexts/wallet';
import { toast } from '@/hooks/use-toast';
import { PencilLine, Plus, Trash2 } from 'lucide-react';
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
  const [isAddressChanged, setIsAddressChanged] = useState(false);

  // 本地联系人name存储
  function getLocalContacts(address: string): TRecoveryContact[] {
    try {
      const raw = localStorage.getItem(`recovery_contacts_${address}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  const initialNamesRef = useRef<{ [address: string]: string }>({});
  useEffect(() => {
    const localContacts = getLocalContacts(currentAccount.address);
    const map: { [address: string]: string } = {};
    localContacts.forEach((c) => {
      map[c.address] = c.name || '';
    });
    initialNamesRef.current = map;
  }, [currentAccount.address]);

  useEffect(() => {
    let active = true;
    async function check() {
      if (!active) return;
      const addressChanged = await wallet.checkRecoveryContactsSettingChanged(
        contacts.map((contact) => contact.address),
        Number(threshold)
      );
      const nameChanged = contacts.some((contact) => {
        const initialName = initialNamesRef.current[contact.address] || '';
        return (contact.name || '') !== initialName;
      });

      if (!active) return;
      setIsAddressChanged(addressChanged);
      setIsRecoverContactChanged(addressChanged || nameChanged);
    }
    check();
    return () => {
      active = false;
    };
  }, [contacts, threshold, wallet, currentAccount.address]);

  const handleConfirmContacts = async () => {
    try {
      setLoading(true);

      if (isAddressChanged) {
        const txs = await wallet.generateRecoveryContactsSettingTxs(
          contacts.map((contact) => contact.address),
          Number(threshold)
        );
        handleTxRequest(TxRequestTypeEn.ApproveTransaction, txs);
      } else {
        const localContacts = getLocalContacts(currentAccount.address);
        const updatedContacts = contacts.map((contact) => {
          const local = localContacts.find((lc) => lc.address === contact.address);
          return {
            address: contact.address,
            name: contact.name || local?.name || '',
          };
        });
        localStorage.setItem(`recovery_contacts_${currentAccount.address}`, JSON.stringify(updatedContacts));
        // 更新初始name映射
        const map: { [address: string]: string } = {};
        updatedContacts.forEach((c) => {
          map[c.address] = c.name || '';
        });
        initialNamesRef.current = map;
        setIsRecoverContactChanged(false);
        toast({
          title: 'Success',
          description: 'Contact names updated successfully',
          variant: 'default',
        });
      }
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
        <h1 className="elytro-text-bold-body">Your recovery contacts</h1>

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

        <HelperText
          title="How does it work?"
          description="Add 2–3 recovery social contacts via email or wallet address, so they can help you regain access later."
        />

        {contacts?.length ? (
          <div className="flex flex-col gap-y-sm">
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

            <div className="mt-xl">
              <h1 className="elytro-text-bold-body mb-2xs">Signatures required</h1>

              <p className="elytro-text-smaller-body text-gray-600 mb-md">
                Number of confirmations needed for recovery
              </p>

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

                <span className="elytro-text-small-bold">out of {contacts.length} contacts</span>
              </div>
            </div>

            <Button
              className="w-full mt-10"
              disabled={loading || Number(threshold) < 1 || !isRecoverContactChanged}
              onClick={handleConfirmContacts}
            >
              {loading ? 'Confirming...' : 'Confirm contacts'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-y-md items-center mt-4xl">
            <img src={ContactsImg} className="size-36" />
            <span className="elytro-text-subtitle">Add a new contact</span>

            <Button variant="secondary" size="tiny" onClick={onAddContact}>
              <Plus className="h-4 w-4 mr-1 stroke-[1.5px] group-hover:stroke-white" />
              Add contact
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
