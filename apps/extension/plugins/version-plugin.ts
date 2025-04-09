import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

interface VersionPluginOptions {
  type?: 'major' | 'minor' | 'patch';
  autoIncrement?: boolean;
}

function toChromeVersion(version: string): string {
  const parts = version.split('.');
  while (parts.length < 4) {
    parts.push('0');
  }
  return parts.slice(0, 4).join('.');
}

function versionControlPlugin({
  type = 'patch',
  autoIncrement = true,
}: VersionPluginOptions): Plugin {
  console.log('🔄 Starting versionControlPlugin ...');
  return {
    name: 'elytro-version-plugin',
    // apply: 'build',
    enforce: 'pre',

    config(config) {
      try {
        const packagePath = path.resolve(process.cwd(), 'package.json');
        const manifestPath = path.resolve(
          process.cwd(),
          'public/manifest.json'
        );

        if (!fs.existsSync(packagePath)) {
          console.error('❌ package.json file not found');
          return config;
        }

        if (!fs.existsSync(manifestPath)) {
          console.error('❌ manifest.json file not found');
          return config;
        }

        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

        if (!pkg.version) {
          console.error('❌ package.json does not have version field');
          return config;
        }

        let newVersion = pkg.version;

        if (autoIncrement) {
          const currentVersion = pkg.version;
          const versionParts = currentVersion.split('.').map(Number);

          if (versionParts.some(isNaN)) {
            console.error(`❌ Invalid version format: ${currentVersion}`);
            return config;
          }

          while (versionParts.length < 3) {
            versionParts.push(0);
          }

          const [major, minor, patch] = versionParts;

          switch (type) {
            case 'major':
              newVersion = `${major + 1}.0.0`;
              break;
            case 'minor':
              newVersion = `${major}.${minor + 1}.0`;
              break;
            case 'patch':
            default:
              newVersion = `${major}.${minor}.${patch + 1}`;
              break;
          }

          pkg.version = newVersion;

          try {
            fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
          } catch (error) {
            console.error('❌ Failed to update package.json:', error);
            return config;
          }

          manifest.version = toChromeVersion(newVersion);
          try {
            fs.writeFileSync(
              manifestPath,
              JSON.stringify(manifest, null, 2) + '\n'
            );
          } catch (error) {
            console.error('❌ Failed to update manifest.json:', error);
            pkg.version = currentVersion;
            fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
            return config;
          }

          console.log(
            `✅ Version updated: ${currentVersion} -> ${newVersion} (manifest: ${manifest.version})`
          );
        }

        return {
          define: {
            __APP_VERSION__: JSON.stringify(newVersion),
            __BUILD_TIME__: new Date().getTime(),
          },
        };
      } catch (error) {
        console.error('❌ Error during version update:', error);
        return config;
      }
    },
  };
}

export default versionControlPlugin;
