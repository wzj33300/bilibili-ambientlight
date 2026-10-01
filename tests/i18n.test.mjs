import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { resolveLanguage, translate, registerTranslation, initializeLanguage, localizeSurface, setLanguagePreference, createLanguageSelect, LANGUAGE_KEY } from '../src/bilibili/full/i18n.js';

test('language detection supports Chinese variants, English fallback, and explicit overrides', () => {
  assert.equal(resolveLanguage('auto', 'zh-TW'), 'zh-CN');
  assert.equal(resolveLanguage('auto', 'en-US'), 'en');
  assert.equal(resolveLanguage('auto', 'fr-FR'), 'en');
  assert.equal(resolveLanguage('en', 'zh-CN'), 'en');
  assert.equal(resolveLanguage('zh-CN', 'en-US'), 'zh-CN');
  assert.equal(resolveLanguage('invalid', 'zh-CN'), 'zh-CN');
  assert.equal(translate('找到 12 个设置', 'en'), '12 settings found');
  assert.equal(translate('导入失败：未找到可识别的设置', 'en'), 'Import failed: No recognized settings found');
});

test('live language switches preserve control identity, edits, handlers and remote updates', async () => {
  const dom = new JSDOM('<html><body><main><h1>环境光</h1><label data-name="brightness" data-search="亮度"><span>亮度</span><input aria-label="亮度数值" value="137"></label><p id="status"></p><textarea>用户备份</textarea></main><aside>关闭</aside></body></html>');
  const previous = Object.fromEntries(['window', 'document', 'MutationObserver', 'Event', 'chrome'].map((key) => [key, globalThis[key]]));
  const listeners = new Set();
  const data = { [LANGUAGE_KEY]: 'zh-CN', 'setting-brightness': 137 };
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, MutationObserver: dom.window.MutationObserver, Event: dom.window.Event,
    chrome: { storage: { local: { get: async () => ({ ...data }), set: async (next) => { Object.assign(data, next); for (const listener of listeners) listener(Object.fromEntries(Object.entries(next).map(([key, value]) => [key, { newValue: value }])), 'local'); } }, onChanged: { addListener: (listener) => listeners.add(listener) } } } });
  let stop;
  try {
    await initializeLanguage();
    const root = document.querySelector('main');
    const input = root.querySelector('input');
    let clicks = 0; input.addEventListener('click', () => clicks++);
    root.append(createLanguageSelect());
    stop = localizeSurface(root, { documentLanguage: true });
    input.focus();
    await setLanguagePreference('en');
    assert.equal(root.querySelector('h1').textContent, 'Ambient Light');
    assert.equal(root.querySelector('input'), input);
    assert.equal(document.activeElement, input);
    assert.equal(input.value, '137');
    assert.equal(input.getAttribute('aria-label'), 'Brightness value');
    assert.match(root.querySelector('label').dataset.search, /brightness/);
    input.click(); assert.equal(clicks, 1);
    document.querySelector('#status').textContent = '找到 3 个设置';
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(document.querySelector('#status').textContent, '3 settings found');
    assert.equal(document.querySelector('aside').textContent, '关闭');
    assert.equal(document.querySelector('textarea').value, '用户备份');
    for (const listener of listeners) listener({ [LANGUAGE_KEY]: { newValue: 'zh-CN' } }, 'local');
    assert.equal(root.querySelector('h1').textContent, '环境光');
    assert.equal(input.getAttribute('aria-label'), '亮度数值');
    assert.equal(root.querySelector('select').value, 'zh-CN');
    assert.equal(document.querySelector('#status').textContent, '找到 3 个设置');
    assert.equal(data['setting-brightness'], 137);
    registerTranslation('自动移除上下黑边', 'Detect horizontal bars');
    assert.equal(translate('自动移除上下黑边', 'en'), 'Detect horizontal bars');
  } finally {
    stop?.(); dom.window.close();
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});
