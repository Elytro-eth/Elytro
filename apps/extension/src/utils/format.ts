import { TTxDetail } from '@/constants/operations';
import { SimulationResult } from './ethRpc/simulate';
import {
  Hex,
  toHex,
  size as getSize,
  pad,
  formatUnits,
  Block,
  BlockTag,
} from 'viem';

export function paddingZero(
  value: string | number | bigint,
  bytesLen?: number
): string {
  const hexString =
    typeof value === 'string'
      ? value.toLowerCase().startsWith('0x')
        ? value.slice(2)
        : value
      : BigInt(value).toString(16);

  const targetLength = bytesLen ? bytesLen * 2 : Math.max(hexString.length, 2);

  if (hexString.length > targetLength) {
    throw new Error(
      `Value ${value} exceeds the target length of ${targetLength} characters`
    );
  }

  return '0x' + hexString.padStart(targetLength, '0');
}

export function getHexString(
  value: string | number | bigint | boolean | Uint8Array,
  size: number = 16
): Hex {
  if (typeof value === 'string' && value.startsWith('0x')) {
    if (getSize(value as Hex) === size) {
      return value as Hex;
    } else {
      return pad(value as Hex, { size });
    }
  }

  return toHex(value, { size });
}

export const formatHex = (
  value: string | number | bigint | boolean | Uint8Array
) => {
  {
    if (typeof value === 'string' && value.startsWith('0x')) {
      return value;
    }

    return toHex(value);
  }
};

// make the hex string length even
export function paddingBytesToEven(value?: string): string | null {
  if (!value) return null;

  const hexValue = value.startsWith('0x') ? value.slice(2) : value;

  const paddedHex = hexValue.length % 2 === 1 ? '0' + hexValue : hexValue;

  return '0x' + paddedHex;
}

export function formatAddressToShort(address: Nullable<string>) {
  // 0x12345...123456
  // todo: check if address is valid
  return address && address?.length > 12
    ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
    : '--';
}

export function formatTokenAmount(amount: string | null | undefined): string {
  // todo: format amount. 8 decimal places is enough?
  try {
    return formatUnits(BigInt(amount!), 18) + ' ETH';
  } catch {
    return '--';
  }
}

export function formatSimulationResultToTxDetail(
  simulationResult: SimulationResult
) {
  return {
    from: simulationResult.assetChanges[0].from,
    to: simulationResult.assetChanges[0].to,
    value: parseInt(simulationResult.assetChanges[0].rawAmount, 16),
    fee: simulationResult.gasUsed, // todo: calculate fee
  } as TTxDetail;
}

export function formatRawData(data: SafeAny) {
  const bigintReplacer = (_: string, value: SafeAny) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  };

  return JSON.stringify(data, bigintReplacer, 2);
}

export function formatBlockInfo(block: Block) {
  // transfer bigint to Hex string
  return {
    ...block,
    baseFeePerGas:
      block.baseFeePerGas !== null ? toHex(block.baseFeePerGas) : null,
    blobGasUsed: toHex(block.blobGasUsed),
    difficulty: toHex(block.difficulty),
    excessBlobGas: toHex(block.excessBlobGas),
    gasLimit: toHex(block.gasLimit),
    gasUsed: toHex(block.gasUsed),
    number: block.number !== null ? toHex(block.number) : null,
    size: toHex(block.size),
    timestamp: toHex(block.timestamp),
    totalDifficulty:
      block.totalDifficulty !== null ? toHex(block.totalDifficulty) : null,
  };
}

// format bigint to hex string
export function formatUserOperation(userOp: ElytroUserOperation) {
  const formatBigIntToHex = (value: SafeAny) => {
    return typeof value === 'bigint' ? toHex(value) : value;
  };

  const formattedUserOp = Object.fromEntries(
    Object.entries(userOp).map(([key, value]) => [
      key,
      formatBigIntToHex(value),
    ])
  );

  return formattedUserOp as ElytroUserOperation;
}

const BIGINT_PARAM_KEY = [
  'callGasLimit',
  'verificationGasLimit',
  'paymasterVerificationGasLimit',
  'paymasterPostOpGasLimit',
  'preVerificationGas',
];

export function deformatUserOperation(userOp: ElytroUserOperation) {
  const deformatUserOp = Object.fromEntries(
    Object.entries(userOp).map(([key, value]) => [
      key,
      BIGINT_PARAM_KEY.includes(key) ? BigInt(value) : value,
    ])
  );

  return deformatUserOp as ElytroUserOperation;
}

export function formatBlockParam(blockParam: BlockTag | bigint) {
  const useTag = typeof blockParam === 'string';

  return useTag
    ? { blockTag: blockParam as BlockTag }
    : { blockNumber: BigInt(blockParam) };
}

/**
 * A Data value (for example, byte arrays, account addresses, hashes, and bytecode arrays) must:
 * - Be hex-encoded.
 * - Be "0x"-prefixed.
 * - Be expressed using two hex digits per byte.
 */
export function formatToData(value: SafeAny): string {
  let hexString: string;

  if (typeof value === 'string') {
    hexString = value.startsWith('0x') ? value.slice(2) : value;
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    hexString = value.toString(16);
  } else if (value instanceof Uint8Array) {
    hexString = Array.from(value)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } else {
    throw new Error('Unsupported data type');
  }

  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }

  return '0x' + hexString;
}

/**
 * A Quantity (integer, number) must:
 * - Be hex-encoded.
 * - Be "0x"-prefixed.
 * - Be expressed using the fewest possible hex digits per byte.
 * - Express zero as "0x0".
 */
export function formatQuantity(value: SafeAny): string {
  let hexString: string;

  if (typeof value === 'string') {
    hexString = BigInt(value).toString(16);
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    hexString = value.toString(16);
  } else {
    throw new Error('Unsupported data type');
  }

  // Ensure the hex string is prefixed with '0x'
  return '0x' + (hexString === '0' ? '0' : hexString);
}
