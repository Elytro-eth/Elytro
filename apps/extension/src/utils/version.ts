declare global {
  const __APP_VERSION__: string;
  const __BUILD_TIME__: number;
}

export const CURRENT_VERSION = `${__APP_VERSION__}.${__BUILD_TIME__}`;

export const isOlderThan = (v1: string, v2: string): boolean => {
  if (import.meta.env.DEV) {
    return true;
  }

  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < maxLength; i++) {
    const v1Part = i < v1Parts.length ? v1Parts[i] : 0;
    const v2Part = i < v2Parts.length ? v2Parts[i] : 0;

    if (v1Part === v2Part) {
      continue;
    }

    return v1Part < v2Part;
  }

  return false;
};
