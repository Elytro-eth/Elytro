import { DocumentNode, gql } from '@apollo/client';
import { client } from './client';

// wrapped query function
export async function query<T>(
  queryDocument: DocumentNode,
  variables?: Record<string, unknown>
): Promise<T> {
  try {
    const { data } = await client.query({
      query: queryDocument,
      variables,
      fetchPolicy: 'no-cache',
    });
    return data as T;
  } catch (error) {
    console.error('Elytro: GraphQL Query Error:', error);
    throw error;
  }
}

export const query_simulated_op = gql`
  query Simulate($chainID: String!, $request: SimulateInput!) {
    simulate(chainID: $chainID, request: $request) {
      success
      result {
        assetChanges
        balanceChanges
        blockNumber
        cumulativeGasUsed
        gasUsed
        stateChanges {
          address
          balance {
            newValue
            previousValue
          }
          nonce {
            previousValue
            newValue
          }
        }
        status
        type
      }
    }
  }
`;

export const query_recovery_record = gql`
  query GetRecoveryInfo($recoveryRecordId: String!) {
    getRecoveryInfo(recoveryRecordID: $recoveryRecordId) {
      recoveryRecordID
      onchainID
      address
      chainID
      createTimestamp
      nonce
      newOwners
      guardianInfo {
        salt
        threshold
        guardians
      }
      status
      guardianSignatures {
        recoveryRecordID
        guardian
        signatureType
        guardianSignature
        updateTimestamp
      }
      validTime
      emailGuardianStatus
    }
  }
`;

export const query_receive_activities = gql`
  query Transactions($address: String!, $chainId: String!) {
    transactions(address: $address, chainID: $chainId) {
      type
      opHash
      timestamp
      txhash
      list {
        asset_from
        asset_to
        asset_value
        token_address
        decimals
        symbol
      }
    }
  }
`;

export const query_token_price = gql`
  query TokenPrice($chainId: String!, $contractAddresses: [String!]!) {
    tokenPrices(chainID: $chainId, contractAddresses: $contractAddresses) {
      address
      price
    }
  }
`;
