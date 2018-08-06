import {Modal} from '../modal';
import ResizeObserver from 'resize-observer-polyfill';

class MLight extends Modal {
  constructor() {
    super('m-light');

    const rangeContainer = this._modal.querySelector('.m-light__range-container');
    const range = this._modal.querySelector('.m-light__range');
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const {height} = entry.contentRect;

        range.style.width = `${height - 50}px`;
        range.style['min-width'] = `${height - 50}px`;
      }
    });

    ro.observe(rangeContainer);
  }
}

export const mLight = new MLight();
