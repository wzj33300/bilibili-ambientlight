// Language is an interface preference, separate from rendering settings.
export const LANGUAGE_KEY = 'bili-ui-language';
const messages = new Map(Object.entries({
  '环境光': 'Ambient Light', 'Bilibili 环境光 · 设置': 'Bilibili Ambient Light · Settings',
  'Bilibili 环境光设置': 'Bilibili Ambient Light settings', '启用环境光': 'Enable ambient light',
  '关闭环境光设置': 'Close ambient light settings', '环境光设置分类': 'Ambient light categories', '设置分类': 'Settings categories',
  '光效': 'Light', '画面': 'Video', '页面': 'Page', '更多': 'More',
  '光效设置': 'Light settings', '画面设置': 'Video settings', '页面设置': 'Page settings', '更多设置': 'More settings',
  '调整光晕的强度、范围与柔和程度': 'Adjust the strength, reach, and softness of the glow',
  '颜色、缩放与黑边裁切': 'Color, scaling, and bar cropping', '让播放器与周围内容自然融合': 'Blend the player into the surrounding page',
  '性能、播放场景与快捷键': 'Performance, playback modes, and shortcuts',
  '亮度': 'Brightness', '扩散': 'Spread', '柔和度': 'Softness', '饱和度': 'Saturation',
  'HDR 亮度': 'HDR brightness', 'HDR 对比度': 'HDR contrast', 'HDR 饱和度': 'HDR saturation',
  '画中画时保留页面环境光': 'Keep page lighting during picture-in-picture',
  '基础光效': 'Quick adjustments', '光晕细节': 'Glow details', '备份与帮助': 'Backup and help',
  '即时生效': 'Live updates', '右键滑块恢复默认': 'Right-click a slider to reset',
  '搜索设置': 'Search settings', '搜索结果': 'Search results', '没有匹配的设置': 'No matching settings',
  '画面仅在本机处理': 'Frames stay on this device', '备份与恢复': 'Backup and restore',
  '保存你的参数，或从另一台设备恢复。': 'Save your settings or restore them from another device.',
  '下载设置': 'Download settings', '读取文件': 'Open file', '恢复默认': 'Reset defaults',
  '复制或粘贴 JSON': 'Copy or paste JSON', '生成 JSON': 'Generate JSON', '粘贴 JSON': 'Paste JSON', '设置 JSON': 'Settings JSON', '应用 JSON': 'Apply JSON',
  '浏览器账号同步': 'Browser account sync', '手动备份设置和快捷键。跨设备同步取决于 Chrome 账号的同步设置。': 'Back up settings and shortcuts manually. Cross-device sync depends on your browser account settings.',
  '备份到账号': 'Back up to account', '从账号恢复': 'Restore from account',
  '自动保存 · 更换渲染器后请刷新视频页': 'Saved automatically · Reload video tabs after changing the renderer', '开源项目 ↗': 'Source code ↗',
  '已保存。打开的视频页会自动更新；更换渲染器时请刷新视频页。': 'Saved. Open video tabs update automatically; reload after changing the renderer.',
  '保存失败，请重新打开设置。': 'Could not save. Reopen settings and try again.',
  '快捷键': 'Shortcut', '快捷键，留空禁用': 'Shortcut; leave blank to disable', '快捷键已保存，请刷新视频页。': 'Shortcut saved. Reload video tabs.',
  '已生成设置 JSON，可复制保存到文件。': 'Settings JSON is ready to copy or save.',
  '粘贴此扩展的导出 JSON 后，点击“应用 JSON”。': 'Paste an exported settings backup, then click Apply JSON.',
  '全部设置已保存。请刷新视频页使渲染器选项生效。': 'All settings saved. Reload video tabs to apply renderer options.',
  'settings 必须为对象': 'Settings must be an object', '未找到可识别的设置': 'No recognized settings found',
  '文件已读取，点击“应用 JSON”完成导入。': 'File loaded. Click Apply JSON to import it.',
  '已备份到浏览器同步存储（同步状态取决于 Chrome 账号设置）。': 'Backed up to browser sync storage. Sync depends on your account settings.',
  '未找到此扩展的同步备份': 'No sync backup found for this extension',
  '解码帧率': 'Decoded framerate', '屏幕帧率': 'Display framerate', '视频帧率': 'Video framerate', '关闭': 'Off',
  '右键恢复默认': 'Right click to reset', '点击后按键修改快捷键；按 Esc 禁用': 'Click and press a key to change the shortcut; press Esc to disable',
  '上游项目与署名': 'Upstream project and attribution', '支持上游作者 Wessel Kroos': 'Support upstream author Wessel Kroos',
  '上游性能排查文档': 'Upstream performance troubleshooting', '恢复全部默认设置': 'Reset all settings',
  '导入 / 导出：点击浏览器扩展图标打开完整设置': 'Import / export: open the full settings from the browser extension icon',
  '优化推荐列表与评论的布局和绘制': 'Optimize layout and painting of recommendations and comments',
  '对屏幕外的推荐视频和评论启用浏览器按需布局。': 'Use on-demand browser layout for off-screen recommendations and comments.',
  '在本机比较当前视频的小尺寸采样帧，静态画面降低环境光帧率。不会下载或上传视频。': 'Compare downscaled frames locally and lower the lighting frame rate for static scenes. No video is downloaded or uploaded.',
  '页面顶部透明；向下滚动后使用此不透明度': 'Transparent at the top; use this opacity after scrolling',
  '顶部让环境光透过导航栏。滚动后：-100 为全透明，0 为半透明，100 为不透明。': 'Let the glow show through the header at the top. After scrolling: -100 is transparent, 0 translucent, and 100 opaque.',
}));

