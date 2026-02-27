import type { Address, Hex } from 'viem';
import { toHex } from 'viem';
import type { ElytroUserOperation, SponsorResult } from '../types';
import { requestGraphQL } from './graphqlClient';

/**
 * Sponsorship — request a paymaster to cover gas for a UserOperation.
 *
 * Mirrors extension's `canUserOpGetSponsor()` from utils/ethRpc/sponsor.ts.
 *
 * The Elytro backend exposes a GraphQL `mutation SponsorOp` that evaluates
 * whether the given UserOp qualifies for gasless execution. If approved,
 * it returns paymaster address + data and overridden gas limits.
 *
 * CLI simplifications:
 * - No security hook handling (demo stage, no hooks)
 * - Uses native fetch() instead of Apollo client
 * - Returns { sponsor, error } so caller can diagnose failures
 */

/**
 * Default dummy signature used during sponsor estimation.
 * Same as extension's fallback when no hooks are present.
 */
const SPONSOR_DUMMY_SIGNATURE =
  '0xea50a2874df3eEC9E0365425ba948989cd63FED6000000620100005f5e0fff000fffffffff0000000000000000000000000000000000000000b91467e570a6466aa9e9876cbcd013baba02900b8979d43fe208a4a4f339f5fd6007e74cd82e037b800186422fc2da167c747ef045e5d18a5f5d4300f8e1a0291c' as Hex;

// ─── Account Registration ────────────────────────────────────────

const CREATE_ACCOUNT_MUTATION = `
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

/**
 * Register a wallet address with the Elytro backend.
 *
 * Extension calls this in `calcWalletAddress` (sdk.ts line 175).
 * The sponsor backend requires this registration before it will
 * sponsor any UserOps for the wallet (AccountExistenceCheck).
 */
export async function registerAccount(
  graphqlEndpoint: string,
  address: Address,
  chainId: number,
  index: number,
  initialKeys: string[],
  initialGuardianHash: string,
  initialGuardianSafePeriod: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    await requestGraphQL<{ createAccount?: Record<string, unknown> }>({
      endpoint: graphqlEndpoint,
      query: CREATE_ACCOUNT_MUTATION,
      variables: {
        input: {
          address,
          chainID: toHex(chainId),
          initInfo: {
            index,
            initialKeys,
            initialGuardianHash,
            initialGuardianSafePeriod: toHex(initialGuardianSafePeriod),
          },
        },
      },
    });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

// ─── Sponsorship ─────────────────────────────────────────────────

const SPONSOR_OP_MUTATION = `
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

/**
 * Format a bigint/number/string to a hex string for GraphQL.
 * Matches extension's `formatHex()` from utils/format.ts.
 */
function formatHex(value: string | number | bigint): string {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value;
  }
  return toHex(value);
}

/**
 * Ensure hex string has even length (pad with leading zero if odd).
 * Matches extension's `paddingBytesToEven()`.
 */
function paddingBytesToEven(value?: string | null): string | null {
  if (!value) return null;
  const hexValue = value.startsWith('0x') ? value.slice(2) : value;
  const paddedHex = hexValue.length % 2 === 1 ? '0' + hexValue : hexValue;
  return '0x' + paddedHex;
}

export interface SponsorResponse {
  sponsor: SponsorResult | null;
  error: string | null;
}

/**
 * Request sponsorship for a UserOperation via the Elytro GraphQL API.
 *
 * @returns { sponsor, error } — sponsor is non-null on success; error explains failures.
 */
export async function requestSponsorship(
  graphqlEndpoint: string,
  chainId: number,
  entryPoint: Address,
  userOp: ElytroUserOperation
): Promise<SponsorResponse> {
  try {
    const data = await requestGraphQL<{ sponsorOp?: Record<string, string> }>({
      endpoint: graphqlEndpoint,
      query: SPONSOR_OP_MUTATION,
      variables: {
        input: {
          chainID: toHex(chainId),
          entryPoint,
          op: {
            sender: userOp.sender,
            nonce: formatHex(userOp.nonce),
            factory: userOp.factory,
            factoryData: userOp.factory === null ? null : paddingBytesToEven(userOp.factoryData),
            callData: userOp.callData,
            callGasLimit: formatHex(userOp.callGasLimit),
            verificationGasLimit: formatHex(userOp.verificationGasLimit),
            preVerificationGas: formatHex(userOp.preVerificationGas),
            maxFeePerGas: formatHex(userOp.maxFeePerGas),
            maxPriorityFeePerGas: formatHex(userOp.maxPriorityFeePerGas),
            signature: SPONSOR_DUMMY_SIGNATURE,
          },
        },
      },
    });

    if (!data.sponsorOp) {
      return { sponsor: null, error: 'No sponsorOp in response data' };
    }

    const sponsor = data.sponsorOp;
    if (!sponsor.paymaster) {
      return { sponsor: null, error: 'Sponsor returned empty paymaster address' };
    }

    return {
      sponsor: {
        paymaster: sponsor.paymaster as Address,
        paymasterData: sponsor.paymasterData as Hex,
        callGasLimit: sponsor.callGasLimit,
        verificationGasLimit: sponsor.verificationGasLimit,
        preVerificationGas: sponsor.preVerificationGas,
        paymasterVerificationGasLimit: sponsor.paymasterVerificationGasLimit,
        paymasterPostOpGasLimit: sponsor.paymasterPostOpGasLimit,
      },
      error: null,
    };
  } catch (err) {
    return { sponsor: null, error: (err as Error).message };
  }
}

/**
 * Apply sponsor result to a UserOperation (mutates in place).
 */
export function applySponsorToUserOp(userOp: ElytroUserOperation, sponsor: SponsorResult): void {
  userOp.paymaster = sponsor.paymaster;
  userOp.paymasterData = sponsor.paymasterData;

  // Override gas limits with sponsor's values
  if (sponsor.callGasLimit) {
    userOp.callGasLimit = BigInt(sponsor.callGasLimit);
  }
  if (sponsor.verificationGasLimit) {
    userOp.verificationGasLimit = BigInt(sponsor.verificationGasLimit);
  }
  if (sponsor.preVerificationGas) {
    userOp.preVerificationGas = BigInt(sponsor.preVerificationGas);
  }
  if (sponsor.paymasterVerificationGasLimit) {
    userOp.paymasterVerificationGasLimit = BigInt(sponsor.paymasterVerificationGasLimit);
  }
  if (sponsor.paymasterPostOpGasLimit) {
    userOp.paymasterPostOpGasLimit = BigInt(sponsor.paymasterPostOpGasLimit);
  }
}
