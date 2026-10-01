import { ExtensionSettings, DEFAULTS, normalizeSettings } from './settings.js';
import { createPanel } from './panel.js';

const store = new ExtensionSettings();
let settings = { ...DEFAULTS };
let queue = Promise.resolve();
let revision = 0;
const panel = createPanel(document.body, (patch) => {
  revision++;
  settings = normalizeSettings({ ...settings, ...patch });
  panel.update(settings);
  const snapshot = { ...settings };
  queue = queue.then(() => store.write(snapshot)).then(() => {
    panel.status('设置已保存，打开的 B 站视频页会自动更新。');
  }).catch(() => panel.status('保存失败，请重新打开扩展设置。'));
}, { floating: false });
panel.update(settings);
store.read().then((saved) => {
  if (!revision) { settings = saved; panel.update(settings); }
  panel.status('打开 B 站视频，环境光会自动开启。');
}).catch(() => panel.status('无法读取设置，请重新打开扩展设置。'));
