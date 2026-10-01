import { UI_TABS, QUICK_FIELDS, SHORT_LABELS, sectionTab } from './ui-layout.js';
import { createLanguageSelect, localizeSurface } from './i18n.js';

// Keep upstream controls and listeners; only change their presentation and location.
export function decorateMenu(settings) {
  const menu = settings.menuElem;
  if (!menu || menu.classList.contains('bili-menu')) return;
  menu.classList.add('bili-menu');
  const panel = menu.querySelector('.ytp-panel-menu');
  const groups = [...panel.querySelectorAll('.ytpa-section')].map((section) => [section, section.nextElementSibling]);
  const header = document.createElement('header');
  header.className = 'bili-menu-heading';
  const title = document.createElement('strong');
  title.textContent = '环境光';
  const tag = document.createElement('span');
  tag.className = 'bili-menu-tag'; tag.textContent = 'BILIBILI';
  const enabled = menu.querySelector('#setting-enabled');
  enabled.classList.add('bili-master');
  enabled.setAttribute('aria-label', '启用环境光');
  const close = document.createElement('button');
  close.type = 'button'; close.className = 'bili-menu-close'; close.textContent = '×';
  close.setAttribute('aria-label', '关闭环境光设置');
  close.addEventListener('click', () => settings.onCloseMenu({ target: settings.menuBtn, stopPropagation() {} }));
  header.append(title, tag, createLanguageSelect(), enabled, close);
  const tabs = document.createElement('nav');
  tabs.className = 'bili-menu-tabs'; tabs.setAttribute('aria-label', '环境光设置分类');
  const body = document.createElement('div');
  body.className = 'bili-menu-body';
  const panes = new Map();
  for (const tab of UI_TABS) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = tab.label;
    button.setAttribute('aria-pressed', String(tab.id === 'light'));
    const pane = document.createElement('div');
    pane.className = 'bili-menu-pane'; pane.hidden = tab.id !== 'light';
    const intro = document.createElement('p'); intro.className = 'bili-pane-intro'; intro.textContent = tab.subtitle;
    pane.append(intro); panes.set(tab.id, pane); body.append(pane); tabs.append(button);
    button.addEventListener('click', () => {
      for (const sibling of tabs.children) sibling.setAttribute('aria-pressed', String(sibling === button));
      for (const [id, item] of panes) item.hidden = id !== tab.id;
      body.scrollTop = 0;
    });
  }
  const quick = document.createElement('div'); quick.className = 'bili-quick';
  for (const name of QUICK_FIELDS) {
    const control = menu.querySelector(`#setting-${name}`);
    control.classList.add('bili-quick-field');
    control.querySelector('.ytp-menuitem').classList.remove('ytpa-menuitem--advanced');
    control.querySelector('.ytp-menuitem-label').firstChild.textContent = SHORT_LABELS[name];
    quick.append(control);
  }
  panes.get('light').append(quick);
  for (const [section, content] of groups) {
    const tab = sectionTab(section.dataset.name);
    const group = document.createElement('details'); group.className = 'bili-control-group';
    group.open = tab !== 'light';
    const summary = document.createElement('summary'); summary.textContent = section.querySelector('.ytpa-section__label').textContent;
    if (section.dataset.name === 'sectionAmbientlightCollapsed') summary.textContent = '光晕细节';
    group.append(summary, content); panes.get(tab).append(group);
    // Section-collapse state belongs to the old menu. Preserve the nodes for the
    // upstream state machine, but use native accessible disclosures in this UI.
    section.hidden = true; group.append(section);
    if (section.classList.contains('ytpa-section--hdr')) group.classList.add('bili-group-hdr');
    if (tab === 'system' && section.classList.contains('ytpa-section--advanced')) group.classList.add('bili-group-technical');
    if (tab !== 'system') {
      for (const row of content.querySelectorAll('.ytpa-menuitem--advanced')) row.classList.remove('ytpa-menuitem--advanced');
    }
  }
  const tools = document.createElement('details'); tools.className = 'bili-menu-tools';
  const summary = document.createElement('summary'); summary.textContent = '备份与帮助';
  tools.append(summary, ...panel.querySelectorAll('.ytpa-menuitem--header'));
  panes.get('system').append(tools);
  const foot = document.createElement('footer'); foot.className = 'bili-menu-footer';
  foot.textContent = '即时生效';
  const hint = document.createElement('span'); hint.textContent = '右键滑块恢复默认'; foot.append(hint);
  const notices = [...panel.querySelectorAll('.ytpa-menuitem--warning,.ytpa-menuitem--info')];
  panel.replaceChildren(header, tabs, body, foot);
  body.prepend(...notices);
  for (const description of panel.querySelectorAll('.ytpa-menuitem-description')) {
    description.parentElement.title ||= description.textContent;
    description.hidden = true;
    if (description.previousElementSibling?.tagName === 'BR') description.previousElementSibling.hidden = true;
  }
  for (const input of panel.querySelectorAll('input[type=range]')) {
    const paint = () => input.style.setProperty('--fill', `${(Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
    input.addEventListener('input', paint); input.addEventListener('change', paint); paint();
    const label = input.closest('.ytp-menuitem-range-wrapper').querySelector('.ytp-menuitem-label').firstChild.textContent;
    input.setAttribute('aria-label', label);
  }
  // Numeric edits and external storage updates also change the original value node.
  const observer = new MutationObserver(() => {
    for (const input of panel.querySelectorAll('input[type=range]')) input.style.setProperty('--fill', `${(Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
  });
  for (const value of panel.querySelectorAll('.ytp-menuitem-value')) observer.observe(value, { childList: true });
  window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  const stopLocalization = localizeSurface(menu);
  window.addEventListener('pagehide', (event) => { if (!event.persisted) stopLocalization(); }, { once: true });
}
