import { createPackageJson } from '../../create-package-json.mjs';
// createPackageJson(import.meta.dirname);
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
console.log('Current directory:', __dirname);
createPackageJson(__dirname);
