import { client } from './client';
import { DocumentNode, gql } from '@apollo/client';

// wrapped mutation function
export async function mutate<T>(mutationDocument: DocumentNode, variables?: Record<string, unknown>): Promise<T> {
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

// Security Hook - Wallet Authentication
export const mutate_request_wallet_auth_challenge = gql`
  mutation RequestWalletAuthChallenge($input: RequestWalletAuthChallengeInput!) {
    requestWalletAuthChallenge(input: $input) {
      challengeId
      message
      expiresAt
    }
  }
`;

export const mutate_confirm_wallet_auth_challenge = gql`
  mutation ConfirmWalletAuthChallenge($input: ConfirmWalletAuthChallengeInput!) {
    confirmWalletAuthChallenge(input: $input) {
      sessionId
      expiresAt
    }
  }
`;

// Security Hook - Email Binding
export const mutate_request_wallet_email_binding = gql`
  mutation RequestWalletEmailBinding($input: RequestWalletEmailBindingInput!) {
    requestWalletEmailBinding(input: $input) {
      bindingId
      maskedEmail
      otpExpiresAt
      resendAvailableAt
    }
  }
`;

export const mutate_confirm_wallet_email_binding = gql`
  mutation ConfirmWalletEmailBinding($input: ConfirmWalletEmailBindingInput!) {
    confirmWalletEmailBinding(input: $input) {
      email
      emailVerified
      maskedEmail
      dailyLimitUsdCents
      updatedAt
    }
  }
`;

// Security Hook - Daily Limit
export const mutate_set_wallet_daily_limit = gql`
  mutation SetWalletDailyLimit($input: SetWalletDailyLimitInput!) {
    setWalletDailyLimit(input: $input) {
      dailyLimitUsdCents
      updatedAt
    }
  }
`;

// Security Hook - Authorize User Operation (replaces getIsHookSignatureRequired)
export const mutate_authorize_user_operation = gql`
  mutation AuthorizeUserOperation($input: AuthorizeUserOperationInput!) {
    authorizeUserOperation(input: $input) {
      decision
      signature
      spendDeltaUsdCents
      totalSpendUsdCents
      refreshedAt
    }
  }
`;

// Security Hook - Request Security OTP
export const mutate_request_security_otp = gql`
  mutation RequestSecurityOtp($input: RequestSecurityOtpInput!) {
    requestSecurityOtp(input: $input) {
      challengeId
      maskedEmail
      otpExpiresAt
    }
  }
`;

// Security Hook - Verify Security OTP
export const mutate_verify_security_otp = gql`
  mutation VerifySecurityOtp($input: VerifySecurityOtpInput!) {
    verifySecurityOtp(input: $input) {
      challengeId
      status
      verifiedAt
    }
  }
`;

// Legacy: Keep getIsHookSignatureRequired for backward compatibility (deprecated)
export const mutate_get_hook_signature = gql`
  mutation GetHookSignature($input: GetHookSignatureInput!) {
    getIsHookSignatureRequired(input: $input) {
      signature
    }
  }
`;

// Security Hook - Change Wallet Email
export const mutate_change_email = gql`
  mutation RequestChangeWalletEmail($input: ChangeWalletEmailInput!) {
    requestChangeWalletEmail(input: $input) {
      bindingId
      maskedEmail
      otpExpiresAt
      resendAvailableAt
    }
  }
`;
