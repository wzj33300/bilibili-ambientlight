import Config from '../../scripts/libs/settings-config.js';
import { migrateBasicSettings } from './migration.js';
import { UI_TABS, QUICK_FIELDS, SHORT_LABELS, sectionTab } from './ui-layout.js';
import { initializeLanguage, createLanguageSelect, localizeSurface, getLanguagePreference, setLanguagePreference } from './i18n.js';

const fields = Config.filter((item) => item.type !== 'section');
const status = document.querySelector('#status');
let values = {};
let keys = {};
let queue = Promise.resolve();
let activeTab = 'light';
const normalize = (item, value) => {
  if (value == null) return item.default;
  if (item.type === 'checkbox') return typeof value === 'boolean' ? value : item.default;
  if (typeof value !== 'number' || !Number.isFinite(value)) return item.default;
  if (item.valuePoints) return item.valuePoints.includes(value) ? value : item.default;
  return Math.min(item.max, Math.max(item.min, value));
};

function render() {
  const root = document.querySelector('#settings');
  root.replaceChildren();
  let section = root;
  for (const item of Config) {
    if (item.type === 'section') {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = item.label;
      details.open = true;
      details.dataset.name = item.name;
      details.dataset.tab = sectionTab(item.name);
      details.append(summary);
      root.append(details);
      section = details;
      continue;
    }
    const label = document.createElement('label');
    label.className = 'field';
    label.dataset.name = item.name;
    label.dataset.search = `${item.label} ${item.name}`.toLowerCase();
    const caption = document.createElement('span');
    caption.className = 'caption';
    caption.textContent = item.label;
    label.append(caption);
    const input = document.createElement(item.valuePoints || item.snapPoints && item.manualinput === false ? 'select' : 'input');
    input.name = item.name;
    input.setAttribute('aria-label', item.label);
    input.title = item.questionMark?.title || item.description || '';
    if (input.tagName === 'SELECT') {
      for (const point of item.valuePoints || item.snapPoints) {
        const option = document.createElement('option');
        option.value = typeof point === 'number' ? point : point.value;
        option.textContent = typeof point === 'number' ? `${point}%` : point.label || point.hiddenLabel || point.value;
        input.append(option);
      }
      input.value = values[item.name];
    } else if (item.type === 'checkbox') {
      input.type = 'checkbox'; input.checked = values[item.name];
    } else {
      input.type = 'range'; input.min = item.min; input.max = item.max; input.step = item.step;
      input.value = values[item.name];
      const output = document.createElement('input');
      output.type = 'number'; output.className = 'numeric';
      output.min = item.min; output.max = item.max; output.step = item.step || 1;
      output.value = values[item.name];
      output.setAttribute('aria-label', `${item.label}数值`);
      caption.append(output);
      const updateFill = () => input.style.setProperty('--fill', `${(Number(input.value) - item.min) / (item.max - item.min) * 100}%`);
      updateFill();
      input.addEventListener('input', () => { output.value = input.value; updateFill(); });
      output.addEventListener('change', () => {
        input.value = normalize(item, Number(output.value));
        output.value = input.value; updateFill(); input.dispatchEvent(new Event('change'));
      });
      output.addEventListener('input', () => {
        if (output.value === '' || !output.validity.valid) return;
        input.value = Number(output.value); updateFill(); input.dispatchEvent(new Event('change'));
      });
    }
    input.addEventListener('change', () => {
      const value = item.type === 'checkbox' ? input.checked : Number(input.value);
      values[item.name] = normalize(item, value);
      queue = queue.then(() => chrome.storage.local.set({ [`setting-${item.name}`]: values[item.name] }))
        .then(() => { status.textContent = '已保存。打开的视频页会自动更新；更换渲染器时请刷新视频页。'; })
        .catch(() => { status.textContent = '保存失败，请重新打开设置。'; });
    });
    if (item.type === 'checkbox' || input.tagName === 'SELECT') caption.append(input); else label.append(input);
    section.append(label);
    if (item.defaultKey !== undefined) {
      const shortcut = document.createElement('input');
      shortcut.type = 'text'; shortcut.maxLength = 1;
      shortcut.setAttribute('aria-label', `${item.label}快捷键`);
      shortcut.placeholder = '—';
      shortcut.title = '快捷键，留空禁用';
      shortcut.value = keys[item.name] ?? item.defaultKey;
      shortcut.addEventListener('change', async () => {
        keys[item.name] = shortcut.value.toUpperCase();
        await chrome.storage.local.set({ [`setting-${item.name}-key`]: keys[item.name] });
        status.textContent = '快捷键已保存，请刷新视频页。';
      });
      const shortcutRow = document.createElement('label');
      shortcutRow.className = 'shortcut';
      shortcutRow.dataset.search = label.dataset.search;
      shortcutRow.append('快捷键', shortcut);
      section.append(shortcutRow);
    }
  }
  const quick = document.createElement('details'); quick.open = true; quick.className = 'quick'; quick.dataset.tab = 'light';
  const quickTitle = document.createElement('summary'); quickTitle.textContent = '基础光效'; quick.append(quickTitle);
  const quickGrid = document.createElement('div'); quickGrid.className = 'quick-grid'; quick.append(quickGrid);
  for (const name of QUICK_FIELDS) {
    const field = root.querySelector(`[data-name="${name}"]`);
    field.querySelector('.caption').firstChild.textContent = SHORT_LABELS[name];
    quickGrid.append(field);
  }
  root.prepend(quick);
  const directions = root.querySelector('[data-name="sectionDirectionsCollapsed"]');
  const directionGrid = document.createElement('div'); directionGrid.className = 'direction-grid';
  directionGrid.append(...directions.querySelectorAll('.field')); directions.append(directionGrid);
  const master = root.querySelector('[data-name="enabled"]');
  document.querySelector('#master').replaceChildren(master);
  root.querySelector('[data-name="sectionAmbientlightCollapsed"] > summary').textContent = '光晕细节';
  root.querySelector('[data-name="sectionAmbientlightCollapsed"]').open = false;
  filterSettings();
}

