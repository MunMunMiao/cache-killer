# Cache Killer Switch

A Chrome Manifest V3 extension that disables cache by rewriting request/response headers via `declarativeNetRequest`. One global toggle, no extra config.

## Features
- Global toggle: when enabled, all HTTP/HTTPS requests carry no-cache headers; responses are also forced `no-store`.
- Minimal popup: single switch, optional refresh button.

## How it works
- Adds a DNR dynamic rule (id=1) when enabled, removing it when disabled.
- Rule sets `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0` on both request and response for all resource types.
- Because headers are rewritten, effect is immediate—no need等待清理磁盘缓存。

## Structure
- `manifest.json` — MV3 config and permissions (`declarativeNetRequest`, `storage`, `<all_urls>`).
- `background.js` — stores toggle state and syncs the DNR rule.
- `popup.html/css/js` — popup UI with the global switch and refresh helper.
- `assets/icon-*.png` — icons 16/32/48/128.

## Install for development
1. Open Chrome `chrome://extensions/`.
2. Enable “Developer mode”.
3. Click “Load unpacked” and select this folder.

## Usage
- Open the popup, click the button to Enable/Disable cache-killing.
- After toggling, click the small refresh button or manually reload the active tab to apply immediately to that page.

## Manual test checklist
- [ ] Enable, reload a page: DevTools Network should no longer show “from disk cache”; request headers include `Cache-Control: no-cache, no-store`.
- [ ] Disable, reload: cache works normally; headers back to default.
- [ ] State persists after browser restart.

## Chrome Web Store notes
- Permissions: `declarativeNetRequest` (header rewrite), `storage`, `<all_urls>`.
- Privacy: only a boolean toggle is stored locally; no data is sent out.
- Provide a short GIF showing toggle + reload when submitting.

## Known limitations
- If another extension sets conflicting cache headers, the higher-priority DNR rule wins based on Chrome’s precedence (dynamic rules usually win over static, then over server headers).
- Does not clear existing cache on disk; it prevents reuse by marking responses no-store/no-cache.
