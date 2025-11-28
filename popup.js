let cachedState = null;

document.addEventListener('DOMContentLoaded', async () => {
  await refreshState();
  document.getElementById('toggle-btn').addEventListener('click', onToggle);
  document.getElementById('refresh-tab').addEventListener('click', refreshActiveTab);
});

async function onToggle() {
  const enabled = !(cachedState?.globalEnabled);
  setLocalUI(enabled);
  try {
    const res = await send('toggleGlobal', { enabled });
    cachedState = res;
    render(res, true);
  } catch (e) {
    setLocalUI(!enabled); // revert
  }
}

async function refreshState() {
  const state = await send('getState');
  cachedState = state;
  render(state, false);
}

function render(state, showRefreshPrompt) {
  setLocalUI(state.globalEnabled);
  if (showRefreshPrompt) showRefresh(); else hideRefresh();
}

function setLocalUI(enabled) {
  const btn = document.getElementById('toggle-btn');
  const stateText = document.getElementById('state-text');
  if (!btn || !stateText) return;
  btn.textContent = enabled ? 'Disable' : 'Enable';
  stateText.textContent = enabled ? 'Enabled (cache cleared on nav)' : 'Disabled (browser default)';
}

async function refreshActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await chrome.tabs.reload(tab.id);
  } catch (e) {
    console.error(e);
  }
}

function showRefresh() {
  const row = document.getElementById('refresh-row');
  if (row) row.classList.remove('hidden');
}

function hideRefresh() {
  const row = document.getElementById('refresh-row');
  if (row) row.classList.add('hidden');
}

function send(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, ...payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error || 'Unknown error'));
        return;
      }
      resolve(response.result);
    });
  });
}
