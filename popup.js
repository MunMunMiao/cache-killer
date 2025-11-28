let cachedState = null;

const ICON_ON = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const ICON_OFF = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
  <path d="M8 8l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

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
  const label = enabled ? 'Disable' : 'Enable';
  const icon = enabled ? ICON_ON : ICON_OFF;
  btn.innerHTML = `${icon}<span class="btn-label">${label}</span>`;
  btn.setAttribute('aria-pressed', String(enabled));
  btn.setAttribute('aria-label', label);
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
