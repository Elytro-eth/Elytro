import { resolve } from 'path';
import fs from 'fs';
import { ethers } from 'ethers';
import { Bytes4 } from '../interface/bytes4.js';
import shell from 'shelljs';

const __dirname = resolve();
const elytrowalletabiDir = resolve(__dirname, '..', 'abi', 'src', 'ABI');

class function4bytes implements Bytes4 {
  text: string;
  bytes4: string;
  constructor(text: string) {
    this.text = text;
    if (text.includes(' ')) {
      throw new Error('text should not include space');
    }
    // bytes4 functionSignature = bytes4(keccak256("f(uint256,string)"));
    const hash = ethers.keccak256(ethers.toUtf8Bytes(text));
    this.bytes4 = hash.slice(0, 10);
  }
}

interface FieldInfo {
  components: FieldInfo[];
  //internalType: string;
  type: string;
}

async function generateElytrowalletBytes4() {
  // read all *.ts files in elytrowalletabiDir
  const files = fs.readdirSync(elytrowalletabiDir);
  const bytes4Arr: function4bytes[] = [];
  const bytes4Set: Set<string> = new Set();
  for (const file of files) {
    if (file.endsWith('.ts')) {
      const content = fs.readFileSync(resolve(elytrowalletabiDir, file), {
        encoding: 'utf-8',
      });
      const _bytes4Arr = findFunctionSign(content);
      for (const item of _bytes4Arr) {
        if (!bytes4Set.has(item.bytes4)) {
          bytes4Set.add(item.bytes4);
          bytes4Arr.push(item);
        }
      }
    }
  }
  bytes4Arr.sort((a, b) => {
    return a.bytes4.localeCompare(b.bytes4);
  });
  console.log('bytes4Arr.length', bytes4Arr.length);

  // read from 'elytrowalletBytes4.template'
  const template = fs.readFileSync(
    resolve(__dirname, 'src', 'templates', 'elytrowalletBytes4.template'),
    { encoding: 'utf-8' }
  );
  /* 
        b.set('0x00000000', { name: 'balanceOf', text: 'balanceOf(address)', bytes4: '0x70a08231' });
    */
  // replace '{{#each}}' with bytes4Arr data
  let eachBytes4Arr: string = '';
  for (const item of bytes4Arr) {
    eachBytes4Arr += `b.set('${item.bytes4}',{text:'${item.text}',bytes4:'${item.bytes4}'});\n`;
  }
  const content = template.replace('{{#each}}', eachBytes4Arr);
  // write to 'elytrowalletBytes4.ts'
  const elytrowalletBytes4Path = resolve(
    __dirname,
    'src',
    'elytrowalletBytes4.ts'
  );
  fs.writeFileSync(elytrowalletBytes4Path, content, { encoding: 'utf-8' });
}

async function generatEthereumListBytes4() {
  // clone https://github.com/ethereum-lists/4bytes.git
  const ethereumList4bytesDir = resolve(__dirname, 'ethereum-lists');
  if (!fs.existsSync(ethereumList4bytesDir)) {
    if (!shell.which('git')) {
      shell.echo('this script requires git');
      shell.exit(1);
    }
    shell.exec(
      'git clone https://github.com/ethereum-lists/4bytes.git ' +
        ethereumList4bytesDir
    );
    /*  
           WARNING:
            Even if your computer has sufficient performance, 
            it is not recommended to open the "ethereum-lists -> signatures" folder in any IDE (-_-)...
        */
  }
  const signaturesDir = resolve(ethereumList4bytesDir, 'signatures');
  // read hotbytes4.txt
  const hotbytes4 = fs.readFileSync(
    resolve(__dirname, 'src', 'templates', 'hotbytes4.txt'),
    { encoding: 'utf-8' }
  );
  const hotbytes4Json = JSON.parse(hotbytes4);
  const hotbytes4Arr = hotbytes4Json.map(
    (item: { bytes4: string }) => item.bytes4
  );
  let eachBytes4Arr: string = '';
  for (let index = 0; index < hotbytes4Arr.length; index++) {
    let bytes4 = hotbytes4Arr[index].trim();
    // remove '0x' prefix
    if (bytes4.startsWith('0x') === true) {
      bytes4 = bytes4.slice(2);
    }
    // padding to 4 bytes
    if (bytes4.length < 8) {
      bytes4 = bytes4.padStart(8, '0');
    }
    const file = resolve(signaturesDir, bytes4);
    if (fs.existsSync(file)) {
      // read
      const text = fs.readFileSync(file, { encoding: 'utf-8' });
      const _data = new function4bytes(text);
      eachBytes4Arr += `b.set('0x${_data.bytes4}',{text:'${_data.text}',bytes4:'0x${_data.bytes4}'});\n`;
    }
  }

  // read from 'hotBytes4.template'
  const template = fs.readFileSync(
    resolve(__dirname, 'src', 'templates', 'hotBytes4.template'),
    { encoding: 'utf-8' }
  );
  // replace '{{#each}}' with bytes4Arr data
  const content = template.replace('{{#each}}', eachBytes4Arr);
  // write to 'hotBytes4.ts'
  const hotBytes4Path = resolve(__dirname, 'src', 'hotBytes4.ts');
  fs.writeFileSync(hotBytes4Path, content, { encoding: 'utf-8' });
}
async function main() {
  await generateElytrowalletBytes4();
  await generatEthereumListBytes4();
}

function input2text(inputs: FieldInfo[]): string {
  let text = '(';
  for (let index = 0; index < inputs.length; index++) {
    const input = inputs[index];
    if (input.type === 'tuple') {
      text += input2text(input.components);
    } else if (input.type === 'tuple[]') {
      text += input2text(input.components) + '[]';
    } else {
      text += input.type;
    }
    if (index !== inputs.length - 1) {
      text += ',';
    }
  }
  text += ')';
  return text;
}

function findFunctionSign(content: string): function4bytes[] {
  // remove first line
  content = content.replace(/.+\n/, '');
  // remove last character
  content = content.slice(0, -1);
  // replace first 'export default '
  content = content.replace('export default ', '');
  // to json
  const json = JSON.parse(content);

  const arr: function4bytes[] = [];

  for (const item of json) {
    if (item.type === 'function') {
      const name = item.name;
      const inputs: FieldInfo[] = item.inputs;
      const text = name + input2text(inputs);
      arr.push(new function4bytes(text));
    }
  }
  return arr;
}

main();
