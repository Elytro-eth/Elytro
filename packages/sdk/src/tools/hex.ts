export class Hex {
  public static paddingZero(
    value: string | number | bigint,
    bytesLen?: number
  ): string {
    if (typeof value === 'string') {
      if (value.startsWith('0x')) {
        value = value.slice(2);
      }
      let len = 0;
      if (bytesLen === undefined) {
        len = value.length + (value.length % 2);
      } else {
        len = bytesLen * 2;
      }
      if (value.length > len) {
        throw new Error(`value ${value} length is greater than ${len}`);
      }
      return '0x' + '0'.repeat(len - value.length) + value.toLowerCase();
    } else if (typeof value === 'number' || typeof value === 'bigint') {
      return this.paddingZero(value.toString(16), bytesLen);
    } else {
      throw new Error(`value ${value} is not string | number | bigint`);
    }
  }
  public static uint8ArrayToHex(uint8Array: Uint8Array): string {
    return (
      '0x' +
      Array.from(uint8Array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    );
  }

  public static hexToUint8Array(hex: string): Uint8Array {
    if (hex.startsWith('0x')) hex = hex.slice(2);
    const len = hex.length;
    const uint8Array = new Uint8Array(len / 2);
    for (let i = 0; i < len; i += 2) {
      uint8Array[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return uint8Array;
  }
}
