export const isContactSigned = (signatures: TGuardianSignature[], address: string) => {
  return signatures?.some(({ guardian }) => guardian === address?.toLowerCase());
};

export const isConnectedAccountAContact = (address: string, guardians: string[] = []) => {
  return guardians.includes(address.toLowerCase());
};
