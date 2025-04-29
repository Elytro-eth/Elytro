export const getDAppInfoFromSender = async (
  sender: chrome.runtime.MessageSender
) => {
  const { tab, origin } = sender;
  const tabInfo = tab?.id ? await chrome.tabs.get(tab.id) : null;

  return {
    origin,
    name: tabInfo?.title || 'unknown',
    icon: tabInfo?.favIconUrl || '',
  } as TDAppInfo;
};

export const removeSearchParamsOfCurrentWindow = (paramName: string) => {
  const urlObj = new URL(window.location.href);

  urlObj.searchParams.delete(paramName);

  window.history.replaceState({}, '', urlObj);
};

export const getCurrentSearchParams = (key?: string) => {
  const urlObj = new URL(window.location.href);

  if (key) {
    return urlObj.searchParams.get(key);
  }

  return Object.fromEntries(urlObj.searchParams.entries());
};

const API_KEY_PARAMS = [
  'key',
  'apiKey',
  'apikey',
  'api_key',
  'access_key',
  'accessKey',
];

// export const urlHasApiKey = (url: string): boolean => {
//   const urlObj = new URL(url);
//   const params = new URLSearchParams(urlObj.search);
//   return API_KEY_PARAMS.some((param) => params.has(param));
// };

export const maskApiKeyInUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);

    API_KEY_PARAMS.forEach((param) => {
      if (params.has(param)) {
        params.set(param, '******');
      }
    });

    urlObj.search = params.toString();
    return urlObj.toString();
  } catch {
    return url;
  }
};
