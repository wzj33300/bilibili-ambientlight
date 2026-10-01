// Reuse upstream's cached, directional fade curves without YouTube page APIs.
import ProjectorShadow from '../scripts/libs/projector-shadow.js';
import { lightGeometry } from './adapter.js';

export class Renderer {
  constructor(root) {
    this.host = document.createElement('div');
    this.host.className = 'bili-ambientlight-layer';
    this.host.setAttribute('aria-hidden', 'true');
    this.host.style.cssText = 'position:fixed;pointer-events:none;z-index:8;contain:layout style;overflow:hidden;display:none;';
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    this.host.append(this.canvas);
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    if (!this.ctx) throw new Error('浏览器无法创建 Canvas 2D 上下文');
    this.shadow = new ProjectorShadow(false);
    if (!this.shadow.ctx) throw new Error('浏览器无法创建渐隐蒙版');
    root.append(this.host);
  }

  layout(rect, settings) {
    const geometry = lightGeometry(rect, settings.spread);
    const key = JSON.stringify([rect.width, rect.height, settings.spread]);
    if (this.layoutKey !== key) {
      this.layoutKey = key;
      // The ambient field needs very few pixels even for a 4K source.
      this.canvas.width = 256;
      this.canvas.height = Math.max(32, Math.round(256 * geometry.height / geometry.width));
      this.shadow.rescale(geometry.scale, { w: rect.width, h: rect.height }, {
        spreadFadeCurve: 35, spreadFadeStart: 0,
        directionTopEnabled: true, directionRightEnabled: true,
        directionBottomEnabled: true, directionLeftEnabled: true,
      });
    }
    const styles = {
      left: `${geometry.left}px`, top: `${geometry.top}px`,
      width: `${geometry.width}px`, height: `${geometry.height}px`,
      clipPath: geometry.clip, opacity: `${settings.strength / 100}`,
    };
    for (const [key, value] of Object.entries(styles)) {
      if (this.host.style[key] !== value) this.host.style[key] = value;
    }
    this.canvas.style.filter = `blur(${settings.blur}px) saturate(${settings.saturation}%)`;
  }

  draw(video) {
    const { width, height } = this.canvas;
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.clearRect(0, 0, width, height);
    // Canvas2D can display cross-origin media without reading its pixels.
    // Do not change crossOrigin/src or call getImageData on Bilibili's video.
    this.ctx.drawImage(video, 0, 0, width, height);
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.drawImage(this.shadow.elem, 0, 0, width, height);
    this.ctx.globalCompositeOperation = 'source-over';
    this.host.style.display = 'block';
  }

  hide() { this.host.style.display = 'none'; }
  destroy() { this.host.remove(); }
}
