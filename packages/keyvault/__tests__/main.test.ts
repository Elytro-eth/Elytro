import { Vault } from '..';
import { describe, expect, test } from '@jest/globals';
// import * as bip39 from 'bip39';
import { ethers } from 'ethers';

const tag = new Date().getTime().toString() + Math.random().toString();
const phrase =
  'sunset identify desk fox deposit empower exotic soon develop slogan calm curtain';
const wallet = ethers.HDNodeWallet.fromPhrase(phrase);

describe('KeyVault', () => {
  test('init', async () => {
    const vault: Vault = new Vault(tag);
    {
      const ret = await vault.isInitialized();
      expect(ret.OK).toBe(false);
    }
    {
      const ret = await vault.initBip39(phrase, 'password');
      expect(ret.isOk()).toBe(true);
    }
    {
      const ret = await vault.isInitialized();
      expect(ret.OK).toBe(true);
    }
    {
      const ret1 = await vault.getSigner(Vault.DEFAULT_PATH);
      expect(ret1.isOk()).toBe(true);
      expect(ret1.OK).toBe(wallet.address);

      const ret2 = await vault.getSigner("m/44'/60'/0'/0/1");
      expect(ret2.isOk()).toBe(true);
      expect(ret2.OK).toBe('0x139C0C3272c19D48C2ab41A02fd7a3ba479297A5');
    }
    {
      const ret = await vault.isLocked();
      expect(ret.OK).toBe(false);
    }
    {
      const ret = await vault.lock();
      expect(ret.isOk()).toBe(true);
    }
    {
      const ret = await vault.isLocked();
      expect(ret.OK).toBe(true);
    }
  });

  test('unlock', async () => {
    const vault: Vault = new Vault(tag);
    {
      const ret = await vault.isInitialized();
      expect(ret.OK).toBe(true);
    }
    {
      const ret = await vault.isLocked();
      expect(ret.OK).toBe(true);
    }
    {
      const ret = await vault.unlock('password1');
      expect(ret.isOk()).toBe(false);
    }
    {
      const ret = await vault.unlock('password');
      expect(ret.isOk()).toBe(true);
    }
    await vault.lock();
  });

  test('sign', async () => {
    const vault: Vault = new Vault(tag);
    {
      const ret = await vault.isInitialized();
      expect(ret.OK).toBe(true);
    }
    {
      const ret = await vault.isLocked();
      expect(ret.OK).toBe(true);
    }
    {
      const ret = await vault.unlock('password');
      expect(ret.isOk()).toBe(true);
    }
    {
      // bytes32 message (userOpHash)
      const message =
        '0x11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';
      const expected = await wallet.signMessage(ethers.getBytes(message));
      const ret = await vault.personalSign(
        ethers.getBytes(message),
        Vault.DEFAULT_PATH
      );
      expect(ret.isOk()).toBe(true);
      expect(ret.OK.signature).toBe(expected);

      // const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      // const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      // const domain = {
      //     name: "KeyStore",
      //     version: "1",
      //     chainId: "1",
      //     verifyingContract: "0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8",
      // };
      // // SocialRecovery(bytes32 keyStoreSlot,uint256 nonce,bytes32 newSigner)
      // const types = {
      //     SocialRecovery: [
      //         { name: "keyStoreSlot", type: "bytes32" },
      //         { name: "nonce", type: "uint256" },
      //         { name: "newSigner", type: "bytes32" },
      //     ],
      // };
      // const message = {
      //     keyStoreSlot: "0xc51741c8874df1df257297f788f646814d6942f81b1838c5467796268fde8957",
      //     nonce: "1",
      //     newSigner: "0x000000000000000000000000f8e81D47203A594245E36C48e151709F0C19fBe8",
      // };
      // await vault.importSigner(privateKey);
      // const ret = await vault.typedDataSign(address, domain, types, message);
      // expect(ret.isOk()).toBe(true);
      // expect(ret.OK).toBe('0x36a9d704c58920da18f1bf2102126552d2dada4e18d53b5765fddbd5049a69f56724472e069a452467cd5ae6f834345578833c24702264f1c7a4c5111eaf41591c');
    }
    await vault.lock();
  });
});
