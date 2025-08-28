import { localStorage } from '@/utils/storage/local';

export async function getLocalContacts(address: string): Promise<TRecoveryContact[]> {
  try {
    const raw = await localStorage.get(`recovery_contacts_${address}`);
    if (!raw) return [];
    return raw as TRecoveryContact[];
  } catch {
    return [];
  }
}
export async function setLocalContacts(address: string, contacts: TRecoveryContact[]) {
  await localStorage.save({ [`recovery_contacts_${address}`]: contacts });
}

export async function getLocalThreshold(address: string): Promise<string> {
  const raw = await localStorage.get(`recovery_contacts_threshold_${address}`);
  if (!raw) return '0';
  return raw as string;
}

export async function setLocalThreshold(address: string, threshold: string) {
  await localStorage.save({ [`recovery_contacts_threshold_${address}`]: threshold });
}

export async function getLocalContactsSetting(address: string): Promise<{
  contacts: TRecoveryContact[];
  threshold: string;
}> {
  const [contacts, threshold] = await Promise.all([getLocalContacts(address), getLocalThreshold(address)]);
  return { contacts, threshold };
}
