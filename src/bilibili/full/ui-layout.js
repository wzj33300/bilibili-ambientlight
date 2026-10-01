export const UI_TABS = [
  { id: 'light', label: '光效', subtitle: '调整光晕的强度、范围与柔和程度' },
  { id: 'video', label: '画面', subtitle: '颜色、缩放与黑边裁切' },
  { id: 'page', label: '页面', subtitle: '让播放器与周围内容自然融合' },
  { id: 'system', label: '更多', subtitle: '性能、播放场景与快捷键' },
];
export const QUICK_FIELDS = ['brightness', 'spread', 'blur2', 'saturation'];
export function sectionTab(name) {
  if (/Ambientlight|Directions/.test(name)) return 'light';
  if (/ImageAdjustment|VideoResizing|HorizontalBars/.test(name)) return 'video';
  if (/OtherPage|General/.test(name)) return 'page';
  return 'system';
}
export const SHORT_LABELS = { brightness: '亮度', spread: '扩散', blur2: '柔和度', saturation: '饱和度' };
