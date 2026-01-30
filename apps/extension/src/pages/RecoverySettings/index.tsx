import SecondaryPageWrapper from '@/components/biz/SecondaryPageWrapper';
import { Button, toast, ProcessingTip } from '@elytro/ui';
import { useEffect, useRef, useState } from 'react';
import ContactList from './ContactList';
import ContactDetail from './ContactDetail';
import { useWallet } from '@/contexts/wallet';
import { useAccount } from '@/contexts/account-context';
import RecoverGuide from './RecoverGuide';
import LabelDialog, { ILabelDialogRef } from './LabelDialog';
import { getLocalContacts, getLocalContactsSetting, setLocalContacts, setLocalThreshold } from '@/utils/contacts';

enum ShowType {
  Guide = 'guide',
  List = 'list',
  Detail = 'detail',
}

export default function RecoverySettings() {
  const { wallet } = useWallet();
  const {
    currentAccount: { address },
  } = useAccount();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<TRecoveryContact[]>([]);
  const [threshold, setThreshold] = useState<string>('0');
  const [showType, setShowType] = useState<ShowType>(ShowType.Guide);
  const labelDialogRef = useRef<ILabelDialogRef>(null);
  const originalContactsSetting = useRef<{
    contacts: TRecoveryContact[];
    threshold: string;
  }>({
    contacts: [],
    threshold: '0',
  });

  const getRecoveryContactsFromInfoRecorder = async () => {
    try {
      setLoading(true);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 15000)
      );

      const { contacts = [], threshold = 0 } = ((await Promise.race([
        wallet.queryRecoveryContactsByAddress(address),
        timeoutPromise,
      ])) as { contacts: string[]; threshold: number } | undefined) || {
        contacts: [],
        threshold: 0,
      };

      console.log('checkRecoveryContactsSettingChanged 1');
      const isOnchainContactsChanged = await wallet.checkRecoveryContactsSettingChanged(contacts, threshold);

      console.log('getRecoveryContactsFromInfoRecorder 1', isOnchainContactsChanged, contacts, threshold);
      if (isOnchainContactsChanged) {
        getRecoveryContactsFromLocal();
        return;
      }

      const localContacts = await getLocalContacts(address);
      const newContacts = contacts.map((c) => {
        const local = localContacts.find((lc) => lc.address?.toLowerCase() === c?.toLowerCase());
        return { address: c, label: local?.label || '' };
      });
      const newThreshold = threshold.toString();
      setContacts(newContacts);
      setThreshold(newThreshold);
      originalContactsSetting.current = {
        contacts: newContacts,
        threshold: newThreshold,
      };

      console.log('originalContactsSetting', originalContactsSetting.current);
      const hasContacts = contacts.length > 0;
      setShowType(hasContacts ? ShowType.List : ShowType.Guide);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Failed to load recovery contacts',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      setShowType(ShowType.Guide);
    } finally {
      setLoading(false);
    }
  };

  const getRecoveryContactsFromLocal = async () => {
    const { contacts, threshold } = await getLocalContactsSetting(address);

    console.log('checkRecoveryContactsSettingChanged 4');
    const isLocalContactsChanged = await wallet.checkRecoveryContactsSettingChanged(
      contacts.map((contact) => contact.address),
      Number(threshold)
    );
    console.log('checkRecoveryContactsSettingChanged 4', isLocalContactsChanged, contacts, threshold);

    if (isLocalContactsChanged) {
      toast({
        title: 'Local recovery records expired',
        description: '',
      });
      setShowType(ShowType.Guide);
      return;
    }

    await saveContacts(contacts);
    await handleUpdateThreshold(String(threshold));
    originalContactsSetting.current = {
      contacts: contacts,
      threshold: threshold,
    };
    setShowType(contacts.length > 0 ? ShowType.List : ShowType.Guide);
  };

  useEffect(() => {
    if (address) {
      getRecoveryContactsFromInfoRecorder();
    }
  }, [address]);

  const handleAddContact = () => {
    setShowType(ShowType.Detail);
  };

  const handleEditContact = (contact: TRecoveryContact) => {
    labelDialogRef.current?.open(contact);
  };

  const saveContacts = async (newContacts: TRecoveryContact[]) => {
    setContacts(newContacts);
    await setLocalContacts(address, newContacts);
  };

  const handleDeleteContact = async (contact: TRecoveryContact) => {
    const newContacts = contacts.filter((c) => c.address !== contact.address);
    await saveContacts(newContacts);
    await handleUpdateThreshold('0');
  };

  const onClickGuide = () => {
    setShowType(ShowType.List);
  };

  const handleSaveAddedContact = (contact: TRecoveryContact) => {
    const isAddressExists = contacts.some((c) => c.address === contact.address);
    if (isAddressExists) {
      toast({
        title: 'Address already exists',
        variant: 'destructive',
      });
      return;
    }
    const newContacts = [...contacts, contact];
    setContacts(newContacts);
    setShowType(ShowType.List);
  };

  const handleSaveContactLabel = async (contact: TRecoveryContact) => {
    const newContacts = contacts.map((c) => (c.address === contact.address ? contact : c));
    setContacts(newContacts);
    await setLocalContacts(address, newContacts);
  };

  const handleUpdateThreshold = async (threshold: string) => {
    setThreshold(threshold);
    await setLocalThreshold(address, threshold);
  };

  return (
    <SecondaryPageWrapper
      title="Recovery"
      onBack={() => {
        if (showType === ShowType.Detail) {
          setShowType(ShowType.List);
        } else {
          history.back();
        }
      }}
      isGuide={!loading && showType === ShowType.Guide}
    >
      {loading ? (
        <>
          <ProcessingTip body="Getting recovery contacts" />
          <Button
            variant="secondary"
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
              setThreshold={handleUpdateThreshold}
              onAddContact={handleAddContact}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
              hasOnchainContacts={originalContactsSetting.current.contacts.length > 0}
            />
          )}
          {showType === ShowType.Detail && <ContactDetail onAddContact={handleSaveAddedContact} />}
        </>
      )}
      <LabelDialog ref={labelDialogRef} onSave={handleSaveContactLabel} />
    </SecondaryPageWrapper>
  );
}
