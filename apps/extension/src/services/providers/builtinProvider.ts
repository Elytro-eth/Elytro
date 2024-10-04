import walletClient from '../walletClient';
import { toHex } from 'viem';
import { SafeEventEmitter } from '@/utils/safeEventEmitter';

/**
 * Elytro Builtin Provider: based on EIP-1193
 */
class BuiltinProvider extends SafeEventEmitter {
  private _initialized: boolean = false;
  private _connected: boolean = false;

  constructor() {
    super();
    this.initialize();
  }

  public initialize = async () => {
    this._initialized = true;
    this._connected = true;
  };

  public get connected() {
    return this._connected;
  }

  public get initialized() {
    return this._initialized;
  }

  public async request({ method, params }: RequestArguments) {
    // TODO: try unlock if needed

    console.log('ElytroProvider getting request', method, ':\n', params);

    switch (method) {
      case 'eth_chainId':
        return toHex(walletClient.chain.id);
      case 'eth_accounts':
      case 'eth_requestAccounts':
        // return ['12Hxfu93cCXatFWELpc3Bp6X8BP5sCS4D6'];
        return; //walletClient.address ? [walletClient.address] : [];

      // TODO: implement the rest of the methods
      case 'eth_sendTransaction':
        return '0x1';
      case 'eth_signTypedDataV4':
        return '0x1';
      case 'personal_sign':
        return '0x1';
      default:
        throw new Error(`Elytro: ${method} is not supported yet.`);
    }
  }
}

const provider = new BuiltinProvider();

export default provider;
