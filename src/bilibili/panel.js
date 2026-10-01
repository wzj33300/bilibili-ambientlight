import { DEFAULTS } from './settings.js';

const fields = [
  ['strength', '光晕亮度', 0, 100, '%'],
  ['spread', '扩散距离', 20, 220, 'px'],
  ['blur', '柔化程度', 0, 100, 'px'],
  ['saturation', '色彩浓度', 50, 200, '%'],
  ['fps', '刷新上限', 10, 60, 'fps'],
];

export function createPanel(root, onChange, { floating = true } = {}) {
  const host = document.createElement('div');
  host.className = 'bili-ambientlight-settings';
  if (floating) host.style.cssText = 'position:fixed;right:22px;bottom:22px;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host{all:initial;color-scheme:dark;font:13px/1.5 system-ui,"Microsoft YaHei",sans-serif;color:#eeeef7}
      *{box-sizing:border-box}button,input{font:inherit}button{cursor:pointer}
      .launcher{border:1px solid #555363;background:#22222ded;color:#f4edf9;border-radius:22px;padding:9px 15px;box-shadow:0 4px 22px #0005;float:right}
      section{width:300px;padding:20px;background:#1a1b24;border:1px solid #393b4c;border-radius:16px;box-shadow:0 12px 50px #0006;margin-bottom:10px}
      section[hidden]{display:none}header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
      h2{font-size:17px;margin:0;font-weight:650}.dot{display:inline-block;width:9px;height:9px;background:#c8a6ff;box-shadow:0 0 14px #ac74ff;margin-right:9px;border-radius:50%}
      .toggle{display:flex;justify-content:space-between;align-items:center;padding:9px 0}input{accent-color:#b49aff}
      .range{display:block;margin:13px 0}.caption{display:flex;justify-content:space-between;margin-bottom:5px}output{font-variant-numeric:tabular-nums;color:#bbb2d5}
      input[type=range]{display:block;width:100%;cursor:pointer}input[type=checkbox]{width:17px;height:17px}
      p{color:#a6a7ba;font-size:12px;margin:14px 0 0}footer{display:flex;align-items:center;justify-content:space-between;margin-top:16px;color:#9294a8;font-size:11px}
      footer button,.close{border:0;background:transparent;color:#c6b4f4;padding:3px 0}.close{font-size:18px;padding:0 4px}
      a{color:#c6b4f4}button:focus-visible,input:focus-visible{outline:2px solid #c6b4f4;outline-offset:3px}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
    </style>
    <section aria-label="环境光设置" ${floating ? 'hidden' : ''}>
      <header><h2><span class="dot"></span>Bilibili 环境光</h2>${floating ? '<button class="close" aria-label="关闭设置">×</button>' : ''}</header>
      <label class="toggle">启用环境光<input type="checkbox" name="enabled"></label>
      <label class="toggle">深色观影背景<input type="checkbox" name="dark"></label>
      ${fields.map(([key, label, min, max, unit]) => `<label class="range"><span class="caption">${label}<output data-for="${key}"></output></span><input aria-label="${label}" name="${key}" type="range" min="${min}" max="${max}" data-unit="${unit}"></label>`).join('')}
      <p role="status">等待视频播放器…</p>
      <footer><span>Alt + Shift + A · 开关</span><button class="reset">恢复默认</button></footer>
    </section>
    ${floating ? '<button class="launcher" aria-expanded="false">✦ 环境光</button>' : ''}`;
  root.append(host);
  const section = shadow.querySelector('section');
  const launcher = shadow.querySelector('.launcher');
  const toggle = (open) => {
    section.hidden = !open;
    launcher?.setAttribute('aria-expanded', `${open}`);
    if (open) shadow.querySelector('input').focus();
    else launcher?.focus();
  };
  launcher?.addEventListener('click', () => toggle(section.hidden));
  shadow.querySelector('.close')?.addEventListener('click', () => toggle(false));
  host.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && floating) { toggle(false); event.stopPropagation(); }
  });
  shadow.addEventListener('input', (event) => {
    const input = event.target;
    if (!input.name) return;
    const value = input.type === 'checkbox' ? input.checked : Number(input.value);
    const output = shadow.querySelector(`[data-for="${input.name}"]`);
    if (output) output.textContent = `${value} ${input.dataset.unit}`;
    onChange({ [input.name]: value });
  });
  shadow.querySelector('.reset').addEventListener('click', () => onChange({ ...DEFAULTS }));
  return {
    host,
    update(settings) {
      for (const input of shadow.querySelectorAll('input')) {
        if (input.type === 'checkbox') input.checked = settings[input.name];
        else {
          input.value = settings[input.name];
          shadow.querySelector(`[data-for="${input.name}"]`).textContent = `${input.value} ${input.dataset.unit}`;
        }
      }
    },
    status(text) {
      const status = shadow.querySelector('[role="status"]');
      if (status.textContent !== text) status.textContent = text;
    },
    destroy() { host.remove(); },
  };
}
