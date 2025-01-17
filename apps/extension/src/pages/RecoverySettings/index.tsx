import ProcessingTip from '@/components/biz/ProcessingTip';
import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import ContactList from './ContactList';
import ContactDetail from './ContactDetail';
import { useWallet } from '@/contexts/wallet';

enum ShowType {
  List = 'list',
  Detail = 'detail',
}

export default function RecoverySettings() {
  const { wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<TRecoveryContact[]>([]);
  const [threshold, setThreshold] = useState<number>(0);
  const [showType, setShowType] = useState<ShowType>(ShowType.List);
  const [selectedContact, setSelectedContact] =
    useState<TRecoveryContact | null>(null);

  const getRecoveryContacts = async () => {
    try {
      setLoading(true);

      const { contacts = [], threshold = 0 } =
        await wallet.queryRecoveryContactsOfCurrentAccount();

      setContacts(contacts.map((c) => ({ address: c })));
      setThreshold(threshold);

      // TODO: get recovery contacts
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecoveryContacts();
  }, []);

  if (loading) {
    return (
      <div className="relative h-full w-full flex flex-col items-center justify-center gap-y-sm">
        <ProcessingTip body="Retrieving recovery contacts" subBody="" />
        <Button
          size="large"
          variant="outline"
          className="w-full bottom-lg absolute"
          onClick={() => {
            history.back();
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  const handleAddContact = () => {
    setShowType(ShowType.Detail);
    setSelectedContact(null);
    setThreshold(0);
  };

  const handleEditContact = (contact: TRecoveryContact) => {
    setShowType(ShowType.Detail);
    setSelectedContact(contact);
  };

  const handleDeleteContact = (contact: TRecoveryContact) => {
    // TODO: delete contact
    const newContacts = contacts.filter((c) => c.address !== contact.address);
    setContacts(newContacts);
    setThreshold(0);
  };

  const handleSaveContact = (contact: TRecoveryContact) => {
    if (contacts.find((c) => c.address === contact.address)) {
      const newContacts = contacts.map((c) =>
        c.address === contact.address ? contact : c
      );
      setContacts(newContacts);
    } else {
      setContacts([...contacts, contact]);
    }
    setSelectedContact(null);
    setShowType(ShowType.List);
  };

  return (
    <SecondaryPageWrapper
      title="Social recovery"
      onBack={() => {
        if (showType === ShowType.Detail) {
          setShowType(ShowType.List);
        } else {
          history.back();
        }
      }}
    >
      {showType === ShowType.List && (
        <ContactList
          contacts={contacts}
          threshold={threshold}
          onAddContact={handleAddContact}
          onEditContact={handleEditContact}
          onDeleteContact={handleDeleteContact}
        />
      )}
      {showType === ShowType.Detail && (
        <ContactDetail
          onSaveContact={handleSaveContact}
          contact={selectedContact}
        />
      )}
    </SecondaryPageWrapper>
  );
}
