let cachedState = null;

document.addEventListener('DOMContentLoaded', async () => {
  await refreshState();
  document.getElementById('toggle-global').addEventListener('change', onToggleGlobal);
});

async function onToggleGlobal(event) {
  const enabled = event.target.checked;
  setStatus('Saving...');
  try {
    const res = await send('toggleGlobal', { enabled });
    cachedState = res;
    render(res);
    setStatus(`${enabled ? 'Disabled' : 'Enabled'} disk cache setting saved. Refresh pages to take effect.`);
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
}

function setStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text || '';
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
