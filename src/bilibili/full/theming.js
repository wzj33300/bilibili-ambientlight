export default class BilibiliTheming {
  constructor(engine) {
    this.ambientlight = engine;
    this.settings = engine.settings;
    this.originalDark = document.documentElement.hasAttribute('dark');
    this.youtubeTheme = this.originalDark ? 1 : -1;
  }
  initListeners() {}
  isDarkTheme() { return document.documentElement.hasAttribute('dark'); }
  shouldBeDarkTheme(enabled = this.settings.enabled && !this.ambientlight.isHidden) {
    return enabled && this.settings.theme !== 0 ? this.settings.theme === 1 : this.originalDark;
  }
  updateTheme() {
    const active = this.settings.enabled && !this.ambientlight.isHidden;
    const dark = this.shouldBeDarkTheme(active);
    document.documentElement.toggleAttribute('dark', dark);
    document.documentElement.toggleAttribute('data-bili-ambientlight-dark', active && this.settings.theme === 1);
    document.documentElement.toggleAttribute('data-bili-ambientlight-light', active && this.settings.theme === -1);
  }
}
