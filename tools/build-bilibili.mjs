import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';

await mkdir('dist/images', { recursive: true });
for (const entry of ['content', 'popup']) {
  const bundle = await rollup({ input: `src/bilibili/${entry}.js`, plugins: [resolve()] });
  await bundle.write({ file: `dist/${entry}.js`, format: 'iife', sourcemap: true,
    banner: '/*! Bilibili Ambient Light — derived from WesselKroos/youtube-ambilight (MIT). See LICENSE. */' });
  await bundle.close();
}
for (const file of ['manifest.json', 'popup.html', 'popup.css', 'theme.css']) {
  await copyFile(`src/bilibili/${file}`, `dist/${file}`);
}
for (const size of [16, 32, 128]) await copyFile(`src/images/icon-${size}.png`, `dist/images/icon-${size}.png`);
await copyFile('LICENSE', 'dist/LICENSE');
await copyFile('NOTICE.md', 'dist/NOTICE.md');
await copyFile('PRIVACY-POLICY.md', 'dist/PRIVACY-POLICY.md');
await writeFile('dist/INSTALL.txt', 'Bilibili 环境光 0.1.0（Chrome / Edge 121+）\n\n在 chrome://extensions 或 edge://extensions 开启开发者模式，选择“加载已解压的扩展程序”，加载本目录。刷新 B 站视频页开始播放，点击右下角“环境光”设置。快捷键 Alt + Shift + A。\n\n本版为核心 Canvas2D 效果移植；全屏和画中画期间暂停，不含上游 WebGL 和自动黑边检测。真实 B 站媒体尚未完成端到端播放验证，本地浏览器视频流验证已通过。详见项目 README。\n');
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
await writeFile('dist/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built Bilibili Ambient Light ${manifest.version} → dist/`);
