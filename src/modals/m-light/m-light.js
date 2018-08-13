import {MRangeDialog} from '../m-range-dialog/m-range-dialog';

/**
 * Диалог настройки света
 */
class MLight extends MRangeDialog {
  constructor() {
    super('m-light');
  }
}

/**
 * Диалог настройки света
 * @type {MLight}
 */
export const mLight = new MLight();
