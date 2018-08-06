import {Modal} from '../modal';
import ResizeObserver from 'resize-observer-polyfill';

export class MRangeDialog extends Modal {
  constructor(id) {
    super(id);

    const rangeContainer = this._modal.querySelector('.m-range-dialog__range-container');
    const range = this._modal.querySelector('.m-range-dialog__range');
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
