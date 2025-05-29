import ProcessingTip from '@/components/ui/ProcessingTip';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import ContactList from './ContactList';
import ContactDetail from './ContactDetail';
import { useWallet } from '@/contexts/wallet';
import { useAccount } from '@/contexts/account-context';
import RecoverGuide from './RecoverGuide';
import { toast } from '@/hooks/use-toast';
import LabelDialog, { ILabelDialogRef } from './LabelDialog';

enum ShowType {
  Guide = 'guide',
  List = 'list',
  Detail = 'detail',
}

function getLocalContacts(address: string): TRecoveryContact[] {
  try {
    const raw = localStorage.getItem(`recovery_contacts_${address}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function setLocalContacts(address: string, contacts: TRecoveryContact[]) {
  localStorage.setItem(`recovery_contacts_${address}`, JSON.stringify(contacts));
}

export default function RecoverySettings() {
  const { wallet } = useWallet();
  const {
    currentAccount: { address },
  } = useAccount();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<TRecoveryContact[]>([]);
  const [threshold, setThreshold] = useState<string>('0');
  const [showType, setShowType] = useState<ShowType>(ShowType.List);
  const labelDialogRef = useRef<ILabelDialogRef>(null);

  const getRecoveryContacts = async () => {
    try {
      setLoading(true);
      const { contacts = [], threshold = 0 } = (await wallet.queryRecoveryContactsByAddress(address)) || {};
      const localContacts = getLocalContacts(address);
      setShowType(contacts.length <= 0 ? ShowType.Guide : ShowType.List);
      setContacts(
        contacts.map((c) => {
          const local = localContacts.find((lc) => lc.address === c);
          return { address: c, label: local?.label || '' };
        })
      );
      setThreshold(threshold.toString());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecoveryContacts();
  }, []);

  const handleAddContact = () => {
    setShowType(ShowType.Detail);
  };

  const handleEditContact = (contact: TRecoveryContact) => {
    labelDialogRef.current?.open(contact);
  };

  const saveContacts = (newContacts: TRecoveryContact[]) => {
    setContacts(newContacts);
    setLocalContacts(address, newContacts);
  };

  const handleDeleteContact = (contact: TRecoveryContact) => {
    const newContacts = contacts.filter((c) => c.address !== contact.address);
    saveContacts(newContacts);
    setThreshold('0');
  };

  const onClickGuide = () => {
    setShowType(ShowType.List);
  };

  const handleSaveAddedContact = (contact: TRecoveryContact) => {
    const isAddressExists = contacts.some((c) => c.address === contact.address);
    if (isAddressExists) {
      toast({
        title: 'Address already exists',
        description: 'This address is already in your recovery contacts list.',
        variant: 'destructive',
      });
      return;
    }
    saveContacts([...contacts, contact]);
    setShowType(ShowType.List);
  };

  const handleSaveContactLabel = (contact: TRecoveryContact) => {
    const newContacts = contacts.map((c) => (c.address === contact.address ? contact : c));
    saveContacts(newContacts);
  };

  return (
    <SecondaryPageWrapper
      title="Social Recovery"
      onBack={() => {
        if (showType === ShowType.Detail) {
          setShowType(ShowType.List);
        } else {
          history.back();
        }
      }}
    >
      {loading ? (
        <>
          <ProcessingTip body="Getting recovery contacts" />
          <Button
            size="large"
            variant="outline"
            onClick={() => {
              history.back();
            }}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          {showType === ShowType.Guide && <RecoverGuide onClick={onClickGuide} />}
          {showType === ShowType.List && (
            <ContactList
              contacts={contacts}
              threshold={threshold}
              setThreshold={setThreshold}
              onAddContact={handleAddContact}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
            />
          )}
          {showType === ShowType.Detail && <ContactDetail onAddContact={handleSaveAddedContact} />}
        </>
      )}
      <LabelDialog ref={labelDialogRef} onSave={handleSaveContactLabel} />
    </SecondaryPageWrapper>
  );
}
