let cachedState = null;

document.addEventListener('DOMContentLoaded', async () => {
  await refreshState();
  document.getElementById('toggle-global').addEventListener('change', onToggleGlobal);
  document.getElementById('refresh-tab').addEventListener('click', refreshActiveTab);
});

async function onToggleGlobal(event) {
  const enabled = event.target.checked;
  setStatus('Saving...');
  try {
    const res = await send('toggleGlobal', { enabled });
    cachedState = res;
    render(res);
    setStatus(
      enabled
        ? 'Enabled. Refresh the active tab to apply.'
        : 'Disabled. Refresh the active tab to apply.'
    );
    showRefresh();
  } catch (e) {
    setStatus(e.message || 'Failed to save');
    event.target.checked = !enabled;
  }
}

async function refreshState() {
  const state = await send('getState');
  cachedState = state;
  render(state);
}

function render(state) {
  const globalToggle = document.getElementById('toggle-global');
  globalToggle.checked = Boolean(state.globalEnabled);
  hideRefresh(); // refresh prompt only after an explicit toggle action
}

function setStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text || '';
}

async function refreshActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.tabs.reload(tab.id);
    }
  } catch (e) {
    console.error(e);
  }
}

function showRefresh() {
  const btn = document.getElementById('refresh-tab');
  if (btn) btn.classList.remove('hidden');
}

function hideRefresh() {
  const btn = document.getElementById('refresh-tab');
  if (btn) btn.classList.add('hidden');
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
