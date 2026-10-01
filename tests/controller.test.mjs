import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { DEFAULTS } from '../src/bilibili/settings.js';

function environment() {
  const dom = new JSDOM('<!doctype html><body><div class="bpx-player-container"><video></video></div></body>', {
    url: 'https://www.bilibili.com/video/BVtest', pretendToBeVisual: true,
  });
  const win = dom.window;
  for (const name of ['document', 'location', 'MutationObserver', 'AbortController']) globalThis[name] = win[name];
  globalThis.window = win;
  globalThis.innerWidth = 1280;
  globalThis.innerHeight = 900;
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.requestAnimationFrame = win.requestAnimationFrame.bind(win);
  globalThis.cancelAnimationFrame = win.cancelAnimationFrame.bind(win);
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  const state = { paused: false, ready: 4, hidden: false, full: null, rect: { left: 100, top: 100, width: 640, height: 360, right: 740, bottom: 460 } };
  Object.defineProperty(document, 'hidden', { get: () => state.hidden });
  Object.defineProperty(document, 'fullscreenElement', { get: () => state.full });
  const callbacks = new Map();
  let sequence = 0;
  function prepare(video) {
    for (const [key, getter] of Object.entries({ paused: () => state.paused, ended: () => false, readyState: () => state.ready, videoWidth: () => 1280 })) {
      Object.defineProperty(video, key, { get: getter });
    }
    video.getBoundingClientRect = () => state.rect;
    video.requestVideoFrameCallback = (callback) => { callbacks.set(++sequence, callback); return sequence; };
    video.cancelVideoFrameCallback = (id) => callbacks.delete(id);
    return video;
  }
  const video = prepare(document.querySelector('video'));
  const player = video.parentElement;
  player.getBoundingClientRect = () => state.rect;
  const renderers = [];
  const rendererFactory = () => {
    const renderer = {
      canvas: document.createElement('canvas'), draws: 0, hidden: true, removed: false,
      layout() {}, draw() { this.draws++; this.hidden = false; },
      hide() { this.hidden = true; }, destroy() { this.removed = true; },
    };
    renderers.push(renderer);
    return renderer;
  };
  let notify;
  const writes = [];
  const store = {
    async read() { return DEFAULTS; },
    async write(settings) { writes.push(settings); },
    subscribe(callback) { notify = callback; return () => { notify = null; }; },
  };
  return { dom, state, callbacks, video, player, prepare, rendererFactory, renderers, store, writes, emit: (value) => notify(value) };
}

test('player lifecycle: frame cap, pause, seek, visibility, fullscreen, replacement, navigation, teardown', async () => {
  const env = environment();
  const { AmbientController } = await import('../src/bilibili/controller.js');
  const app = new AmbientController(env.store, { rendererFactory: env.rendererFactory });
  try {
    await app.start();
    assert.equal(env.renderers.length, 1);
    assert.equal(env.renderers[0].draws, 1);
    assert.equal(env.callbacks.size, 1);
    assert.equal(document.documentElement.hasAttribute('data-bili-ambientlight-dark'), true);
    const callback = env.callbacks.values().next().value;
    env.callbacks.clear();
    callback(app.lastDraw + 5);
    assert.equal(env.renderers[0].draws, 1, 'do not exceed the configured fps');
    env.state.paused = true;
    env.video.dispatchEvent(new window.Event('pause'));
    assert.equal(env.callbacks.size, 0);
    const pausedDraws = env.renderers[0].draws;
    env.video.dispatchEvent(new window.Event('seeked'));
    assert.equal(env.renderers[0].draws, pausedDraws + 1);
    env.state.hidden = true;
    document.dispatchEvent(new window.Event('visibilitychange'));
    assert.equal(env.renderers[0].hidden, true);
    env.state.hidden = false;
    env.state.paused = false;
    document.dispatchEvent(new window.Event('visibilitychange'));
    assert.equal(env.callbacks.size, 1);
    env.state.full = env.player;
    document.dispatchEvent(new window.Event('fullscreenchange'));
    assert.equal(env.callbacks.size, 0);
    env.state.full = null;
    document.dispatchEvent(new window.Event('fullscreenchange'));
    assert.equal(env.callbacks.size, 1);
    env.video.replaceWith(env.prepare(document.createElement('video')));
    app.scan();
    assert.equal(env.renderers[0].removed, true);
    assert.equal(env.renderers.length, 2);
    assert.equal(env.callbacks.size, 1, 'old player callback must be cancelled');
    window.history.pushState({}, '', '/');
    app.scan();
    assert.equal(env.callbacks.size, 0);
    assert.equal(document.documentElement.hasAttribute('data-bili-ambientlight-dark'), false);
    assert.equal(app.panel.host.style.display, 'none');
  } finally {
    app.destroy();
    assert.equal(document.querySelector('.bili-ambientlight-settings'), null);
    assert.equal(env.callbacks.size, 0);
    env.dom.window.close();
  }
});

test('settings persist, remote changes apply, rendering errors stop and toggling retries', async () => {
  const env = environment();
  const { AmbientController } = await import('../src/bilibili/controller.js');
  const app = new AmbientController(env.store, { rendererFactory: env.rendererFactory });
  try {
    await app.start();
    app.changeSettings({ enabled: false, fps: 20 });
    assert.equal(env.callbacks.size, 0);
    await app.save();
    assert.equal(env.writes.at(-1).fps, 20);
    env.emit({ ...DEFAULTS, dark: false });
    assert.equal(document.documentElement.hasAttribute('data-bili-ambientlight-dark'), false);
    assert.equal(env.callbacks.size, 1);
    const renderer = env.renderers[0];
    const originalDraw = renderer.draw;
    renderer.draw = () => { throw new DOMException('Protected media', 'SecurityError'); };
    const warn = console.warn;
    console.warn = () => {};
    try { app.refresh(); } finally { console.warn = warn; }
    assert.equal(app.failed, true);
    assert.equal(env.callbacks.size, 0);
    assert.equal(renderer.hidden, true);
    renderer.draw = originalDraw;
    app.changeSettings({ enabled: false });
    app.changeSettings({ enabled: true });
    assert.equal(app.failed, false);
    assert.equal(env.callbacks.size, 1);
  } finally { app.destroy(); env.dom.window.close(); }
});

test('offscreen, waiting media, and keyboard focus do not waste work or hijack typing', async () => {
  const env = environment();
  const { AmbientController } = await import('../src/bilibili/controller.js');
  const app = new AmbientController(env.store, { rendererFactory: env.rendererFactory });
  try {
    env.state.ready = 0;
    await app.start();
    assert.equal(env.renderers[0].draws, 0);
    env.state.ready = 4;
    env.video.dispatchEvent(new window.Event('loadeddata'));
    assert.equal(env.callbacks.size, 1);
    env.state.rect = { ...env.state.rect, top: -500, bottom: -140 };
    app.refresh();
    assert.equal(env.callbacks.size, 0);
    const input = document.createElement('input');
    document.body.append(input);
    input.dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, altKey: true, shiftKey: true, code: 'KeyA' }));
    assert.equal(app.settings.enabled, true);
    document.dispatchEvent(new window.KeyboardEvent('keydown', { altKey: true, shiftKey: true, code: 'KeyA' }));
    assert.equal(app.settings.enabled, false);
  } finally { app.destroy(); env.dom.window.close(); }
});
