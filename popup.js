let cachedState = null;

document.addEventListener('DOMContentLoaded', async () => {
  await refreshState();
  document.getElementById('toggle-btn').addEventListener('click', onToggle);
});

async function onToggle() {
  const enabled = !(cachedState?.globalEnabled);
  setLocalUI(enabled);
  try {
    const res = await send('toggleGlobal', { enabled });
    cachedState = res;
    render(res);
  } catch (e) {
    setLocalUI(!enabled); // revert
  }
}

async function refreshState() {
  const state = await send('getState');
  cachedState = state;
  render(state);
}

function render(state) {
  setLocalUI(state.globalEnabled);
}

function setLocalUI(enabled) {
  const btn = document.getElementById('toggle-btn');
  if (!btn) return;
  btn.textContent = enabled ? 'Disable' : 'Enable';
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
