// All required page operations use the shared DOM. No injection into Bilibili's
// private player objects or untrusted page-to-extension command bridge.
export const injectedScript = {
  listeners: [],
  addMessageListener(type, handler) {
    const entry = { type, handler };
    this.listeners.push(entry);
    return entry;
  },
  removeMessageListener(entry) { this.listeners = this.listeners.filter((item) => item !== entry); },
  postMessage(type, data) {
    const html = document.documentElement;
    if (type === 'show') {
      html.setAttribute('data-ambientlight-enabled', 'true');
      html.toggleAttribute('data-ambientlight-hide-scrollbar', data.hideScrollbar);
      html.toggleAttribute('data-ambientlight-related-scrollbar', data.relatedScrollbar);
      html.toggleAttribute('data-ambientlight-immersive', data.immersiveMode);
    } else if (type === 'hide') {
      for (const name of ['enabled', 'hide-scrollbar', 'related-scrollbar', 'immersive']) html.removeAttribute(`data-ambientlight-${name}`);
    } else if (type === 'init-vr-video') {
      if (this.vrFrame) cancelAnimationFrame(this.vrFrame);
      const tick = () => {
        if (!document.hidden) this.listeners.filter((entry) => entry.type === 'next-vr-frame').forEach((entry) => entry.handler());
        this.vrFrame = requestAnimationFrame(tick);
      };
      this.vrFrame = requestAnimationFrame(tick);
    } else if (type === 'dispose-vr-video') {
      cancelAnimationFrame(this.vrFrame);
      this.vrFrame = null;
    }
  },
  postAndReceiveMessage(type, data) { this.postMessage(type, data); return Promise.resolve(undefined); },
};
