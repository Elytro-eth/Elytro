import { Plugin } from 'vite';
import { renameSync, createWriteStream } from 'fs';
import { format } from 'date-fns';
import archiver from 'archiver';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

function renameAndPackOutputPlugin(): Plugin {
  console.log('🔄 Starting renameAndPackOutputPlugin ...');
  return {
    name: 'elytro-rename-and-pack-output-plugin',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const timestamp = format(new Date(), 'MMdd-HH:mm');
      const newDirName = `elytro-${timestamp}`;
      const oldDirName = 'build'; // Assuming the default output directory is 'build'

      try {
        renameSync(oldDirName, newDirName);
        console.log(`Output directory renamed to: ${newDirName}`);

        const output = createWriteStream(`${newDirName}.zip`);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          console.log(
            `Archive created: ${newDirName}.zip (${formatFileSize(archive.pointer())} total bytes)`
          );
        });

        archive.on('warning', (err) => {
          if (err.code === 'ENOENT') {
            console.warn('Warning during archiving:', err);
          } else {
            throw err;
          }
        });

        archive.on('error', (err) => {
          throw err;
        });

        archive.pipe(output);
        archive.directory(newDirName, false);
        archive.finalize();
      } catch (error) {
        console.error('Error renaming output directory:', error);
      }
    },
  };
}

export default renameAndPackOutputPlugin;
