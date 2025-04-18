// const fs = require('fs');
// const path = require('path');
import fs from 'fs';
import path from 'path';

export const createPackageJson = (basePath) => {

  const packageJson = JSON.parse(fs.readFileSync(path.resolve(basePath, 'package.json')).toString('utf8'));
  let browser = '';
  if (typeof packageJson.browser === 'object') {
    browser += '"browser":'
    browser += JSON.stringify(packageJson.browser, null, 2).replace(/\/lib\.esm/g, '');
    browser += ',';
  }

  const cjsPackageJson = JSON.stringify(JSON.parse(`{
            ${browser}
            "type": "commonjs"
          }`), null, 2);
  const esmPackageJson = JSON.stringify(JSON.parse(`{
            ${browser}
            "type": "module"
          }`), null, 2);
  const cjsPackageJsonPath = path.resolve(basePath, 'lib.cjs', 'package.json');
  const esmPackageJsonPath = path.resolve(basePath, 'lib.esm', 'package.json');

  fs.writeFileSync(cjsPackageJsonPath, cjsPackageJson);
  fs.writeFileSync(esmPackageJsonPath, esmPackageJson);
};