function filterSettings() {
  const query = document.querySelector('#search').value.trim().toLowerCase();
  let matches = 0;
  for (const group of document.querySelectorAll('#settings > details')) {
    if (query && group.dataset.beforeSearch === undefined) group.dataset.beforeSearch = String(group.open);
    for (const row of group.querySelectorAll('[data-search]')) row.hidden = !!query && !row.dataset.search.includes(query);
    const count = group.querySelectorAll('.field:not([hidden])').length;
    matches += count;
    group.hidden = !count || !query && group.dataset.tab !== activeTab;
    if (query && count) group.open = true;
    if (!query && group.dataset.beforeSearch !== undefined) { group.open = group.dataset.beforeSearch === 'true'; delete group.dataset.beforeSearch; }
  }
  document.querySelector('#empty').hidden = !!matches;
  document.querySelector('.utility').hidden = !!query || activeTab !== 'system';
  document.querySelector('#page-title').textContent = query ? '搜索结果' : UI_TABS.find((tab) => tab.id === activeTab).label + '设置';
  document.querySelector('#page-description').textContent = query ? `找到 ${matches} 个设置` : UI_TABS.find((tab) => tab.id === activeTab).subtitle;
}
for (const tab of UI_TABS) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = tab.label;
  button.dataset.tab = tab.id; button.setAttribute('aria-pressed', String(tab.id === activeTab));
  button.addEventListener('click', () => {
    activeTab = tab.id; document.querySelector('#search').value = '';
    for (const sibling of button.parentElement.children) sibling.setAttribute('aria-pressed', String(sibling === button));
    filterSettings();
  });
  document.querySelector('#navigation').append(button);
}
document.querySelector('#search').addEventListener('input', filterSettings);
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !event.target.matches('input,textarea,select')) { event.preventDefault(); document.querySelector('#search').focus(); }
});

