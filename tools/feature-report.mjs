import { readFile, writeFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
const source = await readFile('src/scripts/libs/settings-config.js', 'utf8');
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const config = parse(source, { sourceType: 'module' }).program.body
  .find((node) => node.type === 'VariableDeclaration' && node.declarations[0].id.name === 'SettingsConfig').declarations[0].init.elements;
const get = (node, key) => node.properties.find((p) => p.key.name === key)?.value.value;
const adapted = /^(header|surroundingContent|pageBackground|theme|immersive|relatedScrollbar|hideScrollbar|layoutPerformance|energySaver|prioritizePage|videoScale|enableInViews|enableInEmbed|enableInPictureInPicture)/;
const rows = [];
let group = '';
for (const entry of config) {
  const name = get(entry, 'name');
  const label = (get(entry, 'label') || name).replaceAll('YouTube', 'Bilibili').replaceAll('Theater', 'Wide');
  if (get(entry, 'type') === 'section') { group = label; continue; }
  const status = name.startsWith('hdr') ? 'Upstream HDR path retained; real HDR samples not verified' : name === 'enableInVRVideos' ? 'Visible canvas capture adapted; real VR samples not verified' : adapted.test(name) ? 'Bilibili adapter; same setting key' : 'Upstream algorithm / settings state machine';
  rows.push(`| ${group} | ${label} | \`${name}\` | ${status} |`);
}
await writeFile('FEATURE-PARITY.md', `# Feature inventory (${version})

Pinned upstream: 2.38.17 / 18d17188e5562e5ee913f005192d30c9a60be078. All ${rows.length} functional settings below are retained, alongside group-collapse state and four customizable shortcuts. Generated from the upstream settings schema. See [TESTING.md](TESTING.md) for browser validation and remaining verification items.

| Group | Feature | Upstream key | Implementation |
|---|---|---|---|
${rows.join('\n')}

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
`);
console.log(`${rows.length} upstream feature settings documented`);
