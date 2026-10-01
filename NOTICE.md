# Attribution

Bilibili Ambient Light 0.2.3 is an independent adaptation of [WesselKroos/youtube-ambilight](https://github.com/WesselKroos/youtube-ambilight).

- **Upstream:** version 2.38.17, revision `18d17188e5562e5ee913f005192d30c9a60be078`.
- **Copyright:** Copyright (c) 2017 Wessel Kroos. The original MIT [LICENSE](LICENSE) is included.
- **Reused components:** Ambientlight rendering engine, WebGL and Canvas2D projectors, shadow masks, bar detection and worker, frame blending/fading, flicker reduction, HDR processing, statistics, settings schema and handlers, styles, and images.
- **Bilibili integration:** player discovery, geometry, lifecycle, fullscreen handling, DOM messaging, local frame-based energy detection, page styling, Chinese/English interface, backup/sync tools, build transforms, and regression fixtures.

Platform-specific methods are replaced at build time. Core rendering algorithms remain in the upstream source files. The [feature inventory](FEATURE-PARITY.md) describes the integration for each setting.

This project is unaffiliated with Bilibili or Wessel Kroos. Donation links support Wessel Kroos, the upstream author. Original project documentation is preserved in `README.upstream.md` and `PRIVACY-POLICY.upstream.md`.
