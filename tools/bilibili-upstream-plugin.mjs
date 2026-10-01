import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';

// Replace platform-bound methods at build time; the rendering algorithms and
// complete settings state machine remain the pinned upstream implementation.
export async function bilibiliUpstreamPlugin() {
  const overrideSource = await readFile('src/bilibili/full/platform-methods.js', 'utf8');
  const overrides = parse(overrideSource, { sourceType: 'module' }).program.body
    .find((node) => node.type === 'ExportDefaultDeclaration').declaration.body.body;
  const replacements = new Map(overrides.map((node) => [node.key.name, overrideSource.slice(node.start, node.end)]));
  return {
    name: 'bilibili-upstream-platform',
    resolveId(source, importer) {
      if (!importer?.replaceAll('\\', '/').includes('/src/scripts/libs/')) return;
      if (source.endsWith('/errors/sentry-reporter') || source === './errors/sentry-reporter') return path.resolve('src/bilibili/full/local-errors.js');
      if (source === './theming') return path.resolve('src/bilibili/full/theming.js');
      if (source === './messaging/injected') return path.resolve('src/bilibili/full/platform-messages.js');
    },
    transform(code, id) {
      const file = id.replaceAll('\\', '/');
      if (!file.includes('/src/scripts/libs/')) return;
      code = code.replaceAll('\r\n', '\n');
      code = code.replaceAll('globalThis.BARDETECTION_EDGE_RANGE', '32');
      if (file.endsWith('/ambientlight.js')) {
        const ast = parse(code, { sourceType: 'module' });
        const members = ast.program.body.find((node) => node.type === 'ExportDefaultDeclaration').declaration.body.body;
        const found = new Set();
        for (const node of [...members].reverse()) {
          if (!replacements.has(node.key?.name)) continue;
          found.add(node.key.name);
          code = code.slice(0, node.start) + replacements.get(node.key.name) + code.slice(node.end);
        }
        for (const key of replacements.keys()) if (!found.has(key)) throw new Error(`Upstream method changed: ${key}`);
        code = `import { biliRect, biliView, biliVRSource, biliIsMiniPlayer, applyBiliPageStyles, updatePictureInPicture, updateMiniPlayer } from '../../bilibili/full/platform-runtime.js';\n${code}`;
        code = code.replace('this.videoIsPictureInPicture = true;\n        await this.optionalFrame();', 'await updatePictureInPicture(this, true);');
        code = code.replace('this.videoIsPictureInPicture = false;\n        await this.optionalFrame();', 'await updatePictureInPicture(this, false);');
        code = code.replace('const enabledInView =', 'if (biliIsMiniPlayer(this.videoPlayerElem)) return false;\n    if (this.videoIsPictureInPicture && !this.settings.enableInPictureInPicture) return false;\n    const enabledInView =');
        code = code.replace('const viewChanged = await this.updateView();', 'await updateMiniPlayer(this);\n          const viewChanged = await this.updateView();');
        code = code.replace('parseInt(this.videoElem.style.width) || 0', 'parseInt(this.videoElem.style.width) || this.videoElem.clientWidth');
        code = code.replace('videoParentElem.style.marginBottom = `${-this.videoElem.offsetHeight}px`;', "videoParentElem.style.marginBottom = ''; // BPX uses flex centering, not YouTube's collapsed container");
        code = code.replaceAll("classList.contains('playing-mode')", "classList.contains('bpx-state-playing')");
        code = code.replace('YouTube has applied DRM protection', 'the video provider has applied DRM protection');
        code = code.replaceAll("attributeFilter: ['class'],", "attributeFilter: ['class', 'data-screen'],");
        code = code.replace('this.updateFixedStyle();\n\n    // Page background', 'this.updateFixedStyle();\n    applyBiliPageStyles(this);\n\n    // Page background');
        code = code.replace('const videoPath = location.search;', "const videoPath = location.pathname + '?p=' + (new URLSearchParams(location.search).get('p') || '1');");
        code = code.replace("this.videoPlayerElem?.classList?.contains(\n      'ytp-webgl-spherical'\n    )", 'Boolean(biliVRSource(this.videoPlayerElem))');
        code = code.replace("this.videoPlayerElem.querySelector('.webgl canvas')", 'biliVRSource(this.videoPlayerElem)');
      }
      if (file.endsWith('/generic.js')) {
        code = code.replace("['/watch', '/live/']", "['/video/', '/bangumi/play/', '/cheese/play/', '/list/', '/medialist/play/']");
        code = code.replace("location.pathname?.startsWith('/embed/')", "location.hostname === 'player.bilibili.com'");
      }
      if (file.endsWith('/settings-config.js')) {
        code = `import { localizeSettings } from '../../bilibili/full/labels.js';\n${code}`;
        code = code.replace('export default SettingsConfig;', 'localizeSettings(SettingsConfig);\nexport default SettingsConfig;');
      }
      if (file.endsWith('/settings.js')) {
        for (const [original, translated] of Object.entries({ 'Decoded framerate': '解码帧率', 'Display framerate': '屏幕帧率', 'Video framerate': '视频帧率', 'Off': '关闭', 'Right click to reset': '右键恢复默认', 'Click here and press a key to change the hotkey (Or press the escape key to disable this hotkey)': '点击后按键修改快捷键；按 Esc 禁用' })) code = code.replaceAll(`'${original}'`, `'${translated}'`);
        code = code.replace("const is2020PlayerUI = !!document.querySelector(\n      '.ytp-settings-button svg[viewBox=\"0 0 36 36\"]'\n    );", 'const is2020PlayerUI = true;');
        code = code.replaceAll("'Ambient light settings'", "'Bilibili 环境光设置'");
        code = code.replace('const feedbackFormLink = getFeedbackFormLink();', "const feedbackFormLink = 'https://github.com/WesselKroos/youtube-ambilight';");
        code = code.replaceAll("'Give feedback or a rating'", "'上游项目与署名'");
        code = code.replaceAll("'Support me via a donation'", "'支持上游作者 Wessel Kroos'");
        code = code.replaceAll("'Troubleshoot performance problems'", "'上游性能排查文档'");
        code = code.replaceAll("'Reset all settings'", "'恢复全部默认设置'");
        code = code.replace('toolbar.appendChild(importBtn);', "importBtn.title = '导入 / 导出：点击浏览器扩展图标打开完整设置';\n    toolbar.appendChild(importBtn);");
      }
      return { code, map: null };
    },
  };
}
