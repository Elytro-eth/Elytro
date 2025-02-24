import { toast } from '@/hooks/use-toast';

/**
 * Copy text using modern Clipboard API
 * @param text copied text
 * @returns Promise<void>
 */
const copyWithClipboardAPI = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

/**
 * Alternative method to copy text using execCommand
 * @param text copied text
 * @returns Promise<void>
 */
const copyWithExecCommand = (text: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position: absolute; left: -9999px; top: -9999px';

    document.body.appendChild(textarea);

    try {
      textarea.select();
      const success = document.execCommand('copy');
      if (!success) {
        throw new Error('Copy failed');
      }
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(textarea);
    }
  });

/**
 * Check if browser supports Clipboard API
 * @returns boolean
 */
const isClipboardAPISupported = (): boolean =>
  navigator.clipboard !== undefined &&
  navigator.clipboard.writeText !== undefined;

/**
 * Safe clipboard operation function
 * @param text text to be copied
 * @returns Promise<void>
 */
export const safeClipboard = async (
  text: string,
  showToast = true,
  onCopied?: (error?: Error) => void
): Promise<void> => {
  try {
    if (isClipboardAPISupported()) {
      await copyWithClipboardAPI(text);
    } else {
      await copyWithExecCommand(text);
    }

    if (showToast) {
      toast({
        title: 'Copied',
      });
    }
    onCopied?.();
  } catch (error) {
    toast({
      title: 'Copy failed',
    });
    onCopied?.(error as Error);
    throw error;
  }
};
