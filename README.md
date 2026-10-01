# Bilibili Ambient Light

Ambient lighting for Bilibili in desktop **Chrome and Edge 121+**. The extension extends video colors around the player and provides controls for lighting, cropping, page appearance, and performance.

Version **0.2.3** includes Chinese and English interfaces and 75 functional settings. It uses the rendering engine from [WesselKroos/youtube-ambilight](https://github.com/WesselKroos/youtube-ambilight) 2.38.17 with a Bilibili player and page adapter.

## Install

1. Download **bilibili-ambientlight-0.2.3.zip** from the [latest release](https://github.com/wzj33300/bilibili-ambientlight/releases/latest) and extract it.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge, then enable **Developer mode**.
3. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
4. Open or refresh a Bilibili video page.

The release ZIP contains the ready-to-load extension. GitHub's **Source code** archives are for development. To update an existing installation, replace its files, click **Reload** on the extension card, and refresh video tabs.

## Use

Open the player’s ambient-light icon for quick adjustments, or the browser extension icon for the complete settings page.

The four settings categories are **Light**, **Video**, **Page**, and **More**. Brightness, spread, softness, and saturation are available immediately. The full settings page also supports search across categories and direct numeric input.

### Language

Choose **Auto / 自动**, **简体中文**, or **English** from the language selector in either settings header. Auto uses Simplified Chinese for Chinese browser locales and English for other locales. Changes apply immediately across open extension interfaces while preserving video settings.

The language preference is saved locally and included in JSON and manual browser-sync backups. The extension name displayed by Chrome or Edge follows the browser language.

### Shortcuts and backups

| Default key | Action |
|---|---|
| `G` | Toggle ambient lighting |
| `B` | Toggle horizontal-bar detection |
| `V` | Toggle vertical-bar detection |
| `H` | Fill the video after cropping |

Edit shortcuts by clicking their letters in the player menu or using the full settings page. The **More** category contains JSON import/export, file backups, browser-account backup/restore, and reset controls. Browser-account synchronization depends on the browser’s sync settings.

Common settings from version 0.1 migrate on first use. Spread values are converted approximately to the current rendering model.

## Features

- **Lighting:** WebGL and Canvas2D, blur, spread, fade curves, four lighting directions, brightness, contrast, saturation, vibrance, and HDR processing.
- **Motion and image quality:** frame blending, color fading, flicker reduction, ambient-light and video debanding, LCD/OLED blend modes, and a synchronized video overlay.
- **Cropping:** automatic horizontal, vertical, and colored-bar detection, detection tolerance and history averaging, manual crop controls, automatic fill, and reset on video changes.
- **Page integration:** normal, wide, and fullscreen layouts; per-view video scaling; video shadows; immersive wide mode; page themes; header/content opacity and shadows; and recommendation-list scrolling.
- **Performance:** resolution and frame-rate limits, frame synchronization, background scheduling, local static-frame energy saving, and rendering/detection statistics.
- **Playback lifecycle:** episode changes, SPA navigation, video-element replacement, and settings updates across tabs.

At the top of the page, the header is transparent; after scrolling, it uses the configured background opacity. Page lighting hides during picture-in-picture by default and returns on exit. A setting can keep page lighting enabled during PiP.

The scroll-triggered floating mini-player always hides ambient lighting, including while paused. Returning to the regular player restores lighting when the extension is enabled.

See the [feature inventory](FEATURE-PARITY.md) for all 75 settings and platform integration details.

## Compatibility and verification

The extension supports browser-readable HTML5 video on desktop Bilibili. Real-page checks cover regular video playback, episode switching, wide mode, web fullscreen, header styling, picture-in-picture, and language selection. The adapters also cover bangumi, course, list, and embedded-player routes.

HDR, VR, native fullscreen, and individual bangumi/course/embed scenarios require further real-page validation. DRM-protected or unreadable cross-origin video, `bwp-video`-only playback, closed shadow roots, live streams, and the mobile site are unsupported. Site changes and other player extensions may affect compatibility.

Validation includes **16 Node tests** and **21 Chrome WebGL checks**. See [TESTING.md](TESTING.md) for test methods, version coverage, and open verification items.

## Development

Use Node.js 22.5.1 or later:

```sh
npm ci --ignore-scripts
npm run build
npm run lint
npm test
```

Load the generated `dist` folder as an unpacked extension. To run the local browser fixture:

```sh
npm run build:full
npm run demo:full
```

Open `http://127.0.0.1:4319` and run the browser self-test. The fixture uses synthetic local video streams and isolated session storage. The test build is written to `dist-full`.

The platform adapter lives in `src/bilibili/full`; the upstream rendering core is in `src/scripts/libs`. An AST-based build plugin replaces platform-specific methods and validates the expected upstream structure. Regression tests compare key rendering methods with the pinned source. `build:basic` and `build:youtube` are separate legacy build targets; use `build` for this release.

Regenerate the setting inventory with `node tools/feature-report.mjs`.

## Privacy and license

Video processing stays on the device. The extension requests the `storage` permission and runs content scripts on `www.bilibili.com` and `player.bilibili.com`. Read the [privacy policy](PRIVACY-POLICY.md) for storage and backup behavior.

Released under the [MIT license](LICENSE), with upstream copyright and attribution preserved in [NOTICE.md](NOTICE.md). This is an independent project, unaffiliated with Bilibili or Wessel Kroos. Report issues in [this repository](https://github.com/wzj33300/bilibili-ambientlight/issues).
