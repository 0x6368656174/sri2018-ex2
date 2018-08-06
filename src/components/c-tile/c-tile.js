import {mBrightness} from '../../modals/m-brightness/m-brightness';

const tiles = document.querySelectorAll('.c-tile');

tiles.forEach(tile => {
  const {type} = tile.dataset;

  tile.addEventListener('click', () => {
    if (type === 'brightness') {
      mBrightness.showFrom(tile);
    }
  });
});
