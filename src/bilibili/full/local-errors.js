// Upstream's error interface with local-only diagnostics. No remote reporter.
export const parseSettingsToSentry = (settings) => settings;
export default class LocalErrors {
  static captureException(error) { console.warn('[Bilibili Ambient Light]', error); }
  static captureMessage(message) { console.warn('[Bilibili Ambient Light]', message); }
  static setExtra() {}
  static setTag() {}
  static setContext() {}
}
