import { AmbientController } from './controller.js';
import { ExtensionSettings } from './settings.js';

const controller = new AmbientController(new ExtensionSettings());
controller.start().catch((error) => {
  controller.destroy();
  console.error('[Bilibili Ambient Light] 初始化失败', error);
});
