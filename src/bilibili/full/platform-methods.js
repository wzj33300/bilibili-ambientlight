/* global biliRect, biliView, VIEW_DISABLED, VIEW_DETACHED, VIEW_SMALL */
// This class is a build-time source of platform method overrides. Methods are
// spliced into upstream Ambientlight, including its arrow-function fields.
export default class BilibiliPlatformMethods {
  get playerSmallContainerElem() { return this.videoPlayerElem?.parentElement; }
  get playerTheaterContainerElem() { return this.videoPlayerElem?.parentElement; }
  get playerTheaterContainerElemFromVideo() { return this.getView() === 'THEATER' ? this.videoPlayerElem : null; }
  get ytdWatchElemFromVideo() { return this.videoElem?.closest('#playerWrap, #bilibili-player, #bilibiliPlayer'); }
  get thumbnailOverlayElem() { return this.videoPlayerElem?.querySelector('.bpx-player-video-poster'); }

  initElems(videoElem) {
    this.videoIsPictureInPicture = document.pictureInPictureElement === videoElem;
    this.videoPlayerElem = videoElem.closest('.bpx-player-container, .bilibili-player, #bilibili-player, #bilibiliPlayer');
    if (!this.videoPlayerElem) throw new Error('Bilibili player not found');
    this.videoPlayerElem.dataset.ytalElem = 'video-player';
    this.ytdPlayerElem = this.videoPlayerElem;
    this.videoContainerElem = videoElem.parentElement;
    this.biliVideoParentStyles ||= new WeakMap();
    if (!this.biliVideoParentStyles.has(this.videoContainerElem)) {
      this.biliVideoParentStyles.set(this.videoContainerElem, Object.fromEntries(
        ['width', 'height', 'margin-bottom', 'overflow', 'transform', '--video-transform'].map((name) => [name, this.videoContainerElem.style.getPropertyValue(name)])
      ));
    }
    this.settingsMenuBtnParent = this.videoPlayerElem.querySelector('.bpx-player-control-bottom-right, .bilibili-player-video-control-bottom-right, .bili-ambient-floating-controls');
    if (!this.settingsMenuBtnParent) {
      this.settingsMenuBtnParent = document.createElement('div');
      this.settingsMenuBtnParent.className = 'bili-ambient-floating-controls';
      this.videoPlayerElem.append(this.settingsMenuBtnParent);
    }
    this.initVideoElem(videoElem, false);
  }

  getContentElem = () => document.body;
  resetVideoParentElemStyle() {
    this.shouldStyleVideoParentElem = false;
    const parent = this.videoElem?.parentElement;
    const original = this.biliVideoParentStyles?.get(parent);
    if (!original) return;
    for (const [name, value] of Object.entries(original)) {
      if (value) parent.style.setProperty(name, value);
      else parent.style.removeProperty(name);
    }
  }
  getFullscreenContentElem() {
    return this.videoPlayerElem.querySelector('.bpx-player-video-area') || document.fullscreenElement || this.videoPlayerElem;
  }
  getView = () => {
    if (!this.settings.enabled) return VIEW_DISABLED;
    if (!this.videoPlayerElem?.isConnected) return VIEW_DETACHED;
    return biliView(this.videoPlayerElem) || VIEW_SMALL;
  };

  waitForPageload = async () => {
    if (this.settings.prioritizePageLoadSpeed) {
      await new Promise((resolve) => (window.requestIdleCallback || ((fn) => window.setTimeout(fn, 100)))(resolve, { timeout: 1500 }));
    }
  };

  updateVideoPlayerSize = async () => {
    this.sizesChanged = true;
    await this.optionalFrame();
  };

  updateKeywordsToPreventTheaterScaling = () => {};
  applyChromiumBug1142112Workaround() {
    // Bilibili does not use YouTube's automatic-quality controller.
    // requestVideoFrameCallback visibility suspension is handled by the engine.
  }

  updateIsVideoHiddenOnWatchPage = () => {
    const hidden = !this.videoElem?.isConnected || this.videoPlayerElem?.classList.contains('bpx-state-loading') && this.videoElem.readyState < 2;
    const changed = hidden !== this.isVideoHiddenOnWatchPage;
    this.isVideoHiddenOnWatchPage = hidden;
    return changed;
  };

  checkGetImageDataAllowed() {
    if (!this.videoElem || this.videoElem.readyState < 2) return;
    let allowed = true;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(this.videoElem, 0, 0, 1, 1);
      ctx.getImageData(0, 0, 1, 1);
    } catch { allowed = false; }
    this.getImageDataAllowed = allowed;
    this.settings.updateVisibility();
    if (!allowed) this.settings.setWarning('此视频不允许读取画面；WebGL 和自动黑边检测可能不可用。扩展不会修改视频源或跨域设置。');
  }

  getElemRect(elem) {
    const rect = elem === this.videoElem ? biliRect(elem) : elem.getBoundingClientRect();
    const root = this.clearfixElem.offsetParent || (this.isFullscreen ? document.fullscreenElement || document.body : document.body);
    const origin = root.getBoundingClientRect();
    return { top: rect.top - origin.top, left: rect.left - origin.left, width: rect.width, height: rect.height };
  }

  updateFixedStyle() {
    document.body.toggleAttribute('data-ambientlight-fixed', Boolean(this.settings.fixedPosition));
  }

  initAverageVideoFramesDifferenceListeners() {
    if (this.biliEnergyTimer) return;
    this.biliEnergyTimer = window.setInterval(() => {
      if (this.settings.enabled && this.isOnVideoPage && !document.hidden) this.calculateAverageVideoFramesDifference();
    }, 1000);
  }

  calculateAverageVideoFramesDifference = () => {
    if (!this.settings.energySaver || !this.getImageDataAllowed || this.videoElem?.readyState < 2) return;
    try {
      if (!this.biliEnergyCanvas) {
        this.biliEnergyCanvas = document.createElement('canvas');
        this.biliEnergyCanvas.width = 32;
        this.biliEnergyCanvas.height = 18;
        this.biliEnergyCtx = this.biliEnergyCanvas.getContext('2d', { willReadFrequently: true });
      }
      this.biliEnergyCtx.drawImage(this.videoElem, 0, 0, 32, 18);
      const current = this.biliEnergyCtx.getImageData(0, 0, 32, 18).data;
      if (this.biliPreviousPixels) {
        let difference = 0;
        for (let i = 0; i < current.length; i += 4) {
          difference += Math.max(0, Math.abs(current[i] - this.biliPreviousPixels[i]) / 255 - 0.03) * 0.2126;
          difference += Math.max(0, Math.abs(current[i + 1] - this.biliPreviousPixels[i + 1]) / 255 - 0.03) * 0.7152;
          difference += Math.max(0, Math.abs(current[i + 2] - this.biliPreviousPixels[i + 2]) / 255 - 0.03) * 0.0722;
        }
        this.averageVideoFramesDifference = difference / (current.length / 4);
        this.settings.updateAverageVideoFramesDifferenceInfo();
      }
      this.biliPreviousPixels = current;
    } catch { this.averageVideoFramesDifference = 1; }
  };

  updateImmersiveMode() {
    document.documentElement.toggleAttribute('data-ambientlight-immersive', this.shouldEnableImmersiveMode() && this.settings.enabled);
  }
}
