import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, normalizeSettings } from '../src/bilibili/settings.js';
import { isVideoPage, lightGeometry, isInViewport } from '../src/bilibili/adapter.js';

test('invalid stored settings cannot inject styles or exceed resource limits', () => {
  assert.deepEqual(normalizeSettings(null), DEFAULTS);
  assert.deepEqual(normalizeSettings({ enabled: 'false', dark: 0, fps: NaN, spread: '999px' }), DEFAULTS);
  assert.equal(normalizeSettings({ fps: 900 }).fps, 60);
  assert.equal(normalizeSettings({ blur: -50 }).blur, 0);
  assert.equal(normalizeSettings({ strength: 61.4 }).strength, 61);
});

test('only Bilibili playback routes activate the effect', () => {
  for (const path of ['/video/BV1/?p=2', '/bangumi/play/ep1', '/cheese/play/ep2', '/list/ml1', '/medialist/play/ml1']) {
    assert.equal(isVideoPage(new URL(`https://www.bilibili.com${path}`)), true);
  }
  assert.equal(isVideoPage(new URL('https://player.bilibili.com/player.html')), true);
  for (const url of ['https://www.bilibili.com/', 'https://www.bilibili.com/dynamic', 'https://live.bilibili.com/1', 'https://example.com/video/BV1']) {
    assert.equal(isVideoPage(new URL(url)), false);
  }
});

test('light geometry preserves a player-sized hole and finite fade scale', () => {
  const geometry = lightGeometry({ left: 80, top: 100, width: 640, height: 360 }, 100);
  assert.equal(geometry.left, -20);
  assert.equal(geometry.width, 840);
  assert.equal(geometry.scale.x, 840 / 640);
  assert.match(geometry.clip, /740px 460px/);
  assert.equal(isInViewport({ width: 640, height: 360, left: 80, right: 720, top: -400, bottom: -40 }, 1280, 720), false);
});
