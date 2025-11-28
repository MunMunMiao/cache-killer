let cachedState = null;

document.addEventListener('DOMContentLoaded', async () => {
  await refreshState();
  document.getElementById('toggle-global').addEventListener('change', onToggleGlobal);
  document.getElementById('refresh-tab').addEventListener('click', refreshActiveTab);
});

async function onToggleGlobal(event) {
  const enabled = event.target.checked;
  setStatusDot(enabled);
  try {
    const res = await send('toggleGlobal', { enabled });
    cachedState = res;
    render(res);
    showRefresh();
  } catch (e) {
    event.target.checked = !enabled;
    setStatusDot(event.target.checked);
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
  setStatusDot(globalToggle.checked);
  hideRefresh();
}

function setStatusDot(on) {
  const dot = document.getElementById('state-dot');
  if (!dot) return;
  dot.classList.toggle('on', on);
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
