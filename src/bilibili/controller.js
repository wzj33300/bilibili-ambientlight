import { DEFAULTS, normalizeSettings } from './settings.js';
import { findVideo, isVideoPage, isInViewport, PLAYER_SELECTOR } from './adapter.js';
import { Renderer } from './renderer.js';
import { createPanel } from './panel.js';

export class AmbientController {
  constructor(store, { acceptsPage = () => isVideoPage(location), rendererFactory = (root) => new Renderer(root) } = {}) {
    this.store = store;
    this.acceptsPage = acceptsPage;
    this.rendererFactory = rendererFactory;
    this.settings = { ...DEFAULTS };
    this.listeners = new AbortController();
    this.videoListeners = null;
    this.video = null;
    this.lastDraw = -Infinity;
    this.saveQueue = Promise.resolve();
  }

  async start() {
    this.panel = createPanel(document.body, (patch) => this.changeSettings(patch));
    this.panel.update(this.settings);
    this.unsubscribe = this.store.subscribe((settings) => {
      // A previous write's storage event must not undo a newer slider edit.
      if (this.saveTimer || this.saving) return;
      this.settingsRevision = (this.settingsRevision || 0) + 1;
      this.applySettings(settings);
    });
    const revision = this.settingsRevision || 0;
    try {
      const settings = await this.store.read();
      if (!this.destroyed && revision === (this.settingsRevision || 0)) this.applySettings(settings);
    } catch {
      this.panel.status('无法读取设置，暂时使用默认值。');
    }
    if (this.destroyed) return;
    const options = { signal: this.listeners.signal };
    document.addEventListener('visibilitychange', () => this.refresh(), options);
    document.addEventListener('fullscreenchange', () => this.refresh(), options);
    window.addEventListener('resize', () => this.requestLayout(), options);
    window.addEventListener('scroll', () => this.requestLayout(), { ...options, capture: true, passive: true });
    window.addEventListener('popstate', () => this.scan(), options);
    window.addEventListener('pageshow', () => { this.scan(); this.refresh(); }, options);
    window.addEventListener('pagehide', (event) => {
      if (event.persisted) this.stop();
      else this.destroy();
    }, options);
    document.addEventListener('keydown', (event) => {
      const target = event.composedPath()[0];
      if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyA' &&
          !event.repeat && !target?.isContentEditable && !/^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName)) {
        event.preventDefault();
        this.changeSettings({ enabled: !this.settings.enabled });
      }
    }, options);
    this.observer = new MutationObserver((records) => {
      // Ignore our own UI and high-frequency danmaku text updates.
      if (records.some((record) => [...record.addedNodes, ...record.removedNodes].some((node) =>
        node.nodeType === 1 && (node.matches?.('video, bwp-video') || node.querySelector?.('video, bwp-video'))))) {
        clearTimeout(this.scanTimer);
        this.scanTimer = setTimeout(() => this.scan(), 100);
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
    // pushState is isolated from content scripts; this also detects CSS-only player swaps.
    this.poll = setInterval(() => { if (!document.hidden) this.scan(); }, 1200);
    this.scan();
  }

  changeSettings(patch) {
    this.settingsRevision = (this.settingsRevision || 0) + 1;
    this.applySettings({ ...this.settings, ...patch });
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 180);
  }

  save() {
    clearTimeout(this.saveTimer);
    const settings = { ...this.settings };
    this.saveTimer = null;
    this.saving = (this.saving || 0) + 1;
    this.saveQueue = this.saveQueue.then(() => this.store.write(settings)).catch(() => {
      this.panel?.status('设置保存失败；请刷新页面后重试。');
    }).finally(() => { this.saving--; });
    return this.saveQueue;
  }

  applySettings(settings) {
    if (!this.settings.enabled && settings.enabled) this.failed = false;
    this.settings = normalizeSettings(settings);
    this.panel?.update(this.settings);
    this.refresh();
  }

  scan() {
    if (this.destroyed) return;
    const accepted = this.acceptsPage();
    this.panel.host.style.display = accepted ? '' : 'none';
    const video = accepted ? findVideo() : null;
    const player = video?.closest(PLAYER_SELECTOR);
    if (video !== this.video || player !== this.player) {
      this.stop();
      this.videoListeners?.abort();
      this.resizeObserver?.disconnect();
      this.renderer?.destroy();
      this.renderer = null;
      this.video = video;
      this.player = player;
      this.failed = false;
      if (video) {
        this.videoListeners = new AbortController();
        const options = { signal: this.videoListeners.signal };
        for (const name of ['playing', 'pause', 'ended', 'loadeddata', 'seeked', 'emptied', 'resize', 'enterpictureinpicture', 'leavepictureinpicture']) {
          video.addEventListener(name, () => {
            if (name === 'loadeddata' || name === 'emptied') this.failed = false;
            this.refresh();
          }, options);
        }
        this.resizeObserver = new ResizeObserver(() => this.requestLayout());
        this.resizeObserver.observe(player);
        try {
          this.renderer = this.rendererFactory(document.body);
          this.renderer.canvas.addEventListener('contextlost', (event) => {
            event.preventDefault();
            this.failed = true;
            this.refresh();
          }, options);
          this.renderer.canvas.addEventListener('contextrestored', () => {
            this.failed = false;
            this.refresh();
          }, options);
        } catch (error) {
          this.failed = true;
          console.warn('[Bilibili Ambient Light]', error);
        }
      }
      this.refresh();
    } else if (!video) {
      this.refresh();
    }
    if (!video && accepted && document.querySelector('bwp-video')) {
      this.panel.status('当前为自定义播放器，暂不支持获取画面。此版本支持 HTML5 video 播放器。');
    }
  }

  requestLayout() {
    if (this.layoutFrame || this.destroyed) return;
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = null;
      this.refresh();
    });
  }

  availability() {
    if (!this.settings.enabled) return '环境光已关闭';
    if (!this.video?.isConnected) return '等待视频播放器…';
    if (this.failed) return '画面暂不可用；可重新启用环境光或切换视频重试。';
    if (document.hidden) return '后台标签页已暂停渲染';
    if (document.pictureInPictureElement === this.video) return '画中画期间暂停环境光';
    if (document.fullscreenElement) return '全屏期间暂停环境光，退出后自动恢复';
    const rect = this.player.getBoundingClientRect();
    if (!isInViewport(rect, innerWidth, innerHeight)) return '播放器在屏幕外，已暂停渲染';
    if (rect.width >= innerWidth - 4 && rect.height >= innerHeight - 60) return '网页全屏期间暂停环境光';
    if (this.video.readyState < 2 || !this.video.videoWidth) return '等待视频画面…';
    return '';
  }

  refresh() {
    if (this.destroyed) return;
    this.stop();
    document.documentElement.toggleAttribute('data-bili-ambientlight-dark',
      this.acceptsPage() && Boolean(this.video) && this.settings.enabled && this.settings.dark);
    const reason = this.availability();
    if (reason) {
      this.renderer?.hide();
      this.panel?.status(reason);
      return;
    }
    this.draw(performance.now(), true);
    this.schedule();
  }

  draw(now, force = false) {
    if (!this.renderer || this.failed) return;
    if (!force && now - this.lastDraw < 1000 / this.settings.fps - 0.5) return;
    try {
      this.renderer.layout(this.player.getBoundingClientRect(), this.settings);
      this.renderer.draw(this.video);
      this.lastDraw = now;
      this.panel.status(this.video.paused ? '已暂停 · 保留当前画面的环境光' : `跟随视频画面 · 最高 ${this.settings.fps} fps`);
    } catch (error) {
      this.failed = true;
      this.renderer.hide();
      this.panel.status('无法绘制此视频，已暂停环境光。普通 HTML5 视频可用，受保护视频可能不支持。');
      console.warn('[Bilibili Ambient Light]', error);
    }
  }

  schedule() {
    if (this.destroyed || this.failed || !this.renderer || this.availability() || this.video.paused || this.video.ended) return;
    if (this.video.requestVideoFrameCallback) {
      this.frame = this.video.requestVideoFrameCallback((now) => {
        this.frame = null;
        if (this.availability()) { this.refresh(); return; }
        this.draw(now);
        this.schedule();
      });
    } else {
      this.timer = setTimeout(() => {
        this.timer = null;
        if (this.availability()) { this.refresh(); return; }
        this.draw(performance.now());
        this.schedule();
      }, 1000 / this.settings.fps);
    }
  }

  stop() {
    if (this.frame != null) this.video?.cancelVideoFrameCallback?.(this.frame);
    clearTimeout(this.timer);
    this.frame = this.timer = null;
  }

  destroy() {
    this.destroyed = true;
    this.stop();
    clearTimeout(this.saveTimer);
    if (this.saveTimer) this.save();
    clearTimeout(this.scanTimer);
    clearInterval(this.poll);
    cancelAnimationFrame(this.layoutFrame);
    this.listeners.abort();
    this.videoListeners?.abort();
    this.resizeObserver?.disconnect();
    this.observer?.disconnect();
    this.unsubscribe?.();
    this.renderer?.destroy();
    this.panel?.destroy();
    document.documentElement.removeAttribute('data-bili-ambientlight-dark');
  }
}
