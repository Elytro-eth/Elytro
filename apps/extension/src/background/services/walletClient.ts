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
    if (
      (chain.id && chain.id !== this._client?.chain?.id) ||
      (chain.endpoint && chain.endpoint !== this._client?.transport.url)
    ) {
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
    return await this.client.getBlockNumber();
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
    } catch {
      return null;
    }
  }

  public async getENSAvatarByName(name: string) {
    const ensResolverAddress = this?.client?.chain?.contracts?.ensUniversalResolver?.address;

    if (!ensResolverAddress) {
      return null;
    }

    try {
      const avatar = await this.client.getEnsAvatar({
        name: normalize(name),
        universalResolverAddress: ensResolverAddress,
      });
      return avatar;
    } catch {
      return null;
    }
  }

  public async getTokenInfo(address: Address): Promise<TTokenInfo> {
    try {
      const erc20Abi = [
        {
          type: 'function',
          name: 'name',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'string' }],
        },
        {
          type: 'function',
          name: 'symbol',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'string' }],
        },
        {
          type: 'function',
          name: 'decimals',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'uint8' }],
        },
      ] as const;

      const [name, symbol, decimals] = await Promise.all([
        this.client
          .readContract({
            address,
            abi: erc20Abi,
            functionName: 'name',
          })
          .catch(() => ''),
        this.client
          .readContract({
            address,
            abi: erc20Abi,
            functionName: 'symbol',
          })
          .catch(() => ''),
        this.client
          .readContract({
            address,
            abi: erc20Abi,
            functionName: 'decimals',
          })
          .catch(() => 0),
      ]);

      console.log('Elytro: tokenInfo', { name, symbol, decimals });

      return {
        address: address as `0x${string}`,
        name: name as string,
        symbol: symbol as string,
        decimals: Number(decimals),
        logoURI: '',
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('No contract found')) {
        throw new Error('No contract found at this address');
      }

      if (error instanceof Error && error.message.includes('Invalid token address')) {
        throw new Error('Invalid token address format');
      }

      throw new Error(`Failed to get token info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

const walletClient = new ElytroWalletClient();

export default walletClient;

export { ElytroWalletClient };
