export const isConnectedAccountAContact = (address: string, contacts: TContact[] = []) => {
  return contacts.some((contact) => contact.address.toLowerCase() === address.toLowerCase());
};
