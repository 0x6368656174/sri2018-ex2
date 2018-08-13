import {MRangeDialog} from '../m-range-dialog/m-range-dialog';

/**
 * Диалог настройки температуры
 */
class MTemp extends MRangeDialog {
  constructor() {
    super('m-temp');
  }
}

/**
 * Диалог настройки температуры
 * @type {MTemp}
 */
export const mTemp = new MTemp();
