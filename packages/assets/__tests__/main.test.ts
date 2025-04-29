import {
  // TokenInfo,
  // AddressType,
  // Ok, Err, Result,
  getAsset,
} from '..';
import { describe, expect, test } from '@jest/globals';

describe('Assets', () => {
  test('USDCoin', async () => {
    /*
        USDCoin
        USDC
        6
        Address:
            1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
            10:0x7f5c764cbc14f9669b88837ca1490cca17c31607
            137:0x2791bca1f2de4661ed88a30c99a7a9449aa84174
            42161:0xaf88d065e77c8cc2239327c5edb3a432268e5831
        */

    // chainId: 1
    {
      const ret = await getAsset(
        1,
        '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
      );
      expect(ret.isOk() === true).toBeTruthy();
      const tokenInfo = ret.OK;
      expect(tokenInfo.decimals).toBe(6);
      expect(tokenInfo.symbol).toBe('USDC');
      expect(tokenInfo.name).toBe('USDCoin');
    }

    // chainId: 10
    {
      const ret = await getAsset(
        10,
        '0x7f5c764cbc14f9669b88837ca1490cca17c31607'
      );
      expect(ret.isOk() === true).toBeTruthy();
      const tokenInfo = ret.OK;
      expect(tokenInfo.decimals).toBe(6);
      expect(tokenInfo.symbol).toBe('USDC.e');
      expect(tokenInfo.name).toBe('USDCoin (Bridged from Ethereum)');
    }

    // chainId: 137
    {
      const ret = await getAsset(
        137,
        '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
      );
      expect(ret.isOk() === true).toBeTruthy();
      const tokenInfo = ret.OK;
      expect(tokenInfo.decimals).toBe(6);
      expect(tokenInfo.symbol).toBe('USDC.e');
      expect(tokenInfo.name).toBe('USDCoin (PoS)');
    }

    // chainId: 42161
    {
      const ret = await getAsset(
        42161,
        '0xaf88d065e77c8cc2239327c5edb3a432268e5831'
      );
      expect(ret.isOk() === true).toBeTruthy();
      const tokenInfo = ret.OK;
      expect(tokenInfo.decimals).toBe(6);
      expect(tokenInfo.symbol).toBe('USDC');
      expect(tokenInfo.name).toBe('USDCoin');
    }
  });
});
