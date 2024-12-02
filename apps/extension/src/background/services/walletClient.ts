import {
  chainIdToChainNameMap,
  DEFAULT_CHAIN_TYPE,
  SUPPORTED_CHAIN_MAP,
} from '@/constants/chains';
import {
  Address,
  BlockTag,
  Chain,
  createPublicClient,
  formatEther,
  GetBlockParameters,
  Hex,
  http,
  PublicClient,
  ReadContractParameters,
  toHex,
} from 'viem';
import keyring from './keyring';
import { elytroSDK } from './sdk';
import { ethErrors } from 'eth-rpc-errors';
import { formatBlockInfo, formatBlockParam } from '@/utils/format';
import networkService from './networks';
import accountManager from './accountManager';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';

class ElytroWalletClient {
  private _address: Nullable<Address> = null;
  private _isDeployed: boolean = false;
  private _chain: Chain = SUPPORTED_CHAIN_MAP[DEFAULT_CHAIN_TYPE];
  private _balance: Nullable<string> = null;

  private _client!: PublicClient;

  constructor() {
    // default to ETH Sepolia
    this.init(this._chain.id);
    this._chainChangeWatcher();
  }

  get chain() {
    return this._chain;
  }

  get address() {
    return this._address;
  }

  get balance() {
    return this._balance;
  }

  get isActivated() {
    return this._isDeployed;
  }

  private _chainChangeWatcher() {
    eventBus.on(EVENT_TYPES.NETWORK.ITEMS_UPDATED, (currentChain) => {
      this.resetClient(currentChain.id);
    });
  }

  public resetClient(chainId: number) {
    this.init(chainId);
  }

  public async init(chainId: number) {
    if (!this._client || chainId !== this.chain.id) {
      this._chain = SUPPORTED_CHAIN_MAP[chainIdToChainNameMap[chainId]];

      this._client = createPublicClient({
        chain: this._chain,
        transport: http(this._chain.rpcUrls.default.http[0]),
      });
    }
  }

  public async initSmartAccount(): Promise<TAccountInfo | undefined> {
    await keyring.tryUnlock();
    const currentAccount = accountManager.getAccount(
      networkService.currentChain.id
    );
    if (currentAccount) {
      this._address = currentAccount.address as Address;
      this._isDeployed = await elytroSDK.isSmartAccountDeployed(this._address);

      this._balance = formatEther(
        await this._client.getBalance({
          address: this._address,
        })
      );

      return {
        address: this._address,
        ownerAddress: keyring.owner?.address,
        isActivated: this._isDeployed,
        balance: this._balance,
      };
    }
  }

  async setSocialRecoveryGuardian(walletAddress: string) {
    // TODO: implement recovery
    console.log('Elytro: Implement recovery.', walletAddress);
  }

  public async getBlockByNumber(params: GetBlockParameters) {
    const res = await this._client.getBlock(params);
    return formatBlockInfo(res);
  }

  public async getBlockNumber() {
    return toHex(await this._client.getBlockNumber());
  }

  public async signMessage(message: string) {
    if (!this._address) {
      throw ethErrors.rpc.internal();
    }

    if (typeof message !== 'string') {
      throw ethErrors.rpc.invalidParams();
    }

    // todo: maybe more params check?
    return await elytroSDK.signMessage(message, this._address);
  }

  public async getCode(address: Address, block: BlockTag | bigint = 'latest') {
    try {
      return await this._client.getCode({
        address,
        ...formatBlockParam(block),
      });
    } catch {
      throw ethErrors.rpc.invalidParams();
    }
  }

  public async rpcRequest(method: ProviderMethodType, params: SafeAny) {
    // TODO: methods will be as same as viem's request method eventually
    // TODO: maybe change all 'from' to local account?
    return await this._client.request({ method: method as SafeAny, params });
  }

  public async estimateGas(tx: SafeAny, block: BlockTag | bigint = 'latest') {
    return toHex(
      await this._client.estimateGas({
        ...tx,
        ...formatBlockParam(block),
      })
    );
  }

  public async readContract(param: ReadContractParameters) {
    return await this._client.readContract(param);
  }

  public async getTransaction(hash: Hex) {
    return await this._client.getTransaction({ hash });
  }

  // public async signTypedDataV4(params: unknown) {
  //   // todo: maybe need format the params
  //   return await keyring.owner?.signTypedData(
  //     params as unknown as SignTypedDataParameters
  //   );
  // }

  // public async personalSign(message: string) {
  //   if (!this._address) {
  //     throw ethErrors.rpc.internal();
  //   }

  //   if (typeof message !== 'string') {
  //     throw ethErrors.rpc.invalidParams();
  //   }

  //   // todo: maybe more params check?
  //   return await elytroSDK.signMessage(message, this._address);
  // }

  // public async signTypedData(data: string) {
  //   if (!this._address) {
  //     throw ethErrors.rpc.internal();
  //   }

  //   return await elytroSDK.signMessage(data, this._address);
  // }

  // public async getTransactionByHash(params: unknown) {
  //   try {
  //     if (Array.isArray(params) && params.length)
  //       return await this._client.getTransaction({ hash: params[0] });
  //     else {
  //       return new Error('Elytro: invalid params');
  //     }
  //   } catch {
  //     // do nth.
  //   }
  // }

  // public async prepareTransactionRequest(
  //   args: PrepareTransactionRequestParameters
  // ) {
  //   return await this._client.prepareTransactionRequest(args);
  // }

  // public async signTransaction(request: SafeAny) {
  //   return await this._client.signTransaction(request);
  // }

  // public async sendRawTransaction(serializedTransaction: `0x${string}`) {
  //   return await this._client.sendRawTransaction({ serializedTransaction });
  // }

  // public async getBalance() {
  //   return await this._client.getBalance({
  //     address: keyring.owner?.address as Address,
  //   });
  // }
}

const walletClient = new ElytroWalletClient();

export default walletClient;

export { ElytroWalletClient };
