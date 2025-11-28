# Cache Killer Switch

A Chrome Manifest V3 extension that clears **disk cache** on navigation using `chrome.browsingData.remove`, giving you a single global toggle equivalent to DevTools “Disable cache” without modifying request/response headers.

## Features
- Global toggle: when enabled, every HTTP/HTTPS navigation clears the destination site's disk cache.
- Lightweight popup: one switch, no extra configuration pages.

## How it works
- Listens to `webNavigation.onBeforeNavigate`; if the global toggle is on, it runs `chrome.browsingData.remove({ origins: ["https://host", "http://host"] }, { cache: true })` to wipe that host's cache. The same host is cleared at most once every 3 seconds to limit overhead.
- When turning the toggle on, it first clears all cache once.
- Does not touch headers and stays compatible with other network-rule extensions.

## Structure
- `manifest.json` — MV3 config and permissions (`browsingData`, `webNavigation`, `storage`, `<all_urls>`).
- `background.js` — global state storage plus navigation hook and cache clearing logic.
- `popup.html/css/js` — popup UI with the single global switch.
- `assets/icon-*.png` — 16/32/48/128 icons.

## Install for development
1. Open Chrome `chrome://extensions/`.
2. Enable “Developer mode”.
3. Click “Load unpacked” and select this folder.

## Usage
- Open the popup and toggle **Disable Disk Cache Globally** on. Turn it off to restore normal caching.

## Manual test checklist
- [ ] With the toggle on, visit several sites; Network panel should no longer show “from disk cache” (reload once more if timing races).
- [ ] After turning the toggle off, pages can hit disk cache again.
- [ ] State persists after browser restart.

## Chrome Web Store notes
- Permissions: `browsingData` (clear cache), `webNavigation` (navigation events), `storage`, `<all_urls>`.
- Privacy: all data stays local; we only store the boolean toggle.
- Before publishing, run through the test checklist on the latest stable Chrome; include a short GIF if desired.

## Known limitations
- `browsingData.remove` clears cache rather than preventing new writes, so cache may be repopulated between navigations; the extension clears again on the next navigation.
- Frequent clearing can add slight first-load latency; a 3-second cooldown is applied per host.

For more aggressive behavior, reduce the cooldown or invoke clearing on additional events (at the cost of more overhead).
