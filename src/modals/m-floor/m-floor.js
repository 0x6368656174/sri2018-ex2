import {Modal} from '../modal';

/**
 * Диалог настройки пола
 */
export class MFloorDialog extends Modal {
  constructor() {
    super('m-floor');
  }
}

/**
 * Диалог настройки пола
 * @type {MFloorDialog}
 */
export const mFloor = new MFloorDialog();
