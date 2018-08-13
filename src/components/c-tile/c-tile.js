import {mLight} from '../../modals/m-light/m-light';
import {mTemp} from '../../modals/m-temp/m-temp';

const tiles = document.querySelectorAll('.c-tile');

// Добавим обработчики кликов
tiles.forEach(tile => {
  const {dialogType} = tile.dataset;

  tile.addEventListener('click', () => {
    switch (dialogType) {
      case 'light': {
        mLight.showFrom(tile);
        break;
      }
      case 'temp': {
        mTemp.showFrom(tile);
        break;
      }
    }
  });
});

/**
 * Отключает фокус у плашки
 *
 * @param {HTMLElement} tile
 */
export function disableFocus(tile) {
  tile.setAttribute('aria-hidden', 'true');
  tile.tabIndex = -1;
}

/**
 * Включает фокус у плашки
 *
 * @param {HTMLElement} tile
 */
export function enableFocus(tile) {
  tile.removeAttribute('aria-hidden');
  tile.tabIndex = 0;
}
