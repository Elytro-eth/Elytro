import { resolve } from 'path';
import fs from 'fs';
import { UriCompression } from '../uriCompression';

const __dirname = resolve();

interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

async function main() {
  const tokenList = await fetch(
    'https://gateway.ipfs.io/ipns/tokens.uniswap.org'
  );
  const tokenListJson = await tokenList.json();
  const tokenListArray = tokenListJson.tokens as Token[];
  console.log('tokenList length: ', tokenListArray.length);
  let eachTokenArr: string = '';
  for (let index = 0; index < tokenListArray.length; index++) {
    const token = tokenListArray[index];
    eachTokenArr += `b.set('${token.address.toLowerCase()}|${token.chainId}',{t:2,n:'${token.name}',s:'${token.symbol}',d:${token.decimals},l:'${UriCompression.compressUri(token.logoURI)}'})\n`;
  }

  // read from 'tokens.template'
  const template = fs.readFileSync(
    resolve(__dirname, 'src', 'templates', 'tokens.template'),
    { encoding: 'utf-8' }
  );
  // replace '{{#each}}' with bytes4Arr data
  const content = template.replace('{{#each}}', eachTokenArr);
  // write to 'tokens.ts'
  const hotBytes4Path = resolve(__dirname, 'src', 'tokens.ts');
  fs.writeFileSync(hotBytes4Path, content, { encoding: 'utf-8' });
}

main();
