import { client } from './client';
import { DocumentNode, gql } from '@apollo/client';

// wrapped mutation function
export async function mutate<T>(
  mutationDocument: DocumentNode,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    const { data, errors } = await client.mutate({
      mutation: mutationDocument,
      variables,
    });

    if (errors) {
      throw errors;
    }
    return data as T;
  } catch (error) {
    console.error('Elytro: GraphQL Mutation Error:', error);
    throw error;
  }
}

export const mutate_create_account = gql`
  mutation CreateAccount($input: CreateAccountInput!) {
    createAccount(input: $input) {
      address
      chainID
      initInfo {
        index
        initialKeys
        initialGuardianHash
        initialGuardianSafePeriod
      }
    }
  }
`;

export const mutate_sponsor_op = gql`
  mutation SponsorOp($input: SponsorOpInput!) {
    sponsorOp(input: $input) {
      callGasLimit
      paymaster
      paymasterData
      paymasterPostOpGasLimit
      paymasterVerificationGasLimit
      preVerificationGas
      verificationGasLimit
    }
  }
`;

export const mutate_create_recovery_record = gql`
  mutation CreateRecoveryRecord($input: CreateRecoveryRecordInput!) {
    createRecoveryRecord(input: $input) {
      status
      recoveryRecordID
      guardianInfo {
        threshold
        salt
        guardians
      }
      onchainID
      nonce
      newOwners
      createTimestamp
      chainID
      address
    }
  }
`;

export const mutate_register_device = gql`
  mutation RegisterDevice($input: RegisterDeviceInput!) {
    registerDevice(input: $input) {
      deviceID
    }
  }
`;
