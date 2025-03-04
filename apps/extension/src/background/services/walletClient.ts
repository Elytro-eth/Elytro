import { TChainItem } from '@/constants/chains';
import {
  Address,
  BlockTag,
  createPublicClient,
  GetBlockParameters,
  Hex,
  http,
  PublicClient,
  ReadContractParameters,
  toHex,
} from 'viem';
import { ethErrors } from 'eth-rpc-errors';
import { formatBlockInfo, formatBlockParam } from '@/utils/format';
import { normalize } from 'viem/ens';
import { elytroSDK } from './sdk';
import eventBus from '@/utils/eventBus';
import { EVENT_TYPES } from '@/constants/events';

class ElytroWalletClient {
  private _client: Nullable<PublicClient>;

  constructor() {
    eventBus.on(EVENT_TYPES.CHAIN.CHAIN_INITIALIZED, (chain: TChainItem) => {
      this.init(chain);
    });
  }

  get client() {
    return this._client!;
  }

  set client(client: PublicClient) {
    this._client = client;
  }

  public init(chain: TChainItem) {
    if (chain.id && chain.id !== this._client?.chain?.id) {
      this._client = createPublicClient({
        chain,
        transport: http(chain.endpoint || chain.rpcUrls.default.http[0]),
      });
    }
  }

  public async getBlockByNumber(params: GetBlockParameters) {
    const res = await this.client.getBlock(params);
    return formatBlockInfo(res);
  }

  public async getBlockNumber() {
    return toHex(await this.client.getBlockNumber());
  }

  public async getCode(address: Address, block: BlockTag | bigint = 'latest') {
    try {
      return await this.client.getCode({
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
    return await this.client.request({ method: method as SafeAny, params });
  }

  public async estimateGas(tx: SafeAny, block: BlockTag | bigint = 'latest') {
    return toHex(
      await this.client.estimateGas({
        ...tx,
        ...formatBlockParam(block),
      })
    );
  }

  public async readContract(param: ReadContractParameters) {
    return await this.client.readContract(param);
  }

  public async getTransaction(hash: Hex) {
    return await this.client.getTransaction({ hash });
  }

  public async getBalance(address: Address) {
    return await this.client.getBalance({
      address,
    });
  }

  public async getENSAddressByName(name: string) {
    try {
      const ensAddress = await this.client.getEnsAddress({
        name: normalize(name),
      });
      return ensAddress;
    } catch (error) {
      throw ethErrors.rpc.internal((error as Error)?.message);
    }
  }

  public async getENSAvatarByName(name: string) {
    const ensResolverAddress =
      this?.client?.chain?.contracts?.ensUniversalResolver?.address;

    if (!ensResolverAddress) {
      throw new Error('Elytro: Chain does not support ENS');
    }

    try {
      const avatar = await this.client.getEnsAvatar({
        name: normalize(name),
        universalResolverAddress: ensResolverAddress,
      });
      return avatar;
    } catch (error) {
      throw ethErrors.rpc.internal((error as Error)?.message);
    }
  }

  public async getTransactionReceipt(hash: Hex) {
    // TODO: check if it's a user operation hash
    return await elytroSDK.getUserOperationReceipt(hash);
  }
}

const walletClient = new ElytroWalletClient();

export default walletClient;

export { ElytroWalletClient };
