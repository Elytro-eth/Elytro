import { SubscribableStore } from '@/utils/store/subscribableStore';
import {
  Chain,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
} from 'viem/chains';

import { localStorage } from '@/utils/storage/local';

const customChainMapStoreKey = 'customChainMap';
const supportedChains = [mainnet, optimism, optimismSepolia, sepolia];

interface CustomChainMapStore {
  customChainMap: { [key: string]: Chain };
  currentChain: Chain;
}

class Networks {
  private _currentChain: Chain = sepolia;
  private _customChainMap: Map<string, Chain> = new Map();
  private _customChainMapStore!: SubscribableStore<CustomChainMapStore>;

  constructor() {
    this._init();
  }

  get currentChain() {
    return this._currentChain;
  }

  get chains() {
    const res: Chain[] = [...supportedChains];
    this._customChainMap.forEach((chain) => {
      return res.push(chain);
    });
    return res;
  }

  private async _init() {
    this._customChainMapStore = new SubscribableStore({
      customChainMap: {},
      currentChain: this._currentChain,
    });
    this._customChainMapStore.subscribe((state) => {
      localStorage.save({ [customChainMapStoreKey]: state });
    });
    const { [customChainMapStoreKey]: prevState } = await localStorage.get([
      customChainMapStoreKey,
    ]);
    if (prevState) {
      const state = prevState as CustomChainMapStore;
      this._customChainMapStore.setState(state);
      const nets = Object.entries(
        state.customChainMap as { [key: string]: Chain }
      );
      this._customChainMap = new Map(nets);
      this._currentChain = state.currentChain;
    }
  }

  switchNetwork(chainId: string) {
    const chain = this._customChainMap.get(chainId);
    if (chain) {
      this._currentChain = chain;
    } else {
      const supportedChain = supportedChains.find(
        (chain) => chain.id.toString() === chainId
      );
      if (supportedChain) {
        this._currentChain = supportedChain;
      }
    }
    this._customChainMapStore.setState({
      customChainMap: Object.fromEntries(this._customChainMap),
      currentChain: this._currentChain,
    });
  }
}

const networkService = new Networks();
export default networkService;
