import { TTxDetail } from '@/constants/operations';
import { SimulationResult } from './ethRpc/simulate';
import { Hex, toHex, size as getSize, pad, Block, BlockTag, isAddress } from 'viem';

export function paddingZero(value: string | number | bigint, bytesLen?: number): string {
  const hexString =
    typeof value === 'string'
      ? value.toLowerCase().startsWith('0x')
        ? value.slice(2)
        : value
      : BigInt(value).toString(16);

  const targetLength = bytesLen ? bytesLen * 2 : Math.max(hexString.length, 2);

  if (hexString.length > targetLength) {
    throw new Error(`Value ${value} exceeds the target length of ${targetLength} characters`);
  }

  return '0x' + hexString.padStart(targetLength, '0');
}

export function getHexString(value: string | number | bigint | boolean | Uint8Array, size: number = 16): Hex {
  if (typeof value === 'string' && value.startsWith('0x')) {
    if (getSize(value as Hex) === size) {
      return value as Hex;
    } else {
      return pad(value as Hex, { size });
    }
  }

  return toHex(value, { size });
}

export const formatHex = (value: string | number | bigint | boolean | Uint8Array) => {
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
  return address && isAddress(address) ? `${address?.slice(0, 6)} ... ${address?.slice(-4)}` : '--';
}

export function formatTokenAmount(
  amount: string | null | undefined | number,
  decimals: number = 18,
  symbol: string = '',
  maxDecimalLength: number = 6,
  roundingMode: boolean = true
): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return symbol ? `0 ${symbol}` : '0';
  }

  let numericAmount: number;
  try {
    if (typeof amount === 'string') {
      if (amount.length > 15) {
        const amountBigInt = BigInt(amount);
        const divisor = BigInt(10 ** decimals);
        const integerPart = amountBigInt / divisor;
        const fractionalPart = amountBigInt % divisor;

        const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
        numericAmount = Number(`${integerPart}.${fractionalStr}`);
      } else {
        numericAmount = Number(amount) / 10 ** decimals;
      }
    } else {
      numericAmount = Number(amount) / 10 ** decimals;
    }
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return symbol ? `0 ${symbol}` : '0';
  }

  let result: string;
  if (roundingMode) {
    result = numericAmount.toFixed(maxDecimalLength);

    result = result.replace(/\.?0+$/, '');

    if (result.endsWith('.')) {
      result = result.slice(0, -1);
    }
  } else {
    const integerPart = Math.floor(numericAmount);
    let fractionalPart = String(numericAmount).split('.')[1] || '';

    fractionalPart = fractionalPart.substring(0, maxDecimalLength);

    while (fractionalPart.endsWith('0')) {
      fractionalPart = fractionalPart.slice(0, -1);
    }

    result = fractionalPart ? `${integerPart}.${fractionalPart}` : `${integerPart}`;
  }

  return symbol ? `${result} ${symbol}` : result;
}

export function formatSimulationResultToTxDetail(simulationResult: SimulationResult) {
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
    baseFeePerGas: block.baseFeePerGas !== null ? toHex(block.baseFeePerGas) : null,
    blobGasUsed: toHex(block.blobGasUsed),
    difficulty: toHex(block.difficulty),
    excessBlobGas: toHex(block.excessBlobGas),
    gasLimit: toHex(block.gasLimit),
    gasUsed: toHex(block.gasUsed),
    number: block.number !== null ? toHex(block.number) : null,
    size: toHex(block.size),
    timestamp: toHex(block.timestamp),
    totalDifficulty: block.totalDifficulty !== null ? toHex(block.totalDifficulty) : null,
  };
}

export function checkType(value: SafeAny) {
  const typeString = Object.prototype.toString.call(value);

  switch (typeString) {
    case '[object BigInt]':
      return 'bigint';
    case '[object String]':
      return 'string';
    case '[object Number]':
      return 'number';
    case '[object Boolean]':
      return 'boolean';
    case '[object Undefined]':
      return 'undefined';
    case '[object Null]':
      return 'null';
    case '[object Array]':
      return 'array';
    case '[object Object]':
      return 'object';
    case '[object Function]':
      return 'function';

    default:
      return 'unknown'; // 处理其他类型
  }
}

const formatBigIntToHex = (value: SafeAny) => {
  const type = checkType(value);

  if (type === 'bigint') {
    if (value < 0n) {
      return `-0x${(-value).toString(16)}`;
    }
    return toHex(value);
  }
  return value;
};

