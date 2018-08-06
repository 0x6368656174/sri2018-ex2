import {mLight} from '../../modals/m-light/m-light';

const tiles = document.querySelectorAll('.c-tile');

tiles.forEach(tile => {
  const {type} = tile.dataset;

  tile.addEventListener('click', () => {
    if (type === 'light') {
      mLight.showFrom(tile);
    }
  });
});
