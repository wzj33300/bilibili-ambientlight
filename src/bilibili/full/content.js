import Ambientlight from '../../scripts/libs/ambientlight.js';
import Settings from '../../scripts/libs/settings.js';
import { off, setErrorHandler } from '../../scripts/libs/generic.js';
import { findVideo, isVideoPage } from '../adapter.js';
import { applyBiliPageStyles, updateMiniPlayer } from './platform-runtime.js';
import { migrateBasicSettings } from './migration.js';
import { decorateMenu } from './menu.js';
import { initializeLanguage, localizeSurface, translate } from './i18n.js';

let engine;
let starting = false;
let closed = false;
let lastURL = location.href;
const accepted = () => isVideoPage(location) || location.hostname === '127.0.0.1' && document.documentElement.hasAttribute('data-bili-ambient-demo');
const report = (error) => {
  console.warn('[Bilibili Ambient Light]', error);
  const elem = document.querySelector('.bili-ambient-status') || document.createElement('div');
  elem.className = 'bili-ambient-status';
  elem.textContent = translate(`环境光：${error.message || error}`);
  if (!elem.isConnected) document.body.append(elem);
};
setErrorHandler(report);

async function scan() {
  if (closed || starting) return;
  const video = accepted() ? findVideo() : null;
  if (!video || video.readyState < 2) {
    if (engine?.isOnVideoPage) { engine.isOnVideoPage = false; await engine.hide(); }
    return;
  }
  if (!engine) {
    starting = true;
    try {
      await initializeLanguage();
      await migrateBasicSettings();
      engine = await new Ambientlight(video, document.body, video.closest('#playerWrap, #bilibili-player'), document.querySelector('.bili-header, #biliMainHeader'));
      window.ambientlight = engine;
      document.querySelector('.bili-ambient-status')?.remove();
      const button = engine.settings.menuBtn;
      if (button) { button.title = 'Bilibili 环境光设置'; localizeSurface(button); }
      decorateMenu(engine.settings);
      applyBiliPageStyles(engine);
      engine.elem.dataset.biliRenderer = engine.projector.type;
      engine.elem.dataset.biliVersion = chrome.runtime.getManifest().version;
    } catch (error) { report(error); closed = true; }
    finally { starting = false; }
    return;
  }
  const changedVideo = engine.videoElem !== video;
  const changedURL = lastURL !== location.href;
  const resumed = !engine.isOnVideoPage;
  if (changedVideo) {
    engine.cancelScheduledRequestVideoFrame();
    for (const [name, handler] of Object.entries(engine.videoListeners || {})) off(engine.videoElem, name, handler);
    engine.resetVideoParentElemStyle();
    engine.initElems(video);
    engine.settings.menuBtnParent = engine.settingsMenuBtnParent;
    engine.settings.menuElemParent = engine.videoPlayerElem;
    engine.settingsMenuBtnParent.append(engine.settings.menuBtn);
    engine.videoPlayerElem.append(engine.settings.menuElem);
    engine.videoResizeObserver.disconnect();
    engine.videoResizeObserver.observe(video);
    engine.videoPlayerResizeObserver.disconnect();
    engine.videoPlayerResizeObserver.observe(engine.videoPlayerElem);
    engine.initVideoListeners();
  }
  engine.isOnVideoPage = true;
  await updateMiniPlayer(engine);
  if (engine.view !== engine.getView()) {
    await engine.updateView();
    engine.sizesChanged = true;
    await engine.optionalFrame();
  }
  if (changedVideo || changedURL || resumed) {
    lastURL = location.href;
    engine.biliPreviousPixels = null;
    engine.resetAverageVideoFramesDifference();
    await engine.resetSettingsIfNeeded();
    engine.barDetection.reset();
    engine.buffersCleared = engine.sizesChanged = true;
    await engine.start();
  }
}

// Bilibili's router changes history in another JS world; observe video nodes
// and use a low-frequency route check without wrapping site-owned methods.
let queued;
const observer = new MutationObserver((records) => {
  if (records.some((record) => [...record.addedNodes, ...record.removedNodes].some((node) =>
    node.nodeType === 1 && (node.matches?.('video') || node.querySelector?.('video'))))) {
    clearTimeout(queued);
    queued = setTimeout(() => scan().catch(report), 100);
  }
});
observer.observe(document.body, { childList: true, subtree: true });
const interval = setInterval(() => {
  if (!document.hidden) scan().catch(report);
}, 1000);
window.addEventListener('popstate', () => scan().catch(report));
window.addEventListener('pageshow', () => scan().catch(report));
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  closed = true;
  clearInterval(interval);
  clearTimeout(queued);
  observer.disconnect();
  engine?.cancelScheduledRequestVideoFrame();
  if (engine?.biliEnergyTimer) clearInterval(engine.biliEnergyTimer);
  engine?.barDetection?.cancel();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !engine) return;
  for (const [key, { newValue }] of Object.entries(changes)) {
    if (!key.startsWith('setting-')) continue;
    const name = key.slice(8);
    const value = engine.settings.processStorageEntry(name, newValue);
    if (engine.settings[name] === value) continue;
    const checkbox = engine.settings.menuElem.querySelector(`#setting-${CSS.escape(name)}[role="menuitemcheckbox"]`);
    const range = engine.settings.menuElem.querySelector(`#setting-${CSS.escape(name)}-range`);
    if (checkbox) checkbox.click();
    else if (range) {
      const previous = engine.settings[name];
      engine.settings[name] = value;
      range.value = engine.settings.getInputRangeValue(name);
      engine.settings[name] = previous;
      range.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  Settings.storedSettingsCached = null;
});
scan().catch(report);
