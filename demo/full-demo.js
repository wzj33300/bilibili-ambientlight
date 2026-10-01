const source = document.createElement('canvas');
source.width = 1280; source.height = 720;
const ctx = source.getContext('2d');
let blackBars = false;
function paint(time) {
  const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
  gradient.addColorStop(0, '#16b0c9'); gradient.addColorStop(.5, '#393171'); gradient.addColorStop(1, '#ef459c');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffffff28'; ctx.beginPath(); ctx.arc(640 + Math.sin(time / 1400) * 170, 360, 120, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '50px system-ui'; ctx.fillText('FULL AMBIENT ENGINE', 340, 370);
  if (blackBars) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 1280, 90); ctx.fillRect(0, 630, 1280, 90); }
  requestAnimationFrame(paint);
}
paint(0);
const stream = source.captureStream(30);
let video = document.querySelector('video');
video.srcObject = stream;
document.querySelector('#play').onclick = () => video.paused ? video.play() : video.pause();
document.querySelector('#replace').onclick = async () => {
  const next = video.cloneNode(); next.srcObject = stream;
  video.replaceWith(next); video.srcObject = null; video = next;
  await video.play();
};
document.querySelector('#wide').onclick = () => {
  document.body.classList.toggle('wide');
  document.querySelector('.bpx-player-container').dataset.screen = document.body.classList.contains('wide') ? 'wide' : 'normal';
};
document.querySelector('#route').textContent = '切换黑边测试图';
document.querySelector('#route').onclick = () => { blackBars = !blackBars; };
const fullscreenButton = document.createElement('button');
fullscreenButton.textContent = '测试原生全屏（80%画面）';
document.querySelector('.toolbar').append(fullscreenButton);
fullscreenButton.onclick = async () => {
  const a = window.ambientlight;
  if (!a) return;
  a.settings.set('videoScale.FULLSCREEN', 80, true);
  try { await document.querySelector('.bpx-player-container').requestFullscreen(); }
  catch { display.textContent = '浏览器未授予原生全屏；请直接在此页点击全屏按钮。'; }
};
const webFullscreenButton = document.createElement('button');
webFullscreenButton.textContent = '测试网页全屏（80%画面）';
document.querySelector('.toolbar').append(webFullscreenButton);
webFullscreenButton.onclick = () => {
  const player = document.querySelector('.bpx-player-container');
  const active = player.dataset.screen === 'web';
  window.ambientlight.settings.set('videoScale.FULLSCREEN', 80, true);
  player.dataset.screen = active ? 'normal' : 'web';
  player.style.cssText = active ? '' : 'position:fixed;inset:0;width:100vw;height:100vh;z-index:100';
  video.parentElement.style.cssText = 'width:100%;height:100%';
};
const rendererButton = document.createElement('button');
rendererButton.textContent = '切换 WebGL / Canvas2D';
document.querySelector('.toolbar').append(rendererButton);
rendererButton.onclick = async () => {
  await chrome.storage.local.set({ 'setting-webGL': !window.ambientlight.settings.webGL });
  location.reload();
};
const display = document.querySelector('#diagnostics');
const headerPipButton = document.createElement('button');
headerPipButton.textContent = '验证顶栏与画中画';
document.querySelector('.toolbar').append(headerPipButton);
headerPipButton.onclick = async () => {
  checking = true;
  const a = window.ambientlight;
  const output = [];
  const check = (yes, name) => { output.push(`${yes ? 'PASS' : 'FAIL'} ${name}`); display.textContent = output.join('\n'); };
  const bar = document.querySelector('.bili-header__bar');
  a.atTop = true; await a.updateAtTop();
  check(getComputedStyle(bar).backgroundColor === 'rgba(0, 0, 0, 0)', '页面顶部顶栏透明');
  a.atTop = false; await a.updateAtTop();
  a.settings.set('headerFillOpacity', 0, true); a.settings.set('headerShadowSize', 50, true);
  a.settings.set('headerImagesOpacity', 25, true); a.updateStyles();
  check(getComputedStyle(bar).backgroundColor === 'rgba(20, 20, 24, 0.5)', '滚动后顶栏半透明');
  check(getComputedStyle(bar.querySelector('span')).textShadow !== 'none', '顶栏文字阴影');
  check(getComputedStyle(bar.querySelector('svg')).filter !== 'none' && getComputedStyle(bar.querySelector('svg')).opacity === '0.25', 'SVG 图标阴影与透明度');
  a.settings.set('enableInPictureInPicture', false, true);
  video.pause(); video.dispatchEvent(new Event('enterpictureinpicture'));
  await delay(200);
  check(a.isHidden && !document.documentElement.hasAttribute('data-ambientlight-enabled'), '暂停视频进入画中画立即隐藏环境光');
  video.dispatchEvent(new Event('leavepictureinpicture'));
  await delay(500);
  check(!a.isHidden && document.documentElement.hasAttribute('data-ambientlight-enabled'), '退出画中画恢复环境光');
};
document.querySelector('#test').disabled = true;
let checking = false;
setInterval(() => {
  if (checking) return;
  const a = window.ambientlight;
  document.querySelector('#test').disabled = !a;
  display.textContent = a ? `Renderer: ${a.projector?.type}\nAmbient frames: ${a.ambientlightFrameCount}\nVideo: ${video.videoWidth} × ${video.videoHeight}\nMode: ${a.view}\nBars: ${a.settings.horizontalBarsClipPercentage}% / ${a.settings.verticalBarsClipPercentage}%\nError: ${document.querySelector('.bili-ambient-status')?.textContent || 'none'}` : 'Waiting for full upstream engine…';
}, 500);
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
document.querySelector('#test').onclick = async () => {
  if (checking) return;
  checking = true;
  const results = [];
  const check = (condition, label) => { results.push(`${condition ? 'PASS' : 'FAIL'} ${label}`); display.textContent = results.join('\n'); if (!condition) throw new Error(label); };
  try {
    const a = window.ambientlight;
    check(Boolean(a?.projector), '完整上游渲染器初始化');
    const before = a.ambientlightFrameCount;
    await video.play(); await delay(500);
    check(a.ambientlightFrameCount > before, '视频帧驱动实际渲染');
    check(a.settings.menuElem.querySelectorAll('[id^=setting-]').length > 150, '完整高级设置控件');
    a.settings.set('showFPS', true, true); a.stats.update();
    check(Boolean(a.stats.FPSListElem), '上游性能统计面板');
    a.settings.set('horizontalBarsClipPercentage', 10, true);
    a.sizesChanged = true; await a.optionalFrame(true);
    check(Math.abs(a.barsClip[1] - .1) < .001, '手动黑边裁切进入渲染流水线');
    a.settings.set('horizontalBarsClipPercentage', 0, true);
    a.settings.set('directionTopEnabled', false, true);
    a.sizesChanged = true; await a.optionalFrame(true);
    check(!a.settings.directionTopEnabled, '方向设置触发上游蒙版更新');
    a.settings.set('directionTopEnabled', true, true);
    a.settings.set('videoDebandingStrength', 20, true); a.updateStyles();
    check(Boolean(document.querySelector('.ambientlight__video-debanding')), '视频去色带噪声层');
    a.settings.set('videoDebandingStrength', 0, true); a.updateStyles();
    a.settings.set('frameBlending', true, true); a.settings.set('framerateLimit', 0, true); a.initFrameBlending();
    a.sizesChanged = true; await a.optionalFrame(true);
    check(Boolean(a.previousProjectorBuffer), '上游帧融合缓存');
    a.settings.set('frameBlending', false, true); a.settings.set('framerateLimit', 60, true);
    a.sizesChanged = true; await a.optionalFrame(true);
    blackBars = true;
    a.settings.clickUI('detectHorizontalBarSizeEnabled');
    await delay(7000);
    check(a.settings.horizontalBarsClipPercentage > 10 && a.settings.horizontalBarsClipPercentage < 15, '原始检测算法识别 12.5% 上下黑边');
    a.settings.clickUI('detectHorizontalBarSizeEnabled');
    blackBars = false;
    a.settings.set('horizontalBarsClipPercentage', 0, true);
    const next = video.cloneNode(); next.srcObject = stream; video.replaceWith(next); video.srcObject = null; video = next;
    await video.play(); await delay(1800);
    check(a.videoElem === video && document.querySelectorAll('.ambientlight').length === 1, '切集重绑定而不重复创建引擎');
    document.querySelector('.bpx-player-container').dataset.screen = 'wide';
    await delay(300);
    check(a.getView() === 'THEATER', 'BPX 宽屏模式识别');
    document.querySelector('.bpx-player-container').dataset.screen = 'normal';
    a.settings.set('energySaver', true, true);
    await a.calculateAverageVideoFramesDifference();
    check(Boolean(a.biliEnergyCanvas), '节能检测使用本地视频采样');
    a.settings.set('energySaver', false, true);
    const oldBrightness = a.settings.brightness;
    await chrome.storage.local.set({ 'setting-brightness': 123 });
    await delay(300);
    check(a.settings.brightness === 123 && a.filterElem.style.filter.includes('brightness(123%)'), '外部设置更新实际应用于渲染');
    await chrome.storage.local.set({ 'setting-brightness': oldBrightness });
    a.settings.set('videoScale.FULLSCREEN', 80, true);
    webFullscreenButton.click();
    await delay(500);
    const playerRect = a.videoPlayerElem.getBoundingClientRect();
    const videoRect = video.getBoundingClientRect();
    check(a.elem.parentElement.classList.contains('bpx-player-video-area') && Math.abs(videoRect.top - playerRect.top - playerRect.height * .1) < 3, '全屏光晕进入播放器内部且缩放垂直居中');
    webFullscreenButton.click();
    await delay(400);
    check(a.elem.parentElement === document.body, '退出全屏恢复页面光晕层');
    await a.settings.flushPendingStorageEntries();
    check(!document.querySelector('.bili-ambient-status'), '渲染过程无捕获异常');
  } catch (error) { results.push(`ERROR ${error.message}`); }
  display.textContent = results.join('\n');
};
