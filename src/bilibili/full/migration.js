// Migrate the small 0.1 prototype once without overwriting full-engine choices.
export async function migrateBasicSettings() {
  const stored = await chrome.storage.local.get(null);
  if (stored['bili-full-migrated']) return;
  const old = stored['bilibili-ambientlight'];
  const next = { 'bili-full-migrated': true };
  if (old && typeof old === 'object') {
    const mappings = { enabled: old.enabled, theme: old.dark === false ? -1 : 1,
      brightness: old.strength, blur2: old.blur, saturation: old.saturation,
      framerateLimit: old.fps, spread: typeof old.spread === 'number' ? old.spread / 5 : undefined };
    for (const [key, value] of Object.entries(mappings)) {
      if (value !== undefined && stored[`setting-${key}`] === undefined) next[`setting-${key}`] = value;
    }
  }
  await chrome.storage.local.set(next);
}
