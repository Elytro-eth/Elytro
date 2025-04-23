export class UriCompression {
  /* 
  https://assets.coingecko.com/coins/images/
  https://raw.githubusercontent.com/
  */
  public static compressUri(uri?: string): string | undefined {
    if (typeof uri === 'string') {
      if (uri.indexOf('https://assets.coingecko.com/coins/images/') === 0) {
        uri = 'cgk:' + uri.substring(42);
      } else if (uri.indexOf('https://raw.githubusercontent.com/') === 0) {
        uri = 'gh:' + uri.substring(34);
      }
      return uri;
    } else {
      return undefined;
    }
  }

  public static decompressUri(compressedUri?: string): string | undefined {
    if (typeof compressedUri === 'string') {
      if (compressedUri.indexOf('cgk:') === 0) {
        compressedUri =
          'https://assets.coingecko.com/coins/images/' +
          compressedUri.substring(4);
      } else if (compressedUri.indexOf('gh:') === 0) {
        compressedUri =
          'https://raw.githubusercontent.com/' + compressedUri.substring(3);
      }
      return compressedUri;
    } else {
      return undefined;
    }
  }
}
