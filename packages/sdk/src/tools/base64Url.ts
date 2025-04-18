export class Base64Url {
  /**
   * base64Url
   *
   * @static
   * @param {string} data
   * @return {*}
   * @memberof Base64Url
   */
  static base64Url(data: string) {
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * base64UrlToBytes32
   *
   * @static
   * @param {string} bytes32Str
   * @return {*}
   * @memberof Base64Url
   */
  static bytes32Tobase64Url(bytes32Str: string) {
    const userOpHashForBytes = bytes32Str.startsWith('0x')
      ? bytes32Str.slice(2)
      : bytes32Str;
    const byteArray = new Uint8Array(32);
    for (let i = 0; i < 64; i += 2) {
      byteArray[i / 2] = parseInt(userOpHashForBytes.substring(i, i + 2), 16);
    }
    return Base64Url.base64Url(String.fromCharCode(...byteArray));
  }
}
