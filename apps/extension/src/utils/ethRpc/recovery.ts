import { mutate, query } from '@/requests';
import { mutate_create_recovery_record } from '@/requests/mutate';
import { formatHex, paddingZero } from '../format';
import { toast } from '@elytro/ui';
import { query_recovery_record } from '@/requests/query';

interface ICreateRecoveryRecordInput {
  newOwner: string;
  chainID: number;
  address: string;
  guardianInfo: TRecoveryContactsInfo;
}

export interface IRecoveryRecord {
  recoveryRecordID: string;
  onchainID: string;
  address: string;
  chainID: string;
  createTimestamp: string;
  nonce: string;
  newOwners: string[];
  guardianInfo: TRecoveryContactsInfo;
  status: number;
  guardianSignatures?: {
    recoveryRecordID: string;
    guardian: string;
    signatureType: number;
    guardianSignature: string;
    updateTimestamp: string;
  }[];
  validTime?: number;
  emailGuardianStatus?: number;
}

export const createRecoveryRecord = async ({
  newOwner,
  chainID,
  address,
  guardianInfo,
}: ICreateRecoveryRecordInput) => {
  try {
    const res = (await mutate(mutate_create_recovery_record, {
      input: {
        newOwners: [paddingZero(newOwner, 32)],
        chainID: formatHex(chainID),
        address: address,
        guardianInfo,
      },
    })) as SafeAny;

    if (res.error) {
      throw res.error;
    }

    return res?.createRecoveryRecord as IRecoveryRecord;
  } catch (error) {
    console.error('Elytro: createRecoveryRecord error', error);
    toast({
      title: 'Failed to create recovery record',
      // description: 'Please try again later',
      variant: 'destructive',
    });
  }
};

export const getRecoveryRecord = async (recoveryRecordId: string) => {
  try {
    const res = (await query(query_recovery_record, {
      recoveryRecordId,
    })) as SafeAny;

    if (res.error) {
      throw res.error;
    }

    return res?.getRecoveryInfo as IRecoveryRecord;
  } catch (error) {
    console.error('Elytro: getRecoveryRecord error', error);
    return null;
  }
};
