export const STORAGE_KEY = 'bilibili-ambientlight';
export const DEFAULTS = Object.freeze({
  enabled: true,
  strength: 70,
  spread: 100,
  blur: 45,
  saturation: 125,
  fps: 30,
  dark: true,
});

const ranges = {
  strength: [0, 100], spread: [20, 220], blur: [0, 100],
  saturation: [50, 200], fps: [10, 60],
};

export function normalizeSettings(input = {}) {
  const result = { ...DEFAULTS };
  if (!input || typeof input !== 'object') return result;
  for (const key of ['enabled', 'dark']) {
    if (typeof input[key] === 'boolean') result[key] = input[key];
  }
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (typeof input[key] === 'number' && Number.isFinite(input[key])) {
      result[key] = Math.round(Math.max(min, Math.min(max, input[key])));
    }
  }
  return result;
}

export class ExtensionSettings {
  async read() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return normalizeSettings(data[STORAGE_KEY]);
  }
  async write(settings) {
    await chrome.storage.local.set({ [STORAGE_KEY]: normalizeSettings(settings) });
  }
  subscribe(callback) {
    const listener = (changes, area) => {
      if (area === 'local' && changes[STORAGE_KEY]) {
        callback(normalizeSettings(changes[STORAGE_KEY].newValue));
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
}