export function registerTranslation(chinese, english) {
  if (chinese && english && !messages.has(chinese)) messages.set(chinese, english);
}
export function resolveLanguage(preference, browserLanguage = globalThis.navigator?.language || 'en') {
  return preference === 'en' || preference === 'zh-CN' ? preference : /^zh\b/i.test(browserLanguage) ? 'zh-CN' : 'en';
}
let preference = 'auto';
let language = resolveLanguage(preference);
const surfaces = new Set();
const controls = new Set();
export const getLanguagePreference = () => preference;
export function translate(text, locale = language) {
  if (locale !== 'en' || !text) return text;
  const trimmed = text.trim();
  let result = messages.get(trimmed);
  if (!result) {
    const count = trimmed.match(/^找到 (\d+) 个设置$/);
    const suffix = trimmed.match(/^(.*)(数值|快捷键)$/);
    const prefix = trimmed.match(/^(导入失败：|同步备份失败：|同步恢复失败：|环境光：)(.*)$/s);
    if (count) result = `${count[1]} ${count[1] === '1' ? 'setting' : 'settings'} found`;
    else if (suffix) result = `${translate(suffix[1], locale)} ${suffix[2] === '数值' ? 'value' : 'shortcut'}`;
    else if (prefix) result = `${{ '导入失败：': 'Import failed: ', '同步备份失败：': 'Sync backup failed: ', '同步恢复失败：': 'Sync restore failed: ', '环境光：': 'Ambient Light: ' }[prefix[1]]}${translate(prefix[2], locale)}`;
  }
  return result ? text.replace(trimmed, result) : text;
}

// Retain source text on each node so live language changes never rebuild controls,
// lose focus, or detach upstream event handlers. Never inspect the host page.
export function localizeSurface(root, { documentLanguage = false } = {}) {
  const originals = new WeakMap();
  const rewrite = (node, key, read, write) => {
    let entries = originals.get(node);
    if (!entries) originals.set(node, entries = new Map());
    const current = read();
    const previous = entries.get(key);
    const source = previous?.output === current ? previous.source : current;
    const output = translate(source);
    entries.set(key, { source, output });
    if (output !== current) write(output);
  };
  const visit = (node) => {
    if (node.nodeType === 3) {
      if (!node.parentElement?.closest('script,style,textarea,[data-no-translate]')) rewrite(node, 'text', () => node.textContent, (text) => { node.textContent = text; });
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.matches('script,style,textarea,[data-no-translate]')) return;
    for (const attr of ['title', 'aria-label', 'placeholder']) if (node.hasAttribute(attr)) rewrite(node, attr, () => node.getAttribute(attr), (text) => node.setAttribute(attr, text));
    for (const child of node.childNodes) visit(child);
    if (node.dataset.search) node.dataset.search = `${node.dataset.name || ''} ${node.textContent} ${node.querySelector('input,select')?.getAttribute('aria-label') || ''}`.toLowerCase();
  };
  const refresh = () => {
    visit(root);
    root.lang = language;
    if (documentLanguage) document.documentElement.lang = language;
  };
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes' || record.type === 'characterData') visit(record.target);
      else for (const node of record.addedNodes) visit(node);
    }
  });
  refresh(); surfaces.add(refresh);
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder'] });
  return () => { observer.disconnect(); surfaces.delete(refresh); };
}

function applyLanguage(value) {
  preference = ['en', 'zh-CN'].includes(value) ? value : 'auto';
  language = resolveLanguage(preference);
  for (const select of controls) select.value = preference;
  for (const refresh of surfaces) refresh();
  window.dispatchEvent(new Event('bili-language-changed'));
}
export async function setLanguagePreference(value) {
  await chrome.storage.local.set({ [LANGUAGE_KEY]: ['en', 'zh-CN'].includes(value) ? value : 'auto' });
  applyLanguage(value);
}
export async function initializeLanguage() {
  applyLanguage((await chrome.storage.local.get(LANGUAGE_KEY))[LANGUAGE_KEY]);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[LANGUAGE_KEY]) applyLanguage(changes[LANGUAGE_KEY].newValue);
  });
  window.addEventListener('languagechange', () => applyLanguage(preference));
}
export function createLanguageSelect() {
  const select = document.createElement('select');
  select.className = 'bili-language'; select.setAttribute('aria-label', 'Language / 语言');
  select.dataset.noTranslate = '';
  for (const [value, label] of [['auto', 'Auto / 自动'], ['zh-CN', '简体中文'], ['en', 'English']]) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; select.append(option);
  }
  select.value = preference; controls.add(select);
  select.addEventListener('change', async () => {
    select.disabled = true;
    try { await setLanguagePreference(select.value); }
    catch (error) { select.value = preference; select.title = error.message; }
    finally { select.disabled = false; }
  });
  return select;
}
