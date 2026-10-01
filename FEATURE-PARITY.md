# Feature inventory (0.2.3)

Pinned upstream: 2.38.17 / 18d17188e5562e5ee913f005192d30c9a60be078. All 75 functional settings below are retained, alongside group-collapse state and four customizable shortcuts. Generated from the upstream settings schema. See [TESTING.md](TESTING.md) for browser validation and remaining verification items.

| Group | Feature | Upstream key | Implementation |
|---|---|---|---|
| Settings | Advanced | `advancedSettings` | Upstream algorithm / settings state machine |
| Stats | Framerates | `showFPS` | Upstream algorithm / settings state machine |
| Stats | Frametimes graph | `showFrametimes` | Upstream algorithm / settings state machine |
| Stats | Resolutions & drawtimes | `showResolutions` | Upstream algorithm / settings state machine |
| Stats | Bar detection | `showBarDetectionStats` | Upstream algorithm / settings state machine |
| Quality | WebGL renderer (uses less power) | `webGL` | Upstream algorithm / settings state machine |
| Quality | Resolution | `resolution` | Upstream algorithm / settings state machine |
| Quality | Limit framerate (per second) | `framerateLimit` | Upstream algorithm / settings state machine |
| Quality | Synchronization | `frameSync` | Upstream algorithm / settings state machine |
| Quality | Save energy on static videos | `energySaver` | Bilibili adapter; same setting key |
| Quality | Prioritize page load speed | `prioritizePageLoadSpeed` | Bilibili adapter; same setting key |
| Quality | Bilibili responsiveness fixes | `layoutPerformanceImprovements` | Bilibili adapter; same setting key |
| Quality | Optimize debanding for | `debandingBlendMode` | Upstream algorithm / settings state machine |
| Page header | Shadows size | `headerShadowSize` | Bilibili adapter; same setting key |
| Page header | Shadows opacity | `headerShadowOpacity` | Bilibili adapter; same setting key |
| Page header | Images opacity | `headerImagesOpacity` | Bilibili adapter; same setting key |
| Page header | Background opacity | `headerFillOpacity` | Bilibili adapter; same setting key |
| Page content | Shadows size | `surroundingContentShadowSize` | Bilibili adapter; same setting key |
| Page content | Shadows opacity | `surroundingContentShadowOpacity` | Bilibili adapter; same setting key |
| Page content | Shadows on texts and buttons only | `surroundingContentTextAndBtnOnly` | Bilibili adapter; same setting key |
| Page content | Images opacity | `surroundingContentImagesOpacity` | Bilibili adapter; same setting key |
| Page content | Buttons & boxes background opacity | `surroundingContentFillOpacity` | Bilibili adapter; same setting key |
| Page content | Background greyness | `pageBackgroundGreyness` | Bilibili adapter; same setting key |
| Page content | Hide everything in theater mode | `immersiveTheaterView` | Bilibili adapter; same setting key |
| Page content | Related videos as scrollable list | `relatedScrollbar` | Bilibili adapter; same setting key |
| Page content | Hide scrollbar | `hideScrollbar` | Bilibili adapter; same setting key |
| Video | Size (in small view) | `videoScale.SMALL` | Bilibili adapter; same setting key |
| Video | Size (in theater view) | `videoScale.THEATER` | Bilibili adapter; same setting key |
| Video | Size (in fullscreen) | `videoScale.FULLSCREEN` | Bilibili adapter; same setting key |
| Video | Shadow size | `videoShadowSize` | Upstream algorithm / settings state machine |
| Video | Shadow opacity | `videoShadowOpacity` | Upstream algorithm / settings state machine |
| Video | Debanding (noise) | `videoDebandingStrength` | Upstream algorithm / settings state machine |
| Video | Sync video with ambient light | `videoOverlayEnabled` | Upstream algorithm / settings state machine |
| Video | Sync video disable threshold | `videoOverlaySyncThreshold` | Upstream algorithm / settings state machine |
| Video | Video jitter workaround | `chromiumBugVideoJitterWorkaround` | Upstream algorithm / settings state machine |
| Video | Video artifacts workaround | `chromiumDirectVideoOverlayWorkaround` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Remove black bars | `detectHorizontalBarSizeEnabled` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Remove black sidebars | `detectVerticalBarSizeEnabled` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Detection: Remove colored bars | `detectColoredHorizontalBarSizeEnabled` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Detection: Offset | `detectHorizontalBarSizeOffsetPercentage` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Detection: Frames average | `barSizeDetectionAverageHistorySize` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Detection: Certainty threshold | `barSizeDetectionAllowedElementsPercentage` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Detection: Uneven threshold | `barSizeDetectionAllowedUnevenBarsPercentage` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Bar size | `horizontalBarsClipPercentage` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Sidebars size | `verticalBarsClipPercentage` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Reset bars next video | `horizontalBarsClipPercentageReset` | Upstream algorithm / settings state machine |
| Remove black & colored bars | Fill video to removed bars | `detectVideoFillScaleEnabled` | Upstream algorithm / settings state machine |
| Filters | Brightness | `brightness` | Upstream algorithm / settings state machine |
| Filters | Contrast | `contrast` | Upstream algorithm / settings state machine |
| Filters | Colors | `vibrance` | Upstream algorithm / settings state machine |
| Filters | Saturation | `saturation` | Upstream algorithm / settings state machine |
| HDR Filters | Brightness | `hdrBrightness` | Upstream HDR path retained; real HDR samples not verified |
| HDR Filters | Contrast | `hdrContrast` | Upstream HDR path retained; real HDR samples not verified |
| HDR Filters | Saturation | `hdrSaturation` | Upstream HDR path retained; real HDR samples not verified |
| Directions | Top | `directionTopEnabled` | Upstream algorithm / settings state machine |
| Directions | Right | `directionRightEnabled` | Upstream algorithm / settings state machine |
| Directions | Bottom | `directionBottomEnabled` | Upstream algorithm / settings state machine |
| Directions | Left | `directionLeftEnabled` | Upstream algorithm / settings state machine |
| Ambient light | Blur | `blur2` | Upstream algorithm / settings state machine |
| Ambient light | Edge size | `edge` | Upstream algorithm / settings state machine |
| Ambient light | Spread | `spread` | Upstream algorithm / settings state machine |
| Ambient light | Spread fade start | `spreadFadeStart` | Upstream algorithm / settings state machine |
| Ambient light | Spread fade curve | `spreadFadeCurve` | Upstream algorithm / settings state machine |
| Ambient light | Debanding (noise) | `debandingStrength` | Upstream algorithm / settings state machine |
| Ambient light | Fade in duration | `frameFading` | Upstream algorithm / settings state machine |
| Ambient light | Flicker reduction | `flickerReduction` | Upstream algorithm / settings state machine |
| Ambient light | Smooth motion (frame blending) | `frameBlending` | Upstream algorithm / settings state machine |
| Ambient light | Smooth motion strength | `frameBlendingSmoothness` | Upstream algorithm / settings state machine |
| Ambient light | Fixed position | `fixedPosition` | Upstream algorithm / settings state machine |
| View modes | Enable in layouts | `enableInViews` | Bilibili adapter; same setting key |
| View modes | Picture in picture | `enableInPictureInPicture` | Bilibili adapter; same setting key |
| View modes | Embedded videos | `enableInEmbed` | Bilibili adapter; same setting key |
| View modes | VR/360 videos | `enableInVRVideos` | Visible canvas capture adapted; real VR samples not verified |
| General | Appearance (theme) | `theme` | Bilibili adapter; same setting key |
| General | Enabled | `enabled` | Upstream algorithm / settings state machine |

## Beyond individual settings

- Player menu and standalone settings page; reset; JSON text/file backup and restore; shortcut backup; manual browser sync backup.
- Chinese, English, and automatic browser-language selection. The preference applies live across extension surfaces and is included in backups.
- Background playback, pause, seek, window resizing, episode changes, video-element replacement, SPA navigation, and fullscreen entry/exit handling.
- Local error messages and console diagnostics.

## Platform differences

- Static-video energy saving compares downscaled frames locally.
- YouTube private auto-quality APIs, advertisement/subtitle keyword exceptions for wide-mode scaling, and disabling YouTube's native ambient light have no directly portable Bilibili equivalents and are not called.
- Layout optimizations, themes, and opacity target known Bilibili DOM components.
- Project and donation links identify the upstream author. Report Bilibili integration issues in this repository.
- The release targets desktop Chromium. Firefox packaging, Bilibili live streams, mobile pages, and non-HTML5 players are not adapted.
