import { SUPPORTED_CHAINS, TChainItem } from '@/constants/chains';
import { EVENT_TYPES } from '@/constants/events';
import eventBus from '@/utils/eventBus';
import LocalSubscribableStore from '@/utils/store/LocalSubscribableStore';
import { isOlderThan, CURRENT_VERSION } from '@/utils/version';
import { ethErrors } from 'eth-rpc-errors';

type TChainsState = {
  chains: TChainItem[];
  currentChain: TChainItem | null;
  version: string;
};

const CHAINS_STORAGE_KEY = 'elytroChains';

class ChainService {
  private _store: LocalSubscribableStore<TChainsState>;

  constructor() {
    this._store = new LocalSubscribableStore<TChainsState>(
      CHAINS_STORAGE_KEY,
      (initState) => {
        const needReset =
          !initState?.chains?.length ||
          !initState?.version ||
          isOlderThan(initState.version, CURRENT_VERSION);

        let broadcastChain = initState?.currentChain;

        if (needReset) {
          this._chains = [...SUPPORTED_CHAINS];
          if (broadcastChain?.id) {
            broadcastChain = SUPPORTED_CHAINS.find(
              (n) => n.id === broadcastChain!.id
            ) as TChainItem;
          }
          this._store.state.version = CURRENT_VERSION;
        }

        if (broadcastChain) {
          eventBus.emit(EVENT_TYPES.CHAIN.CHAIN_INITIALIZED, broadcastChain);
        }
      }
    );
  }

  private get _chains() {
    return this._store.state.chains;
  }

  private set _chains(chains: TChainItem[]) {
    this._store.state.chains = chains;
  }

  private get _currentChain() {
    return this._store.state.currentChain;
  }

  private set _currentChain(currentChain: TChainItem | null) {
    this._store.state.currentChain = currentChain;
  }

  public get currentChain() {
    return this._currentChain;
  }

  public get chains() {
    return this._chains;
  }

  public addChain(chain: TChainItem) {
    if (this._chains.find((n) => n.id === chain.id)) {
      throw new Error('Elytro::ChainService::addChain: chain already exists');
    }

    this._chains = [...this._chains, chain];
  }

  private _findChainById(chainId: number) {
    const targetChain = this._chains.find((n) => n.id === chainId);

    if (!targetChain) {
      throw ethErrors.rpc.server({
        code: 4902,
        message: `Unrecognized chain ID ${chainId}.`,
      });
    }

    return targetChain;
  }

  public updateChain(chainId: number, config: Partial<TChainItem>) {
    const targetChain = this._findChainById(chainId);
    const updatedChain = { ...targetChain, ...config };

    // ! reset the array reference to trigger a fully updated state
    this._chains = this._chains.map((n) =>
      n.id === chainId ? updatedChain : n
    );

    if (this._currentChain?.id === chainId) {
      this._currentChain = updatedChain;
    }
  }

  public switchChain(chainId: number) {
    if (this._currentChain?.id === chainId) {
      return;
    }

    this._currentChain = this._findChainById(chainId);

    return this._currentChain;
  }

  public deleteChain(chainId: number) {
    if (this._currentChain?.id === chainId) {
      throw new Error(
        'Elytro::ChainService::deleteChains: cannot delete current chain'
      );
    }

    this._chains = this._chains.filter((n) => n.id !== chainId);
  }
}

const chainService = new ChainService();

export default chainService;
