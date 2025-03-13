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