export const formatObjectWithBigInt = (obj: SafeAny): SafeAny => {
  const type = checkType(obj);

  switch (type) {
    case 'object':
      return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, formatObjectWithBigInt(value)]));
    case 'array':
      return (obj as SafeAny[]).map((value) => formatObjectWithBigInt(value));
    case 'bigint':
      return formatBigIntToHex(obj);
    case 'function':
    case 'undefined':
    case 'null':
    default:
      return obj;
  }
};

// format bigint to hex string
// export function formatUserOperation(userOp: ElytroUserOperation) {
//   const formatBigIntToHex = (value: SafeAny) => {
//     return typeof value === 'bigint' ? toHex(value) : value;
//   };

//   const formattedUserOp = Object.fromEntries(
//     Object.entries(userOp).map(([key, value]) => [
//       key,
//       formatBigIntToHex(value),
//     ])
//   );

//   return formattedUserOp as ElytroUserOperation;
// }

const BIGINT_PARAM_KEY = [
  'callGasLimit',
  'verificationGasLimit',
  'paymasterVerificationGasLimit',
  'paymasterPostOpGasLimit',
  'preVerificationGas',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
];

export function deformatObjectWithBigInt(userOp: ElytroUserOperation, customBigIntKeys: string[] = BIGINT_PARAM_KEY) {
  const deformatUserOp = Object.fromEntries(
    Object.entries(userOp).map(([key, value]) => [
      key,
      customBigIntKeys.includes(key) && value !== null ? BigInt(value) : value,
    ])
  );

  return deformatUserOp as ElytroUserOperation;
}

export function formatBlockParam(blockParam: BlockTag | bigint) {
  const useTag = typeof blockParam === 'string';

  return useTag ? { blockTag: blockParam as BlockTag } : { blockNumber: BigInt(blockParam) };
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

export function getHostname(url?: string) {
  try {
    const { hostname } = new URL(url || '--');
    return hostname;
  } catch {
    return url;
  }
}

/**
 * format balance to display
 * @param value - balance value
 * @param options - options (threshold: min value to display decimal part, maxDecimalLength: max decimal length)
 * @returns - formatted balance
 */
export function formatBalance(
  value: string | undefined,
  options: {
    threshold?: number;
    maxDecimalLength?: number;
  } = {}
): {
  integerPart: string;
  decimalPart: string;
  fullDisplay: string;
} {
  const { threshold = 0.001, maxDecimalLength = 8 } = options;

  const [integerPart, decimalPart = ''] = (value || '0').split('.');
  let formattedDecimal = '';

  if (Number(value) < threshold) {
    const firstNonZeroIndex = decimalPart.split('').findIndex((char: string) => char !== '0');
    if (firstNonZeroIndex !== -1) {
      formattedDecimal = decimalPart.slice(0, firstNonZeroIndex + 2);
    }
  } else {
    formattedDecimal = decimalPart.slice(0, maxDecimalLength);
  }

  const displayDecimalPart = formattedDecimal || '000';

  return {
    integerPart,
    decimalPart: displayDecimalPart,
    fullDisplay: `${integerPart}.${displayDecimalPart}`,
  };
}

export function formatStringifiedObject(str: SafeAny) {
  const type = checkType(str);

  if (type === 'string') {
    try {
      const parsed = JSON.parse(str);
      return parsed;
    } catch {
      return str;
    }
  } else if (type === 'object') {
    return Object.fromEntries(
      Object.entries(str).map(([key, value]): [string, SafeAny] => [key, formatStringifiedObject(value)])
    );
  }

  return str;
}

export function formatPrice(tokenAmount?: number | string, price?: number, maxDecimalLength: number = 2) {
  const tokenAmountNumber = Number(tokenAmount);

  if (Number.isNaN(tokenAmountNumber) || !price) {
    return '--';
  }

  const formattedPrice = (price * tokenAmountNumber).toFixed(maxDecimalLength);
  return Number(formattedPrice) > 0.0099 ? `$${formattedPrice}` : null;
}

export function formatDollarBalance(
  tokenPrices: TTokenPrice[],
  {
    tokenContractAddress,
    symbol,
    balance,
  }: {
    tokenContractAddress?: string;
    symbol?: string;
    balance: number;
  }
) {
  if (!tokenPrices.length) {
    return null;
  }

  const price =
    tokenPrices.find(
      (item) => item.address === tokenContractAddress || item.symbol.toLowerCase() === symbol?.toLowerCase()
    )?.price || 0;

  return price > 0 ? formatPrice(balance, price) : null;
}

export function formatErrorMsg(error: SafeAny) {
  return (error as Error)?.message || String(error) || 'Unknown Error';
}
