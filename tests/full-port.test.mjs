import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from '@babel/parser';
import path from 'node:path';
import { bilibiliUpstreamPlugin } from '../tools/bilibili-upstream-plugin.mjs';
import { LABELS } from '../src/bilibili/full/labels.js';
import { biliView, biliRect, updatePictureInPicture } from '../src/bilibili/full/platform-runtime.js';
import { migrateBasicSettings } from '../src/bilibili/full/migration.js';

test('port retains upstream rendering, black-bar scheduling, frame timing and HDR core', async () => {
  const plugin = await bilibiliUpstreamPlugin();
  const id = path.resolve('src/scripts/libs/ambientlight.js');
  const source = (await readFile(id, 'utf8')).replaceAll('\r\n', '\n');
  const result = plugin.transform(source, id).code;
  const members = (code) => parse(code, { sourceType: 'module' }).program.body.find((n) => n.type === 'ExportDefaultDeclaration').declaration.body.body;
  for (const name of ['drawAmbientlight','scheduleBarSizeDetection','onVideoFrame','initFrameBlending','updateHdr','getRealFramerateLimit']) {
    const oldMethod = members(source).find((n) => n.key.name === name);
    const newMethod = members(result).find((n) => n.key.name === name);
    assert.equal(result.slice(newMethod.start, newMethod.end), source.slice(oldMethod.start, oldMethod.end), name);
  }
  assert.match(result, /biliRect\(elem\)/);
  assert.match(result, /biliView\(this.videoPlayerElem\)/);
  assert.doesNotMatch(result, /this.videoElem.crossOrigin =/);
  assert.doesNotMatch(result, /attributeFilter: \['class'\],/);
  assert.doesNotMatch(result, /marginBottom = `\$\{-this.videoElem.offsetHeight\}/);
  assert.match(result, /querySelector\('\.bpx-player-video-area'\)/);
  assert.match(result, /await updatePictureInPicture\(this, true\)/);
  assert.match(result, /await updatePictureInPicture\(this, false\)/);
});

test('PiP immediately hides even without frames and exit only resumes enabled video pages', async () => {
  const calls = [];
  const engine = { settings: { enabled: true, enableInPictureInPicture: false }, isOnVideoPage: true,
    cancelScheduledRequestVideoFrame: () => calls.push('cancel'), hide: async () => calls.push('hide'), start: async () => calls.push('start') };
  await updatePictureInPicture(engine, true);
  assert.deepEqual(calls, ['cancel', 'hide']);
  assert.equal(engine.videoIsPictureInPicture, true);
  await updatePictureInPicture(engine, false);
  assert.equal(calls.at(-1), 'start');
  engine.settings.enabled = false;
  const count = calls.length;
  await updatePictureInPicture(engine, false);
  assert.equal(calls.length, count);
});

test('basic migration keeps existing full settings and only runs once', async () => {
  const data = { 'bilibili-ambientlight': { strength: 70, dark: false, spread: 100, fps: 30 }, 'setting-brightness': 120 };
  globalThis.chrome = { storage: { local: { get: async () => ({ ...data }), set: async (values) => Object.assign(data, values) } } };
  try {
    await migrateBasicSettings();
    assert.equal(data['setting-brightness'], 120);
    assert.equal(data['setting-theme'], -1);
    assert.equal(data['setting-spread'], 20);
    assert.equal(data['setting-framerateLimit'], 30);
    delete data['setting-theme'];
    await migrateBasicSettings();
    assert.equal(data['setting-theme'], undefined);
  } finally { delete globalThis.chrome; }
});

test('all upstream settings remain present and are localized', async () => {
  const source = await readFile('src/scripts/libs/settings-config.js', 'utf8');
  const ast = parse(source, { sourceType: 'module' });
  const config = ast.program.body.find((n) => n.type === 'VariableDeclaration' && n.declarations[0].id.name === 'SettingsConfig').declarations[0].init.elements;
  const names = config.map((n) => n.properties.find((p) => p.key.name === 'name').value.value);
  assert.ok(names.length > 80);
  assert.deepEqual(names.filter((name) => !LABELS[name]), []);
  const plugin = await bilibiliUpstreamPlugin();
  assert.match(plugin.transform(source, path.resolve('src/scripts/libs/settings-config.js')).code, /localizeSettings\(SettingsConfig\)/);
});

test('BPX view modes and letterboxed video geometry match their actual content', () => {
  globalThis.document = { fullscreenElement: null };
  globalThis.getComputedStyle = () => ({ objectFit: 'contain' });
  const player = { dataset: { screen: 'normal' }, classList: { contains: () => false }, closest: () => null };
  try {
    assert.equal(biliView(player), 'SMALL');
    player.dataset.screen = 'wide'; assert.equal(biliView(player), 'THEATER');
    player.dataset.screen = 'web'; assert.equal(biliView(player), 'FULLSCREEN');
    player.dataset.screen = 'normal'; document.fullscreenElement = player; assert.equal(biliView(player), 'FULLSCREEN');
    const rect = biliRect({ videoWidth: 1920, videoHeight: 1080, getBoundingClientRect: () => ({ left: 100, top: 50, width: 800, height: 600 }) });
    assert.equal(rect.width, 800); assert.equal(rect.height, 450);
    assert.equal(rect.top, 125);
  } finally { delete globalThis.document; delete globalThis.getComputedStyle; }
});
