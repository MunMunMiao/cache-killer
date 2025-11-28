const STORAGE_KEYS = { GLOBAL_ENABLED: 'globalEnabled' };
const DEFAULT_STATE = { [STORAGE_KEYS.GLOBAL_ENABLED]: true };
const RULE_ID = 1001;

const RESOURCE_TYPES = [
  'main_frame',
  'sub_frame',
  'stylesheet',
  'script',
  'image',
  'font',
  'object',
  'xmlhttprequest',
  'ping',
  'csp_report',
  'media',
  'websocket',
  'other'
];

const REQUEST_HEADERS = [
  { header: 'Cache-Control', operation: 'set', value: 'no-cache, no-store, must-revalidate' },
  { header: 'Pragma', operation: 'set', value: 'no-cache' },
  { header: 'Expires', operation: 'set', value: '0' }
];

const RESPONSE_HEADERS = [
  { header: 'Cache-Control', operation: 'set', value: 'no-store, no-cache, must-revalidate, max-age=0' },
  { header: 'Pragma', operation: 'set', value: 'no-cache' },
  { header: 'Expires', operation: 'set', value: '0' }
];

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
  await syncRules();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await syncRules();
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
  await syncRules();
  return loadState();
}

function buildGlobalRule() {
  return {
    id: RULE_ID,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      requestHeaders: REQUEST_HEADERS,
      responseHeaders: RESPONSE_HEADERS
    },
    condition: {
      regexFilter: '^https?:\\/\\/.*',
      resourceTypes: RESOURCE_TYPES
    }
  };
}

async function syncRules() {
  const state = await loadState();
  const addRules = state.globalEnabled ? [buildGlobalRule()] : [];
  const current = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = current.map((r) => r.id); // 先清空再添加，避免 ID 冲突
  if (removeIds.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules: [] });
  }
  if (addRules.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [], addRules });
  }
}
