const STORAGE_KEYS = { GLOBAL_ENABLED: 'globalEnabled' };
const DEFAULT_STATE = { [STORAGE_KEYS.GLOBAL_ENABLED]: true };
const COOLDOWN_MS = 3000; // avoid repeated cache wipes for same host
const lastCleared = new Map();

chrome.runtime.onInstalled.addListener(ensureDefaults);
chrome.runtime.onStartup.addListener(ensureDefaults);

chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation, {
  url: [{ schemes: ['http', 'https'] }]
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = { getState: handleGetState, toggleGlobal: handleToggleGlobal };
  if (handlers[message?.type]) {
    handlers[message.type](message)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message || String(error) }));
    return true;
  }
  return false;
});

async function handleNavigation(details) {
  let host;
  try {
    host = new URL(details.url).hostname.toLowerCase();
  } catch {
    return;
  }
  const state = await loadState();
  if (!state.globalEnabled) return;

  const now = Date.now();
  if (lastCleared.has(host) && now - lastCleared.get(host) < COOLDOWN_MS) return;

  await clearCacheForHost(host);
  lastCleared.set(host, now);
}

async function clearCacheForHost(host) {
  const origins = [`https://${host}`, `http://${host}`];
  try {
    await chrome.browsingData.remove({ origins, originTypes: { unprotectedWeb: true, protectedWeb: true } }, { cache: true });
  } catch (e) {
    console.error('Failed to clear cache for', host, e);
  }
}

async function ensureDefaults() {
  const stored = await chrome.storage.sync.get(Object.values(STORAGE_KEYS));
  if (stored[STORAGE_KEYS.GLOBAL_ENABLED] === undefined) {
    await chrome.storage.sync.set(DEFAULT_STATE);
  }
}

async function loadState() {
  const stored = await chrome.storage.sync.get(Object.values(STORAGE_KEYS));
  return { globalEnabled: stored[STORAGE_KEYS.GLOBAL_ENABLED] ?? DEFAULT_STATE[STORAGE_KEYS.GLOBAL_ENABLED] };
}

async function handleGetState() {
  return loadState();
}

async function handleToggleGlobal(message) {
  const enabled = Boolean(message.enabled);
  await chrome.storage.sync.set({ [STORAGE_KEYS.GLOBAL_ENABLED]: enabled });
  if (enabled) {
    await chrome.browsingData.remove({}, { cache: true });
  }
  return loadState();
}
