import {Modal} from '../modal';

/**
 * Диалог с крутилкой
 */
export class MFloorDialog extends Modal {
  constructor() {
    super('m-floor');
  }
}

export const mFloor = new MFloorDialog();