async function readSettings() {
  await migrateBasicSettings();
  const stored = await chrome.storage.local.get(null);
  for (const item of fields) values[item.name] = normalize(item, stored[`setting-${item.name}`]);
  for (const item of fields.filter((item) => item.defaultKey !== undefined)) keys[item.name] = stored[`setting-${item.name}-key`] ?? item.defaultKey;
}
document.querySelector('.app-header').insertBefore(createLanguageSelect(), document.querySelector('#master'));
initializeLanguage().then(readSettings).then(() => {
  render();
  localizeSurface(document.querySelector('.app-header'), { documentLanguage: true });
  localizeSurface(document.querySelector('.workspace'));
  localizeSurface(document.querySelector('title'));
  window.addEventListener('bili-language-changed', filterSettings);
});
const exportObject = () => ({ format: 'bilibili-ambientlight', version: 1, language: getLanguagePreference(), settings: values, shortcuts: keys });
document.querySelector('#export').onclick = async () => {
  await queue; await readSettings();
  document.querySelector('#transfer').open = true;
  document.querySelector('#json').value = JSON.stringify(exportObject(), null, 2);
  status.textContent = '已生成设置 JSON，可复制保存到文件。';
};
document.querySelector('#import').onclick = () => {
  document.querySelector('#transfer').open = true;
  document.querySelector('#json').focus();
  status.textContent = '粘贴此扩展的导出 JSON 后，点击“应用 JSON”。';
};
async function saveAll(next, shortcuts = {}) {
  await queue;
  const stored = {};
  for (const item of fields) { values[item.name] = normalize(item, next[item.name]); stored[`setting-${item.name}`] = values[item.name]; }
  for (const item of fields.filter((item) => item.defaultKey !== undefined)) {
    const key = shortcuts[item.name];
    keys[item.name] = typeof key === 'string' && key.length <= 1 ? key.toUpperCase() : item.defaultKey;
    stored[`setting-${item.name}-key`] = keys[item.name];
  }
  await chrome.storage.local.set(stored);
  render();
  status.textContent = '全部设置已保存。请刷新视频页使渲染器选项生效。';
}
document.querySelector('#apply').onclick = async () => {
  try {
    const json = JSON.parse(document.querySelector('#json').value);
    const settings = json.settings || json;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('settings 必须为对象');
    if (!fields.some((item) => Object.hasOwn(settings, item.name))) throw new Error('未找到可识别的设置');
    if ('blur' in settings && !('blur2' in settings)) settings.blur2 = settings.blur;
    await saveAll(settings, json.shortcuts);
    if (['auto', 'en', 'zh-CN'].includes(json.language)) await setLanguagePreference(json.language);
  } catch (error) { status.textContent = `导入失败：${error.message}`; }
};
document.querySelector('#reset').onclick = () => saveAll({}).catch((error) => { status.textContent = error.message; });
document.querySelector('#download').onclick = async () => {
  await queue; await readSettings();
  const url = URL.createObjectURL(new Blob([JSON.stringify(exportObject(), null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'bilibili-ambientlight-settings.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
document.querySelector('#file').onchange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  document.querySelector('#transfer').open = true;
  document.querySelector('#json').value = await file.text();
  status.textContent = '文件已读取，点击“应用 JSON”完成导入。';
};
document.querySelector('#sync-save').onclick = async () => {
  try {
    await queue; await readSettings();
    await chrome.storage.sync.set({ 'bili-settings-backup': exportObject() });
    status.textContent = '已备份到浏览器同步存储（同步状态取决于 Chrome 账号设置）。';
  } catch (error) { status.textContent = `同步备份失败：${error.message}`; }
};
document.querySelector('#sync-load').onclick = async () => {
  try {
    const data = (await chrome.storage.sync.get('bili-settings-backup'))['bili-settings-backup'];
    if (!data?.settings) throw new Error('未找到此扩展的同步备份');
    await saveAll(data.settings, data.shortcuts);
    if (['auto', 'en', 'zh-CN'].includes(data.language)) await setLanguagePreference(data.language);
  } catch (error) { status.textContent = `同步恢复失败：${error.message}`; }
};
