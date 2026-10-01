# Verification record

**Release:** 0.2.3

**Date:** 2026-10-01

**Browser coverage:** Chromium, using the unpacked extension and local browser fixtures.

## Scroll mini-player update

The working build recognizes BPX's `data-screen="mini"` state and hides lighting immediately. The Node suite passes 16 tests, and the WebGL fixture passes 21 checks. The five added browser checks cover mini-player entry during playback with PiP lighting enabled, restoration after exit, paused entry and exit, and keeping lighting off when the extension is disabled.

The updated unpacked extension also passed real Bilibili checks: scrolling into the mini-player hid lighting during both playback and pause, and returning to the regular player restored lighting in both states. No extension error appeared.

## Release checks

| Check | Result | Coverage |
|---|---|---|
| Production and local-fixture builds | Passed | Installable extension and browser test bundle |
| ESLint | Passed | Bilibili adapter |
| Node regression suite | 15 passed | Lifecycle, settings, permissions, core preservation, geometry, migration, PiP, and language switching |
| Chrome WebGL fixture | 16 passed | Rendering, controls, cropping, video replacement, energy sampling, and fullscreen geometry |
| Chinese/English interface | Passed | Player menu, local settings page, search, persistence, and narrow layout |
| Installed extension on Bilibili | Passed | Version marker, live language switching, reload persistence, and preservation of existing settings |

## Automated coverage

The Node suite covers frame limits and playback lifecycle, storage updates, input validation, route and permission scope, preservation of upstream rendering methods and settings, BPX/letterbox geometry, and migration that preserves existing values. PiP checks verify immediate hide/cancel behavior and restoration when enabled.

Language tests cover browser-locale fallback, explicit preferences, updates from storage, dynamic messages, and switching while preserving control identity, focus, values, and event handlers.

## Browser fixture

All 16 WebGL checks passed for 0.2.3:

1. Engine initialization.
2. Continuous frame-driven rendering.
3. Complete settings controls.
4. Performance statistics.
5. Manual cropping in the rendering pipeline.
6. Directional mask updates.
7. Video debanding.
8. Frame-blending buffers.
9. Detection of 12.5% horizontal bars.
10. Video-element replacement.
11. Wide-mode detection.
12. Local energy sampling.
13. External setting updates applied to rendering.
14. Fullscreen layer placement and vertical centering.
15. Restoration after fullscreen exit.
16. Rendering completed without captured exceptions.

Canvas2D passed 13 local checks during 0.2.0 validation: items 1–12 and the exception check. Items 13–15 were subsequently verified with WebGL.

Additional fixture checks covered header transparency, scrolled background fill, text/SVG styling, and synthetic PiP entry/exit events while paused. JSON import/export preserved a brightness value and a customized shortcut. These checks use isolated local storage.

## Interface checks

The 0.2.3 player menu and standalone settings page switched between Chinese and English. English search located the PiP setting, and Chinese labels returned after switching back. Language and a directly entered brightness value persisted after reloading the local settings page.

A 460 px iframe reproduced the popup viewport in Chrome. In English, the document client width and body scroll width both measured 445 px. Wide-page and narrow-popup layouts were visually inspected.

The 0.2.2 checks also verified all 75 controls, category navigation, cross-category search, direct numeric input, the quick brightness control’s rendered output, and the master switch’s enabled state.

## Real Bilibili checks

Tests used the installed unpacked extension on regular Bilibili video pages.

| Version | Observed behavior |
|---|---|
| 0.2.0 | WebGL playback/pause, automatic episode rebinding with one engine and menu button, wide mode, and web fullscreen at 80% video scale. Lighting moved into the player for fullscreen and returned to the page afterward. |
| 0.2.1 | Transparent header at the top and configured fill after scrolling. Bilibili’s PiP video window hid page lighting on entry and restored it on exit. |
| 0.2.2 | Four-category menu, access to header and crop controls, and preservation of existing rendering settings. |
| 0.2.3 | Version marker confirmed; English applied immediately, persisted after a page reload, and returned to Chinese with Auto selected. Rendering settings retained their values. |

Bilibili’s tested PiP flow moved the video out of the main document. Synthetic native video-PiP events were checked separately in the local fixture.

## Further verification

- **Native fullscreen:** Chrome rejected automated `requestFullscreen` with `TypeError: not granted`. Direct manual activation remains to be tested. Web fullscreen and local fullscreen geometry passed.
- **HDR and VR:** processing paths are implemented; real Bilibili samples remain to be tested.
- **Additional routes:** individual bangumi, course, and embedded-player pages remain to be tested.
- **Account synchronization:** backup/restore uses `chrome.storage.sync`; end-to-end account synchronization remains to be tested.
- **Settings-page environment:** standalone UI checks used the local build. Installed content-script checks used real Bilibili pages.

Supported media and platform boundaries are listed in the [README](README.md#compatibility-and-verification).
