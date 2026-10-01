// Test-only extension API shim. Never included in the distributed extension.
const memory = JSON.parse(sessionStorage.getItem('bili-full-test-settings') || '{}');
const listeners = new Set();
const areaListeners = new Set();
const emit = (changes) => {
  sessionStorage.setItem('bili-full-test-settings', JSON.stringify(memory));
  listeners.forEach((callback) => callback(changes, 'local'));
  areaListeners.forEach((callback) => callback(changes));
};
const local = {
  get(keys, callback) {
    const result = keys == null ? { ...memory } : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, memory[key]]));
    callback?.(result);
    return Promise.resolve(result);
  },
  set(values, callback) {
    const changes = {};
    for (const [key, value] of Object.entries(values)) {
      if (memory[key] !== value) changes[key] = { oldValue: memory[key], newValue: value };
      memory[key] = value;
    }
    queueMicrotask(() => emit(changes));
    callback?.();
    return Promise.resolve();
  },
  remove(keys, callback) {
    const changes = {};
    for (const key of Array.isArray(keys) ? keys : [keys]) { changes[key] = { oldValue: memory[key] }; delete memory[key]; }
    queueMicrotask(() => emit(changes));
    callback?.();
    return Promise.resolve();
  },
  onChanged: { addListener: (fn) => areaListeners.add(fn), removeListener: (fn) => areaListeners.delete(fn) },
};
window.chrome = { ...window.chrome,
  runtime: { id: 'local-fixture', getURL: (file) => `${location.origin}/${file}`, getManifest: () => ({ version: '0.2.3' }) },
  storage: { local, onChanged: { addListener: (fn) => listeners.add(fn), removeListener: (fn) => listeners.delete(fn) } },
};
