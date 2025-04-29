import {
  ABI_Elytro,
  ABI_ElytroFactory,
  ABI_ERC20Paymaster,
  ABI_ReceivePayment,
  ABI_EntryPoint,
} from '..';
import { describe, expect, test } from '@jest/globals';

describe('ABI', () => {
  test('ABI defined', () => {
    expect(ABI_Elytro).toBeDefined();
    expect(ABI_ElytroFactory).toBeDefined();
    expect(ABI_ERC20Paymaster).toBeDefined();
    expect(ABI_ReceivePayment).toBeDefined();
    expect(ABI_EntryPoint).toBeDefined();
  });
});
