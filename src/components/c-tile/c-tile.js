import {mLight} from '../../modals/m-light/m-light';
import {mTemp} from '../../modals/m-temp/m-temp';

const tiles = document.querySelectorAll('.c-tile');

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
