import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ExtensionSettings, DEFAULTS, STORAGE_KEY } from '../src/bilibili/settings.js';

test('settings use extension-local storage and clean up their subscription', async () => {
  let stored;
  let listener;
  globalThis.chrome = { storage: {
    local: {
      async get(key) { assert.equal(key, STORAGE_KEY); return { [key]: stored }; },
      async set(data) { stored = data[STORAGE_KEY]; },
    },
    onChanged: {
      addListener(callback) { listener = callback; },
      removeListener(callback) { assert.equal(callback, listener); listener = null; },
    },
  } };
  try {
    const store = new ExtensionSettings();
    assert.deepEqual(await store.read(), DEFAULTS);
    await store.write({ ...DEFAULTS, fps: 20 });
    assert.equal((await store.read()).fps, 20);
    let received;
    const unsubscribe = store.subscribe((value) => { received = value; });
    listener({ [STORAGE_KEY]: { newValue: { fps: 50 } } }, 'sync');
    assert.equal(received, undefined);
    listener({ [STORAGE_KEY]: { newValue: { fps: 50 } } }, 'local');
    assert.equal(received.fps, 50);
    listener({ [STORAGE_KEY]: {} }, 'local');
    assert.deepEqual(received, DEFAULTS);
    unsubscribe();
    assert.equal(listener, null);
  } finally { delete globalThis.chrome; }
});

test('manifest scopes the extension to Bilibili and only requests storage', async () => {
  const manifest = JSON.parse(await readFile('src/bilibili/manifest.json', 'utf8'));
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.web_accessible_resources, undefined);
  assert.deepEqual(manifest.content_scripts.flatMap((entry) => entry.matches), [
    'https://www.bilibili.com/*', 'https://player.bilibili.com/*',
  ]);
  for (const entry of manifest.content_scripts) {
    assert.deepEqual(entry.js, ['content.js']);
  }
});
