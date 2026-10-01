import { registerTranslation } from './i18n.js';

export const LABELS = {
  sectionSettingsCollapsed:'设置', advancedSettings:'显示高级设置', sectionStatsCollapsed:'性能统计', showFPS:'帧率', showFrametimes:'帧时间图', showResolutions:'分辨率与绘制耗时', showBarDetectionStats:'黑边检测统计',
  sectionQualityPerformanceCollapsed:'画质与性能', webGL:'WebGL 渲染器', resolution:'渲染分辨率', framerateLimit:'帧率上限（0 为不限）', frameSync:'帧同步方式', energySaver:'静态画面节能', prioritizePageLoadSpeed:'优先页面加载', layoutPerformanceImprovements:'B 站页面响应优化', debandingBlendMode:'去色带显示模式',
  sectionOtherPageHeaderCollapsed:'页面顶栏', headerShadowSize:'顶栏阴影大小', headerShadowOpacity:'顶栏阴影不透明度', headerImagesOpacity:'顶栏图片不透明度', headerFillOpacity:'顶栏背景不透明度',
  sectionOtherPageContentCollapsed:'周围内容', surroundingContentShadowSize:'内容阴影大小', surroundingContentShadowOpacity:'内容阴影不透明度', surroundingContentTextAndBtnOnly:'仅为文字和按钮添加阴影', surroundingContentImagesOpacity:'内容图片不透明度', surroundingContentFillOpacity:'按钮与内容背景不透明度', pageBackgroundGreyness:'页面背景灰度', immersiveTheaterView:'宽屏沉浸模式', relatedScrollbar:'推荐视频独立滚动', hideScrollbar:'隐藏滚动条',
  sectionVideoResizingCollapsed:'视频画面', 'videoScale.SMALL':'普通模式画面大小', 'videoScale.THEATER':'宽屏模式画面大小', 'videoScale.FULLSCREEN':'全屏模式画面大小', videoShadowSize:'视频阴影大小', videoShadowOpacity:'视频阴影不透明度', videoDebandingStrength:'视频去色带（噪声）', videoOverlayEnabled:'同步视频与环境光', videoOverlaySyncThreshold:'同步丢帧停用阈值', chromiumBugVideoJitterWorkaround:'高刷新率抖动修复', chromiumDirectVideoOverlayWorkaround:'硬件叠加画面异常修复',
  sectionHorizontalBarsCollapsed:'黑边与彩色边裁切', detectHorizontalBarSizeEnabled:'自动移除上下黑边', detectVerticalBarSizeEnabled:'自动移除左右黑边', detectColoredHorizontalBarSizeEnabled:'检测彩色边框', detectHorizontalBarSizeOffsetPercentage:'检测偏移', barSizeDetectionAverageHistorySize:'检测平均帧数', barSizeDetectionAllowedElementsPercentage:'检测容错阈值', barSizeDetectionAllowedUnevenBarsPercentage:'不对称边框阈值', horizontalBarsClipPercentage:'手动上下裁切', verticalBarsClipPercentage:'手动左右裁切', horizontalBarsClipPercentageReset:'切换视频时重置裁切', detectVideoFillScaleEnabled:'移除黑边后填满画面',
  sectionImageAdjustmentCollapsed:'颜色滤镜', brightness:'亮度', contrast:'对比度', vibrance:'自然饱和度', saturation:'饱和度', sectionHdrImageAdjustmentCollapsed:'HDR 滤镜', hdrBrightness:'HDR 亮度', hdrContrast:'HDR 对比度', hdrSaturation:'HDR 饱和度',
  sectionDirectionsCollapsed:'光晕方向', directionTopEnabled:'上方', directionRightEnabled:'右侧', directionBottomEnabled:'下方', directionLeftEnabled:'左侧',
  sectionAmbientlightCollapsed:'环境光', blur2:'模糊程度', edge:'边缘宽度', spread:'扩散范围', spreadFadeStart:'渐隐起点', spreadFadeCurve:'渐隐曲线', debandingStrength:'环境光去色带（噪声）', frameFading:'颜色淡入时长', flickerReduction:'闪烁抑制', frameBlending:'帧融合', frameBlendingSmoothness:'帧融合平滑度', fixedPosition:'固定背景位置',
  sectionViewCollapsed:'启用场景', sectionViewsCollapsed:'启用场景', enableInViews:'启用的播放布局', enableInPictureInPicture:'画中画时保留页面环境光', enableInEmbed:'嵌入式视频', enableInVRVideos:'VR / 360 度视频', sectionGeneralCollapsed:'通用', theme:'页面主题', enabled:'启用环境光',
};
export function localizeSettings(config) {
  const points = { Light: '浅色', Default: '跟随页面', Dark: '深色', All: '全部', Small: '普通', Theater: '宽屏', Fullscreen: '全屏', 'Small & Theater': '普通与宽屏', 'Theater & Fullscreen': '宽屏与全屏', Decoded: '解码', Display: '屏幕', Video: '视频', 'LCD (normal)': 'LCD（标准）', 'OLED (overlay)': 'OLED（叠加）' };
  for (const item of config) {
    if (LABELS[item.name]) {
      const english = item.name === 'layoutPerformanceImprovements' ? 'Bilibili layout optimizations' : item.label?.replaceAll('YouTube', 'Bilibili').replaceAll('Theater', 'Wide');
      registerTranslation(LABELS[item.name], english);
      item.label = LABELS[item.name];
    }
    for (const point of item.snapPoints || []) {
      if (points[point.label]) { registerTranslation(points[point.label], point.label.replaceAll('Theater', 'Wide').replaceAll('Small', 'Normal')); point.label = points[point.label]; }
      if (points[point.hiddenLabel]) { registerTranslation(points[point.hiddenLabel], point.hiddenLabel.replaceAll('Theater', 'Wide').replaceAll('Small', 'Normal')); point.hiddenLabel = points[point.hiddenLabel]; }
    }
    if (item.name === 'layoutPerformanceImprovements') {
      item.description = '优化推荐列表与评论的布局和绘制';
      item.questionMark = { title: '对屏幕外的推荐视频和评论启用浏览器按需布局。' };
    }
    if (item.name === 'energySaver') item.questionMark = { title: '在本机比较当前视频的小尺寸采样帧，静态画面降低环境光帧率。不会下载或上传视频。' };
    if (item.name === 'headerFillOpacity') {
      item.description = '页面顶部透明；向下滚动后使用此不透明度';
      item.questionMark = { title: '顶部让环境光透过导航栏。滚动后：-100 为全透明，0 为半透明，100 为不透明。' };
    }
  }
  return config;
}
