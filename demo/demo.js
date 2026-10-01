import { AmbientController } from '../src/bilibili/controller.js';
import { Renderer } from '../src/bilibili/renderer.js';
import { DEFAULTS } from '../src/bilibili/settings.js';

const source = document.createElement('canvas');
source.width = 1280;
source.height = 720;
const ctx = source.getContext('2d');
let animation;
function paint(time) {
  const position = (Math.sin(time / 5000) + 1) / 2;
  const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
  gradient.addColorStop(0, `hsl(${185 + position * 35} 85% 48%)`);
  gradient.addColorStop(0.55, '#34316f');
  gradient.addColorStop(1, `hsl(${320 + position * 25} 90% 60%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffffff12';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(640 + Math.sin(time / 3500 + i) * 230, 360 + Math.cos(time / 4200 + i) * 100, 70 + i * 18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = '500 56px system-ui';
  ctx.fillText('A M B I E N T', 415, 365);
  ctx.font = '20px system-ui';
  ctx.fillText('C O L O R  I N  M O T I O N', 480, 410);
  animation = requestAnimationFrame(paint);
}
paint(0);
const stream = source.captureStream(30);
let video = document.querySelector('video');
video.srcObject = stream;
let accepted = true;
let saved = { ...DEFAULTS };
let notify;
let draws = 0;
class CountedRenderer extends Renderer {
  draw(frame) { super.draw(frame); draws++; }
}
const store = {
  async read() { return saved; },
  async write(value) { saved = value; notify?.(value); },
  subscribe(callback) { notify = callback; return () => { notify = null; }; },
};
const app = new AmbientController(store, { acceptsPage: () => accepted, rendererFactory: (root) => new CountedRenderer(root) });
await app.start();
document.querySelector('#play').onclick = () => { if (video.paused) video.play(); else video.pause(); };
function replaceVideo() {
  const next = document.createElement('video');
  next.muted = next.autoplay = next.playsInline = true;
  next.srcObject = stream;
  video.replaceWith(next);
  video.srcObject = null;
  video = next;
  app.scan();
  return video.play();
}
document.querySelector('#replace').onclick = replaceVideo;
document.querySelector('#wide').onclick = () => document.body.classList.toggle('wide');
document.querySelector('#route').onclick = () => { accepted = !accepted; app.scan(); };
const diagnostics = document.querySelector('#diagnostics');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let testing = false;
const ticker = setInterval(() => {
  if (testing) return;
  diagnostics.textContent = `Canvas video: ${video.videoWidth} × ${video.videoHeight}\nRendered frames: ${draws}\nStatus: ${app.availability() || 'active'}\n${diagnostics.dataset.result || ''}`;
}, 500);

document.querySelector('#test').onclick = async () => {
  if (testing) return;
  testing = true;
  const results = [];
  const assert = (condition, label) => { results.push(`${condition ? 'PASS' : 'FAIL'}  ${label}`); if (!condition) throw new Error(label); };
  try {
    accepted = true;
    app.changeSettings({ ...DEFAULTS });
    app.scan();
    await video.play();
    await sleep(450);
    assert(draws > 0 && app.renderer?.host.style.display === 'block', '真实 Canvas 视频帧成功渲染');
    const pixels = app.renderer.ctx.getImageData(0, 0, app.renderer.canvas.width, app.renderer.canvas.height).data;
    let maxAlpha = 0;
    for (let i = 3; i < pixels.length; i += 4) maxAlpha = Math.max(maxAlpha, pixels[i]);
    assert(maxAlpha > 100 && pixels[3] < 30, '上游蒙版保留颜色并将边缘渐隐至透明');
    const rect = video.getBoundingClientRect();
    assert(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) === video, '光晕不拦截播放器鼠标操作');
    video.pause();
    await sleep(100);
    const frozen = draws;
    await sleep(250);
    assert(draws === frozen && app.renderer.host.style.display === 'block', '暂停后停止绘制并保留光晕');
    await replaceVideo();
    await sleep(350);
    assert(app.video === video && document.querySelectorAll('.bili-ambientlight-layer').length === 1, '切集后只保留一个渲染器');
    app.changeSettings({ enabled: false });
    assert(app.renderer.host.style.display === 'none' && !document.documentElement.hasAttribute('data-bili-ambientlight-dark'), '关闭立即清除光晕与主题');
    app.changeSettings({ enabled: true });
    accepted = false;
    app.scan();
    assert(!document.querySelector('.bili-ambientlight-layer'), '离开播放页释放渲染器');
    accepted = true;
    app.scan();
    await sleep(300);
    assert(app.renderer?.host.style.display === 'block', '回到播放页自动恢复');
    diagnostics.dataset.result = `${results.length} browser checks passed`;
  } catch (error) {
    results.push(`ERROR ${error.message}`);
    diagnostics.dataset.result = 'Browser checks FAILED';
  } finally {
    diagnostics.textContent = results.join('\n');
    testing = false;
    clearInterval(ticker);
  }
};
window.addEventListener('pagehide', () => {
  cancelAnimationFrame(animation);
  stream.getTracks().forEach((track) => track.stop());
  clearInterval(ticker);
}, { once: true });
