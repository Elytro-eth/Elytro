/**
 * Simple process.nextTick polyfill for browser environments
 */

// Polyfill process.nextTick using setTimeout
if (typeof globalThis.process === 'undefined') {
  globalThis.process = {} as SafeAny;
}

if (typeof globalThis.process.nextTick !== 'function') {
  globalThis.process.nextTick = (fn: (...args: SafeAny[]) => void, ...args: SafeAny[]) => {
    setTimeout(() => fn(...args), 0);
  };
}

export {};
