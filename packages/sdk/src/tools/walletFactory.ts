import { ethers } from 'ethers';
import { TypeGuard } from './typeGuard.js';
import { Hex } from './hex.js';

export class WalletFactory {
  static proxyCode(implementation: string): string {
    /*
        deploymentData = abi.encodePacked(
             hex"603d3d8160223d3973",
             implementation,
             hex"60095155f3363d3d373d3d363d7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc545af43d6000803e6038573d6000fd5b3d6000f3"
         );
        */

    if (TypeGuard.onlyAddress(implementation).isErr() === true) {
      throw new Error('implementation is invalid');
    }
    const _implementation = implementation.substring(2);
    const deploymentData =
      '0x603d3d8160223d3973' +
      _implementation +
      '60095155f3363d3d373d3d363d7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc545af43d6000803e6038573d6000fd5b3d6000f3';
    return deploymentData.toLowerCase();
  }

  static calcSalt(initializer: string, salt: string): string {
    /*
            function _calcSalt(bytes memory _initializer, bytes32 _salt) private pure returns (bytes32 salt) {
                return keccak256(abi.encodePacked(keccak256(_initializer), _salt));
            }
        */
    const _bytes = ethers.solidityPacked(
      ['bytes', 'bytes32'],
      [ethers.keccak256(initializer), salt]
    );
    const _salt = ethers.keccak256(_bytes).toLowerCase();
    return _salt;
  }

  /**
   * get wallet address salt from readable index
   * baseSalt = keccak256(bytes(chainId))
   * Salt = baseSalt + index
   *
   * @static
   * @param {number} index readable index
   * @param {(number|string)} chainId number or hex string(must start with 0x)
   * @return {*}  {string} bytes32 salt
   * @memberof WalletFactory
   */
  static calcWalletAddressSalt(
    index: number,
    chainId: number | string
  ): string {
    let _chainId = '';
    if (typeof chainId === 'number') {
      _chainId = chainId.toString(16).toLowerCase();
    } else {
      if (!chainId.startsWith('0x')) {
        throw new Error('chainId must start with 0x');
      }
      _chainId = chainId.substring(2).toLowerCase();
    }
    if (_chainId.length % 2 === 1) {
      _chainId = '0' + _chainId;
    }
    _chainId = '0x' + _chainId;
    let baseSalt = BigInt(ethers.keccak256(_chainId));
    baseSalt += BigInt(index);
    return Hex.paddingZero(baseSalt, 32).toLowerCase();
  }

  /**
   * get wallet address
   *
   * @static
   * @param {string} elytroWalletFactoryAddress
   * @param {string} implementation
   * @param {string} initializer
   * @param {string} salt
   * @return {*}  {string}
   * @memberof WalletFactory
   */
  static getWalletAddress(
    elytroWalletFactoryAddress: string,
    implementation: string,
    initializer: string,
    salt: string
  ): string {
    /* 
             function getWalletAddress(bytes memory _initializer, bytes32 _salt) external view returns (address proxy) {
                bytes memory deploymentData = _proxyCode(_WALLETIMPL);
                bytes32 salt = _calcSalt(_initializer, _salt);
                proxy = Create2.computeAddress(salt, keccak256(deploymentData));
            }
        */
    return ethers.getCreate2Address(
      elytroWalletFactoryAddress,
      WalletFactory.calcSalt(initializer, salt),
      ethers.keccak256(WalletFactory.proxyCode(implementation))
    );
  }

  /**
   * get wallet address by readable index
   *
   * @static
   * @param {string} elytroWalletFactoryAddress
   * @param {string} implementation
   * @param {string} initializer
   * @param {number} index
   * @param {(number | string)} chainId number or hex string(must start with 0x)
   * @return {*}  {string}
   * @memberof WalletFactory
   */
  static getWalletAddressByIndex(
    elytroWalletFactoryAddress: string,
    implementation: string,
    initializer: string,
    index: number,
    chainId: number | string
  ): string {
    return WalletFactory.getWalletAddress(
      elytroWalletFactoryAddress,
      implementation,
      initializer,
      WalletFactory.calcWalletAddressSalt(index, chainId)
    );
  }
}
