import {Modal} from '../modal';
import ResizeObserver from 'resize-observer-polyfill';
import {desktopMedia} from '../../js/media';
import {setOrientation} from '../../forms/f-range/f-range';

/**
 * Диалог с слайдером
 */
export class MRangeDialog extends Modal {
  constructor(id) {
    super(id);

    this._rangeContainer = this._modal.querySelector('.m-range-dialog__range-container');
    this._range = this._modal.querySelector('.m-range-dialog__range');
    this._resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const {height} = entry.contentRect;

        this._updateVerticalRangeHeight(height);
      }
    });

    // Добавим обработчик изменения размера сайта
    desktopMedia.addListener(event => this._desktopMediaListener(event));
    this._desktopMediaListener(desktopMedia);
  }

  /**
   * Обновляет высоту вертикального слайдера
   *
   * @param {number} height
   * @private
   */
  _updateVerticalRangeHeight(height) {
    this._range.style.width = `${height - 50}px`;
    this._range.style['min-width'] = `${height - 50}px`;
  }

  /**
   * Обработчик, вызываемый при изменении сайта с десктоп на мобильную версию
   *
   * @param {MediaQueryList} event
   * @private
   */
  _desktopMediaListener(event) {
    if (event.matches) {
      // Это десктоп версия
      // Выключим слежение за изменением размера
      this._resizeObserver.disconnect();

      // Перевернем слайдер в горизонтальную позицию
      setOrientation(this._range, 'horizontal');
      this._range.style.width = '100%';
      this._range.style['min-width'] = null;
    } else {
      // Если это мобильная версия
      // Включим слежение за изменением размера
      this._resizeObserver.observe(this._rangeContainer);

      // Перевернем слайдер в вертикальную позицию
      setOrientation(this._range, 'vertical');

      // Обновим высоту
      this._updateVerticalRangeHeight(this._rangeContainer.offsetHeight);
    }
  }
}
