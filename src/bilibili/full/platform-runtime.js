export function biliView(player) {
  if (document.fullscreenElement || player.dataset.screen === 'full' || player.dataset.screen === 'web' ||
    player.classList.contains('bpx-state-web-fullscreen')) return 'FULLSCREEN';
  if (player.dataset.screen === 'wide' || player.closest('.mode-widescreen, .wide') || player.classList.contains('bpx-state-wide')) return 'THEATER';
  return 'SMALL';
}

export function biliIsMiniPlayer(player) {
  return player?.dataset.screen === 'mini';
}

export async function updateMiniPlayer(engine) {
  const active = biliIsMiniPlayer(engine.videoPlayerElem);
  if (active === Boolean(engine.biliMiniPlayerActive)) return;
  engine.biliMiniPlayerActive = active;
  engine.sizesChanged = true;
  if (active) {
    engine.cancelScheduledRequestVideoFrame();
    await engine.hide();
  } else if (engine.settings.enabled && engine.isOnVideoPage) {
    await engine.start();
  }
}

export function biliVRSource(player) {
  return [...(player?.querySelectorAll('.bpx-player-video-wrap canvas, .webgl canvas') || [])]
    .find((canvas) => !canvas.className.includes('ambientlight') && !canvas.closest('.ambientlight') && canvas.width > 160 && canvas.height > 90 && canvas.getBoundingClientRect().width > 160);
}

export function biliRect(video) {
  const rect = video.getBoundingClientRect();
  if (!video.videoWidth || !video.videoHeight || getComputedStyle(video).objectFit === 'fill') return rect;
  const ratio = Math.min(rect.width / video.videoWidth, rect.height / video.videoHeight);
  const width = video.videoWidth * ratio;
  const height = video.videoHeight * ratio;
  return { left: rect.left + (rect.width - width) / 2, top: rect.top + (rect.height - height) / 2, width, height };
}

export function applyBiliPageStyles(engine) {
  const s = engine.settings;
  const html = document.documentElement;
  html.toggleAttribute('data-ambientlight-hide-scrollbar', s.enabled && s.hideScrollbar);
  html.toggleAttribute('data-ambientlight-related-scrollbar', s.enabled && s.relatedScrollbar);
  html.toggleAttribute('data-bili-content-text-shadow', s.surroundingContentTextAndBtnOnly);
  const variables = {
    '--bili-ambient-grey': `${s.pageBackgroundGreyness * 2.55}`,
    '--bili-ambient-header-images': `${s.headerImagesOpacity / 100}`,
    '--bili-ambient-content-images': `${s.surroundingContentImagesOpacity / 100}`,
    '--bili-ambient-header-fill': `${(s.headerFillOpacity + 100) / 200}`,
    '--bili-ambient-content-fill': `${(s.surroundingContentFillOpacity + 100) / 200}`,
    '--bili-ambient-header-shadow': s.headerShadowSize && s.headerShadowOpacity ? `0 0 ${s.headerShadowSize / 2.5}px rgb(var(--bili-ambient-header-shadow-rgb, 0 0 0) / ${s.headerShadowOpacity / 100})` : 'none',
    '--bili-ambient-header-icon-shadow': s.headerShadowSize && s.headerShadowOpacity ? `drop-shadow(0 0 ${s.headerShadowSize / 5}px rgb(var(--bili-ambient-header-shadow-rgb, 0 0 0) / ${s.headerShadowOpacity / 100}))` : 'none',
    '--bili-ambient-content-shadow': `0 0 ${s.surroundingContentShadowSize}px rgb(0 0 0 / ${s.surroundingContentShadowOpacity / 100})`,
  };
  for (const [name, value] of Object.entries(variables)) document.body.style.setProperty(name, value);
}

export async function updatePictureInPicture(engine, active) {
  engine.videoIsPictureInPicture = active;
  engine.sizesChanged = true;
  if (active && !engine.settings.enableInPictureInPicture) {
    engine.cancelScheduledRequestVideoFrame();
    await engine.hide();
  } else if (engine.settings.enabled && engine.isOnVideoPage) {
    await engine.start();
  }
}
