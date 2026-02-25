/**
 * Smoke test — account lifecycle with device key (no passwords).
 *
 * Directly calls services to verify:
 *   init → create → list → info → switch → multi-account → persistence
 *   device key: generation, save/load, permission check
 *   export/import: password-based backup round-trip
 *
 * Usage:
 *   npm test                                              # basic (no RPC)
 *   ELYTRO_ALCHEMY_KEY=xxx npm test                       # with on-chain queries
 */

import { strict as assert } from 'node:assert';
import { rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { FileStore } from '../src/storage';
import { KeyringService, ChainService, SDKService, WalletClientService, AccountService } from '../src/services';
import { generateDeviceKey, saveDeviceKey, loadDeviceKey, validateDeviceKey } from '../src/utils/deviceKey';

const TEST_DIR = join(tmpdir(), `.elytro-test-${Date.now()}`);

let passed = 0;
let failed = 0;

function ok(name: string) {
  passed++;
  console.log(`  ✔ ${name}`);
}

function fail(name: string, err: unknown) {
  failed++;
  console.error(`  ✖ ${name}: ${err}`);
}

async function setup() {
  const store = new FileStore(TEST_DIR);
  await store.init();

  const keyring = new KeyringService(store);
  const chain = new ChainService(store);
  const sdk = new SDKService();
  const walletClient = new WalletClientService();

  await chain.init();
  walletClient.initForChain(chain.currentChain);
  await sdk.initForChain(chain.currentChain);

  const account = new AccountService({ store, keyring, sdk, chain, walletClient });
  await account.init();

  return { store, keyring, chain, sdk, walletClient, account };
}

async function main() {
  console.log(`\n── Smoke Test (data: ${TEST_DIR}) ──\n`);

  const { store, keyring, chain, sdk, walletClient, account } = await setup();
  const chainId = chain.currentChainId;

  // ─── 1. Device Key ─────────────────────────────────────────
  console.log('[device key]');
  let deviceKey: Uint8Array;
  try {
    deviceKey = generateDeviceKey();
    assert.equal(deviceKey.length, 32);
    ok('generate 32 bytes');
  } catch (e) {
    fail('generate', e);
    return;
  }

  try {
    await saveDeviceKey(TEST_DIR, deviceKey);
    const st = await stat(join(TEST_DIR, '.device-key'));
    assert.equal(st.size, 32);
    assert.equal(st.mode & 0o777, 0o600);
    ok('save with chmod 600');
  } catch (e) {
    fail('save', e);
  }

  try {
    const loaded = await loadDeviceKey(TEST_DIR);
    assert.ok(loaded);
    assert.deepEqual(loaded, deviceKey);
    ok('load matches original');
  } catch (e) {
    fail('load', e);
  }

  try {
    const missing = await loadDeviceKey(join(tmpdir(), 'nonexistent'));
    assert.equal(missing, null);
    ok('load missing → null');
  } catch (e) {
    fail('load missing', e);
  }

  try {
    assert.throws(() => validateDeviceKey(new Uint8Array(16)), /expected 32/);
    ok('reject invalid length');
  } catch (e) {
    fail('validate', e);
  }

  // ─── 2. Init ───────────────────────────────────────────────
  console.log('[init]');
  try {
    assert.equal(await keyring.isInitialized(), false);
    const owner = await keyring.createNewOwner(deviceKey);
    assert.match(owner, /^0x[0-9a-fA-F]{40}$/);
    assert.equal(await keyring.isInitialized(), true);
    ok('wallet created');
  } catch (e) {
    fail('wallet created', e);
  }

  // ─── 3. Unlock / Lock ─────────────────────────────────────
  console.log('[unlock]');
  try {
    // createNewOwner leaves vault unlocked in memory — lock first
    keyring.lock();
    assert.equal(keyring.isUnlocked, false);
    await keyring.unlock(deviceKey);
    assert.equal(keyring.isUnlocked, true);
    ok('unlock succeeds');
  } catch (e) {
    fail('unlock succeeds', e);
  }

  try {
    keyring.lock();
    assert.equal(keyring.isUnlocked, false);
    await keyring.unlock(deviceKey);
    ok('lock then re-unlock');
  } catch (e) {
    fail('lock then re-unlock', e);
  }

  try {
    // Wrong key should fail decryption
    const wrongKey = generateDeviceKey();
    keyring.lock();
    await assert.rejects(() => keyring.unlock(wrongKey));
    // Re-unlock with correct key
    await keyring.unlock(deviceKey);
    ok('wrong device key rejected');
  } catch (e) {
    fail('wrong device key rejected', e);
  }

  // ─── 4. Create account ────────────────────────────────────
  console.log('[account create]');
  try {
    const a = await account.createAccount(chainId, 'alpha-wolf');
    assert.equal(a.alias, 'alpha-wolf');
    assert.equal(a.chainId, chainId);
    assert.equal(a.index, 0);
    assert.match(a.address, /^0x[0-9a-fA-F]{40}$/);
    ok(`created "alpha-wolf" (index=0) → ${a.address}`);
  } catch (e) {
    fail('create with alias', e);
  }

  try {
    const b = await account.createAccount(1); // mainnet, auto alias
    assert.ok(b.alias.includes('-'), `auto alias: ${b.alias}`);
    assert.equal(b.chainId, 1);
    assert.equal(b.index, 0); // first account on chain 1
    ok(`created auto-alias "${b.alias}" on chain 1`);
  } catch (e) {
    fail('create with auto alias', e);
  }

  // ─── 5. Multi-account on same chain ────────────────────────
  console.log('[multi-account same chain]');
  try {
    const c = await account.createAccount(chainId, 'beta-wolf');
    assert.equal(c.alias, 'beta-wolf');
    assert.equal(c.chainId, chainId);
    assert.equal(c.index, 1); // second account on same chain
    assert.match(c.address, /^0x[0-9a-fA-F]{40}$/);
    // Address must differ from first account on same chain
    const first = account.resolveAccount('alpha-wolf')!;
    assert.notEqual(c.address, first.address);
    ok(`created "beta-wolf" (index=1) → ${c.address} (different from alpha-wolf)`);
  } catch (e) {
    fail('multi-account same chain', e);
  }

  // ─── 6. Duplicate alias check ─────────────────────────────
  console.log('[duplicate]');
  try {
    await assert.rejects(() => account.createAccount(42161, 'alpha-wolf'), /already taken/);
    ok('duplicate alias rejected');
  } catch (e) {
    fail('duplicate alias rejected', e);
  }

  // ─── 7. List ──────────────────────────────────────────────
  console.log('[account list]');
  try {
    const all = account.allAccounts;
    assert.equal(all.length, 3);
    ok(`total: ${all.length} accounts`);
  } catch (e) {
    fail('list all', e);
  }

  try {
    const byChain = account.getAccountsByChain(chainId);
    assert.equal(byChain.length, 2);
    ok(`filter by chain ${chainId}: ${byChain.length}`);
  } catch (e) {
    fail('filter by chain', e);
  }

  // ─── 8. Resolve by alias / address ────────────────────────
  console.log('[resolve]');
  try {
    const byAlias = account.resolveAccount('alpha-wolf');
    assert.ok(byAlias);
    assert.equal(byAlias!.alias, 'alpha-wolf');
    ok('resolve by alias');
  } catch (e) {
    fail('resolve by alias', e);
  }

  try {
    const addr = account.allAccounts[0].address;
    const byAddr = account.resolveAccount(addr);
    assert.ok(byAddr);
    assert.equal(byAddr!.address, addr);
    ok('resolve by address');
  } catch (e) {
    fail('resolve by address', e);
  }

  try {
    const missing = account.resolveAccount('no-such-name');
    assert.equal(missing, null);
    ok('resolve missing → null');
  } catch (e) {
    fail('resolve missing', e);
  }

  // ─── 9. Switch ────────────────────────────────────────────
  console.log('[account switch]');
  try {
    const switched = await account.switchAccount('alpha-wolf');
    assert.equal(account.currentAccount?.alias, 'alpha-wolf');
    ok(`switched to "${switched.alias}"`);
  } catch (e) {
    fail('switch', e);
  }

  // ─── 10. On-chain info (optional, needs RPC key) ──────────
  console.log('[account info]');
  try {
    const detail = await account.getAccountDetail('alpha-wolf');
    assert.equal(typeof detail.isDeployed, 'boolean');
    assert.ok(detail.balance);
    ok(`deployed=${detail.isDeployed}, balance=${detail.balance} ETH`);
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('fetch') || msg.includes('HTTP')) {
      ok('skipped (no RPC key) — set ELYTRO_ALCHEMY_KEY to test');
    } else {
      fail('account info', e);
    }
  }

  // ─── 11. Persistence ──────────────────────────────────────
  console.log('[persistence]');
  try {
    const account2 = new AccountService({ store, keyring, sdk, chain, walletClient });
    await account2.init();
    const reloaded = account2.allAccounts;
    assert.equal(reloaded.length, 3);
    assert.equal(reloaded[0].alias, 'alpha-wolf');
    ok(`reloaded ${reloaded.length} accounts from disk`);
  } catch (e) {
    fail('persistence', e);
  }

  // ─── 12. Export / Import (password-based backup) ──────────
  console.log('[export/import]');
  try {
    const exportPassword = 'backup-pass-789';
    const exported = await keyring.exportVault(exportPassword);
    assert.ok(exported.data);
    assert.equal(exported.version, 1); // password-based = version 1
    ok('export with password');

    // Import on a fresh keyring
    const store2 = new FileStore(join(TEST_DIR, 'import-test'));
    await store2.init();
    const keyring2 = new KeyringService(store2);
    const deviceKey2 = generateDeviceKey();

    await keyring2.importVault(exported, exportPassword, deviceKey2);
    assert.equal(keyring2.isUnlocked, true);
    assert.equal(keyring2.currentOwner, keyring.currentOwner);
    ok('import with password → re-encrypted with new device key');

    // Verify the imported vault can be unlocked with new device key
    keyring2.lock();
    await keyring2.unlock(deviceKey2);
    assert.equal(keyring2.isUnlocked, true);
    ok('re-unlock imported vault with new device key');

    await rm(join(TEST_DIR, 'import-test'), { recursive: true, force: true });
  } catch (e) {
    fail('export/import', e);
  }

  // ─── Cleanup ──────────────────────────────────────────────
  keyring.lock();
  await rm(TEST_DIR, { recursive: true, force: true });

  // ─── Summary ──────────────────────────────────────────────
  console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('\n── FATAL ──');
  console.error(err);
  process.exitCode = 1;
});
