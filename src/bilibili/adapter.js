// Bilibili's BPX player (UGC/PGC), legacy player, and embedded player.
export const PLAYER_SELECTOR = '.bpx-player-container, .bilibili-player, #bilibili-player, #bilibiliPlayer';

export function isVideoPage(location) {
  return location.hostname === 'player.bilibili.com' ||
    (location.hostname === 'www.bilibili.com' &&
      /^\/(video\/|bangumi\/play\/|cheese\/play\/|list\/|medialist\/play\/)/.test(location.pathname));
}

export function findVideo(doc = document) {
  return [...doc.querySelectorAll('video')]
    .filter((video) => {
      const rect = video.getBoundingClientRect();
      const style = doc.defaultView.getComputedStyle(video);
      return video.closest(PLAYER_SELECTOR) && rect.width >= 160 && rect.height >= 90 &&
        style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    })
    .sort((a, b) => {
      const score = (video) => {
        const r = video.getBoundingClientRect();
        return r.width * r.height * (!video.paused && !video.ended ? 2 : 1);
      };
      return score(b) - score(a);
    })[0] || null;
}

export function isInViewport(rect, width, height) {
  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
    rect.top < height && rect.left < width;
}

// Exclude the entire player, including danmaku and controls, from the light layer.
export function lightGeometry(rect, spread) {
  const pad = spread;
  return {
    left: rect.left - pad, top: rect.top - pad,
    width: rect.width + pad * 2, height: rect.height + pad * 2,
    scale: { x: 1 + pad * 2 / rect.width, y: 1 + pad * 2 / rect.height },
    clip: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${pad}px ${pad}px, ${pad}px ${pad + rect.height}px, ${pad + rect.width}px ${pad + rect.height}px, ${pad + rect.width}px ${pad}px, ${pad}px ${pad}px)`,
  };
}
