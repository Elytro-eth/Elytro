type SafeAny = any;

type TContact = {
  address: Address;
  confirmed: boolean;
};

type TRecoveryContactsInfo = {
  salt: string;
  threshold: number;
  contacts: Address[];
};
