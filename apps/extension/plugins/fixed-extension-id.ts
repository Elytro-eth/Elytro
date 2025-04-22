import fs from 'fs';
import path from 'path';
import { Plugin, loadEnv } from 'vite';

function fixExtensionIdPlugin(): Plugin {
  console.log('🔄 Starting fixExtensionIdPlugin ...');
  let extensionKey: string | undefined;

  return {
    name: 'elytro-fix-extension-id',
    enforce: 'post',
    apply: 'build',
    configResolved(config) {
      const env = loadEnv(config.mode, process.cwd(), '');
      extensionKey = env.DEV_EXTENSION_KEY;

      if (!extensionKey) {
        console.warn('⚠️ DEV_EXTENSION_KEY environment variable not found');
      } else {
        console.log('✅ Found extension key in environment variables');
      }
    },
    closeBundle() {
      if (!extensionKey) {
        console.warn('⚠️ No extension key available to add to manifest.json');
        return;
      }

      const outputDir = 'build';
      const manifestPath = path.resolve(
        process.cwd(),
        outputDir,
        'manifest.json'
      );

      if (!fs.existsSync(manifestPath)) {
        console.error(
          `❌ manifest.json not found in output directory: ${outputDir}`
        );
        return;
      }

      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.key = extensionKey;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('✅ Added extension key to output manifest.json');
      } catch (error) {
        console.error('❌ Failed to update output manifest.json:', error);
      }
    },
  };
}

export default fixExtensionIdPlugin;
