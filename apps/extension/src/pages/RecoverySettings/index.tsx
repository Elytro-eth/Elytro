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
import { useLocalStorage } from '@/hooks/use-local-storage';
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
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<TRecoveryContact[]>([]);
  const [threshold, setThreshold] = useState<string>('0');
  const [showType, setShowType] = useState<ShowType>(ShowType.List);
  const [isPrivacyMode, setIsPrivacyMode] = useLocalStorage('isPrivacyMode', false);
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
      const { contacts = [], threshold = 0 } = (await wallet.queryRecoveryContactsByAddress(address)) || {};

      console.log('checkRecoveryContactsSettingChanged 1');
      const isOnchainContactsChanged = await wallet.checkRecoveryContactsSettingChanged(contacts, threshold);

      console.log('getRecoveryContactsFromInfoRecorder 1', isOnchainContactsChanged, contacts, threshold);
      if (isOnchainContactsChanged) {
        getRecoveryContactsFromLocal();
        return;
      }

      const localContacts = await getLocalContacts(address);
      const newContacts = contacts.map((c) => {
        const local = localContacts.find((lc) => lc.address === c);
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
      setShowType(contacts.length <= 0 ? ShowType.Guide : ShowType.List);
    } catch (error) {
      console.error(error);
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
        title: 'Local recovery contacts setting is not the same as onchain',
        description:
          'We are not able to load the recovery contacts because the local setting is not the same as onchain.',
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
    setShowType(ShowType.List);
  };

  useEffect(() => {
    getRecoveryContactsFromInfoRecorder();
  }, []);

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

  const handleDeleteContact = (contact: TRecoveryContact) => {
    const newContacts = contacts.filter((c) => c.address !== contact.address);
    setContacts(newContacts);
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
        variant: 'destructive',
      });
      return;
    }
    setContacts([...contacts, contact]);
    setShowType(ShowType.List);
  };

  const handleSaveContactLabel = (contact: TRecoveryContact) => {
    const newContacts = contacts.map((c) => (c.address === contact.address ? contact : c));
    setContacts(newContacts);
  };

  const handleUpdateThreshold = async (threshold: string) => {
    setThreshold(threshold);
    await setLocalThreshold(address, threshold);
  };

  return (
    <SecondaryPageWrapper
      title="Social Recovery"
      onBack={() => {
        if (showType === ShowType.Detail) {
          setShowType(ShowType.List);
        } else if (showType === ShowType.List) {
          setShowType(ShowType.Guide);
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
          {showType === ShowType.Guide && (
            <RecoverGuide onClick={onClickGuide} isPrivacyMode={isPrivacyMode} onPrivacyModeChange={setIsPrivacyMode} />
          )}
          {showType === ShowType.List && (
            <ContactList
              isPrivacyMode={isPrivacyMode}
              contacts={contacts}
              threshold={threshold}
              setThreshold={handleUpdateThreshold}
              onAddContact={handleAddContact}
              onEditContact={handleEditContact}
              onDeleteContact={handleDeleteContact}
            />
          )}
          {showType === ShowType.Detail && (
            <ContactDetail isPrivacyMode={isPrivacyMode} onAddContact={handleSaveAddedContact} />
          )}
        </>
      )}
      <LabelDialog ref={labelDialogRef} onSave={handleSaveContactLabel} />
    </SecondaryPageWrapper>
  );
}
