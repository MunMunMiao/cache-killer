const STORAGE_KEYS = { GLOBAL_ENABLED: 'globalEnabled' };
const DEFAULT_STATE = { [STORAGE_KEYS.GLOBAL_ENABLED]: true };
const COOLDOWN_MS = 3000;
const lastCleared = new Map();

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await applyIcon();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await applyIcon();
});

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
  if (!details?.url) return;
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
  await applyIcon();
  if (enabled) {
    try {
      await chrome.browsingData.remove({}, { cache: true });
    } catch (e) {
      console.error('Failed to clear all cache on enable', e);
    }
  }
  return loadState();
}

async function applyIcon() {
  const state = await loadState();
  const prefix = state.globalEnabled ? 'on' : 'off';
  await chrome.action.setIcon({
    path: {
      16: `assets/icon-${prefix}-16.png`,
      32: `assets/icon-${prefix}-32.png`,
      48: `assets/icon-${prefix}-48.png`,
      128: `assets/icon-${prefix}-128.png`
    }
  });
}
