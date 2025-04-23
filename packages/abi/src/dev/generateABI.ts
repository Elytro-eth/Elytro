import { resolve } from 'node:path';
import { readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import shell from 'shelljs';

// chech if solc is installed
if (!shell.which('forge')) {
  shell.echo('this script requires forge to be installed');
  shell.exit(1);
}

const __dirname = resolve();

const elytrocontractDir = resolve(
  __dirname,
  '..',
  '..',
  'Elytro-wallet-contract'
);
console.log('elytrocontractDir', elytrocontractDir);
shell.cd(elytrocontractDir);
shell.exec('forge build', { silent: false });
const elytrowalletcontractOutDir = resolve(elytrocontractDir, 'out');
if (!existsSync(elytrowalletcontractOutDir)) {
  throw new Error(
    'Elytro-wallet-contract/out not found,please run `cd Elytro-wallet-contract && forge build`'
  );
}
// delete old abi
shell.rm('-rf', resolve(__dirname, 'src', 'ABI/*.ts'));

// get all folders in elytrocontractOutDir

const contractDir = readdirSync(elytrowalletcontractOutDir, {
  withFileTypes: true,
});

let mainTsImport = '';
let mainTsExport = '\n';

const warning =
  '//Please do not modify manually,use `git submodule update --init --recursive && pnpm run generateABI`\n\n';

for (let i = 0; i < contractDir.length; i++) {
  const subDir = contractDir[i];
  if (subDir.isDirectory()) {
    const contractPath = subDir.name;
    if (
      contractPath.endsWith('.sol') &&
      !contractPath.endsWith('.t.sol') &&
      !contractPath.endsWith('.s.sol') &&
      !contractPath.startsWith('I')
    ) {
      const className = contractPath.replace('.sol', '');
      const abiJson = resolve(subDir.path, contractPath, className + '.json');
      if (!existsSync(abiJson)) {
        console.log('skip', contractPath);
        continue;
      }
      const jsonStr = readFileSync(abiJson, 'utf-8');
      const json = JSON.parse(jsonStr);
      if (
        json.abi === undefined ||
        json.abi.length == 0 ||
        typeof json.metadata.sources !== 'object' ||
        Object.keys(json.metadata.sources).length === 0
      ) {
        console.log('skip', contractPath);
        continue;
      }

      const absolutePath: string = Object.keys(json.metadata.sources)[0];
      if (absolutePath.startsWith('contracts/')) {
        const abiFilePath = resolve(
          __dirname,
          'src',
          'ABI',
          'ABI_' + className + '.ts'
        );
        writeFileSync(
          abiFilePath,
          `${warning}export default ${JSON.stringify(json.abi, null, 2)};`
        );

        mainTsImport += `import ABI_${className} from "./ABI/ABI_${className}.js";\n`;
        mainTsExport += '    ABI_' + className + ',\n';
      } else {
        console.log('skip', absolutePath);
        continue;
      }
    }
  }
}
// entrypoint
const entryPointABI = readFileSync(
  resolve(__dirname, 'src', 'entrypoint', 'v0.7.json'),
  'utf-8'
);
const entryPointAbiFilePath = resolve(
  __dirname,
  'src',
  'ABI',
  'ABI_EntryPoint.ts'
);
writeFileSync(
  entryPointAbiFilePath,
  `${warning}export default ${entryPointABI};`
);
mainTsImport += `import ABI_EntryPoint from "./ABI/ABI_EntryPoint.js";\n`;
mainTsExport += '    ABI_EntryPoint,\n';

// zkemail
{
  const ABI_Name = 'ABI_EmailApprover';
  const ABI_Json = readFileSync(
    resolve(__dirname, 'src', 'zkemail', 'emailApprover.json'),
    'utf-8'
  );
  const ABI_Path = resolve(__dirname, 'src', 'ABI', ABI_Name + '.ts');
  writeFileSync(ABI_Path, `${warning}export default ${ABI_Json};`);
  mainTsImport += `import ${ABI_Name} from "./ABI/${ABI_Name}.js";\n`;
  mainTsExport += `    ${ABI_Name},\n`;
}
{
  const ABI_Name = 'ABI_EmailApproverFactory';
  const ABI_Json = readFileSync(
    resolve(__dirname, 'src', 'zkemail', 'emailApproverFactory.json'),
    'utf-8'
  );
  const ABI_Path = resolve(__dirname, 'src', 'ABI', ABI_Name + '.ts');
  writeFileSync(ABI_Path, `${warning}export default ${ABI_Json};`);
  mainTsImport += `import ${ABI_Name} from "./ABI/${ABI_Name}.js";\n`;
  mainTsExport += `    ${ABI_Name},\n`;
}

const mainTsFilePath = resolve(__dirname, 'src', 'main.ts');
writeFileSync(
  mainTsFilePath,
  mainTsImport + '\n\nexport { ' + mainTsExport + ' };' + '\n' + warning
);
