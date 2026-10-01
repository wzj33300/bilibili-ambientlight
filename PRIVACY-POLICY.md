# Privacy policy

This policy applies to Bilibili Ambient Light 0.2.3 built with `npm run build`.

## Video and page processing

Video frames are processed locally with Canvas or WebGL. Bar detection and energy saving inspect downscaled frame pixels on the device. Frames are neither saved nor uploaded.

The extension reads the current playback route to initialize lighting, handle episode changes, and reset cropping. It does not collect account details, cookies, watch history, or page body text. Content scripts run on `www.bilibili.com` and `player.bilibili.com`, with lighting activated on supported playback routes.

## Settings and backups

Settings, shortcuts, and language preference are saved in `chrome.storage.local`.

JSON import and export are initiated by the user and contain these preferences. The manual account-backup action writes the same data to `chrome.storage.sync`; cross-device synchronization follows the browser account’s configuration.

## Diagnostics and external links

The Bilibili runtime sends no telemetry or crash reports. Errors are recorded in the local browser console. Rendering and detection use local code and frame data.

Project, help, and donation links open when clicked. Those websites operate under their own privacy policies.

## Removal

Disable or remove the extension, then refresh open Bilibili tabs to remove active content scripts. Extension storage and synchronized backups are managed by the browser.

The original upstream policy is preserved in `PRIVACY-POLICY.upstream.md` as historical project documentation. This policy describes the Bilibili release.
