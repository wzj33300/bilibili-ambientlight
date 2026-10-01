import { mkdir, copyFile, writeFile, readFile, unlink } from 'node:fs/promises';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import sass from 'sass';
import { bilibiliUpstreamPlugin } from './bilibili-upstream-plugin.mjs';

const output = process.argv[2] || 'dist-full';
if (!['dist', 'dist-full'].includes(output)) throw new Error('Unexpected build target');
await mkdir(`${output}/images`, { recursive: true });
for (const name of ['popup.html','popup.css','popup.js','popup.js.map','INSTALL.txt']) {
  await unlink(`${output}/${name}`).catch((error) => { if (error.code !== 'ENOENT') throw error; });
}
for (const entry of ['content', 'options']) {
  const bundle = await rollup({ input: `src/bilibili/full/${entry}.js`, context: 'window', plugins: [await bilibiliUpstreamPlugin(), resolve()] });
  await bundle.write({ file: `${output}/${entry}.js`, format: 'iife', sourcemap: true, banner: '/*! Adapted from Wessel Kroos / youtube-ambilight. MIT License. */' });
  await bundle.close();
}
const upstreamCSS = sass.compile('src/styles/content.scss', { style: 'expanded', logger: { warn() {}, debug() {} } }).css
  .replaceAll('.html5-video-player', '.bpx-player-container')
  .replaceAll('.html5-video-container', '.bpx-player-video-wrap')
  .replaceAll('.html5-main-video', '.bpx-player-video-wrap video');
await writeFile(`${output}/theme.css`, [await readFile('src/bilibili/theme.css', 'utf8'), upstreamCSS, await readFile('src/bilibili/full/styles.css', 'utf8')].join('\n'));
const manifest = JSON.parse(await readFile('src/bilibili/manifest.json', 'utf8'));
manifest.version = JSON.parse(await readFile('package.json', 'utf8')).version;
manifest.name = '__MSG_name__';
manifest.description = '__MSG_description__';
manifest.default_locale = 'en';
manifest.action.default_title = '__MSG_name__';
for (const [locale, name, description] of [
  ['en', 'Bilibili Ambient Light', 'Ambient lighting for Bilibili with WebGL, automatic bar cropping, HDR filters, frame blending, and advanced settings.'],
  ['zh_CN', 'Bilibili 环境光', '哔哩哔哩环境光：WebGL、自动黑边裁切、HDR 滤镜、帧融合、去色带和完整高级设置。'],
]) {
  await mkdir(`${output}/_locales/${locale}`, { recursive: true });
  await writeFile(`${output}/_locales/${locale}/messages.json`, JSON.stringify({ name: { message: name }, description: { message: description } }, null, 2));
}
manifest.action.default_popup = 'options.html';
manifest.options_ui = { page: 'options.html', open_in_tab: true };
manifest.web_accessible_resources = [{ resources: ['images/noise-1.png', 'images/noise-2.png', 'images/noise-3.png', 'images/donate.svg'], matches: ['https://www.bilibili.com/*','https://player.bilibili.com/*'] }];
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2));
await copyFile('src/bilibili/full/options.html', `${output}/options.html`);
await copyFile('src/bilibili/full/options.css', `${output}/options.css`);
for (const name of ['icon-16.png','icon-32.png','icon-128.png','noise-1.png','noise-2.png','noise-3.png','donate.svg']) await copyFile(`src/images/${name}`, `${output}/images/${name}`);
for (const name of ['LICENSE','NOTICE.md','PRIVACY-POLICY.md','README.md','FEATURE-PARITY.md','TESTING.md']) await copyFile(name, `${output}/${name}`);
console.log(`Full upstream engine → ${output}/`);
