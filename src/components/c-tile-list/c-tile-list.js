import MobileSelect from 'mobile-select';
import {
  desktopMedia,
  desktopWith2ColumnsMedia,
  desktopWith3ColumnsMedia,
  desktopWith4ColumnsMedia,
} from '../../js/media';

// Фильтры

// Взято с https://stackoverflow.com/a/22119674/1778685
function findAncestor(el, cls) {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}

function filterTiles(filter, {param, value}) {
  const tilesBlock = findAncestor(filter, 'c-tile-list');
  const tiles = tilesBlock.querySelectorAll('.c-tile-list__tile');

  for (const tile of tiles) {
    if (param === undefined && value === undefined) {
      // Выбрали Все
      tile.classList.remove('c-tile-list__tile--hidden');
    } else {
      // Скроем устройства, которые не подходят под фильтр
      const tileParam = tile.dataset[param] || null;
      if (tileParam !== value) {
        tile.classList.add('c-tile-list__tile--hidden');
      } else {
        tile.classList.remove('c-tile-list__tile--hidden');
      }
    }
  }
}

const filters = document.querySelectorAll('.c-tile-list__filters');
let id = 0;
for (const filter of filters) {
  ++id;
  // Добавим фильтру уникальный ид
  const idClass = `c-tile-list__filters--id-${id}`;
  filter.classList.add(idClass);

  // Подготовим данные
  const filterOptions = filter.querySelectorAll('.c-tile-list__filter');
  const data = Array.from(filterOptions)
    .map(filter => {
      const {param, value} = filter.dataset;
      return {
        id: {
          param,
          value,
        },
        value: filter.innerHTML,
      };
    });

  // Привяжем плагин с фильтром
  const select = new MobileSelect({
    trigger: `.${idClass} .c-tile-list__filter--active`,
    title: 'Фильтр устройств',
    wheels: [
      {
        data,
      },
    ],
    ensureBtnText: 'Выбрать',
    cancelBtnText: 'Отмена',
    callback: (index, data) => filterTiles(filter, data[0].id),
  });

  // Добавим обработчики для нажатия на Энтер и пробел над фильтром
  for (const filterOption of filterOptions) {
    filterOption.addEventListener('keypress', event => {
      if (event.key === ' ' || event.key === 'Enter') {
        select.show();
      }
    });
  }

  // В плагине табы и управление с клавиатуры работать не будут, т.к. он это не поддерживает, а в задаче про
  // выпадающее меню ничего сказано не было. Если бы был дизайн, то можно было бы и там нормальный accessibility
  // запилить
}

// Прокрутка
const tileLists = document.querySelectorAll('.c-tile-list');

for (const tileList of tileLists) {
  const prevButton = tileList.querySelector('.c-tile-list__page-button--prev');
  const nextButton = tileList.querySelector('.c-tile-list__page-button--next');
  const tiles = tileList.querySelector('.c-tile-list__tiles');
  const tilesElements = tileList.querySelectorAll('.c-tile-list__tile');
  const rows = 3;
  const tileWidth = 200;
  const tileMargin = 15;

  let pageWidth;
  let pageCount;
  let columns;

  let currentVisiblePage = 0;
  let animationTimeout;

  const showPage = index => {
    clearTimeout(animationTimeout);

    for (const tile of tilesElements) {
      tile.style.visibility = null;
    }

    animationTimeout = setTimeout(() => {
      const startVisibleElement = currentVisiblePage * rows * columns;
      const endVisibleElement = (currentVisiblePage + 1) * rows * columns;
      for (let i = 0; i < tilesElements.length; ++i) {
        const tile = tilesElements[i];
        if (i < startVisibleElement || i >= endVisibleElement) {
          tile.style.visibility = 'hidden';
        }
      }
    }, 200);

    tiles.style.left = `${index * -1 * pageWidth}px`;

    if (index === 0) {
      prevButton.setAttribute('disabled', 'true');
    } else {
      prevButton.removeAttribute('disabled');
    }

    if (index === pageCount - 1) {
      nextButton.setAttribute('disabled', 'true');
    } else {
      nextButton.removeAttribute('disabled');
    }
  };

  const updateColumnsCount = (event, currentColumns) => {
    if (event.matches) {
      columns = currentColumns;
      pageWidth = columns * tileWidth + (columns - 1) * tileMargin;
      pageCount = Math.ceil(tilesElements.length / (columns * rows));

      currentVisiblePage = 0;
      showPage(currentVisiblePage);
    }
  };

  const showPrevPage = () => {
    currentVisiblePage--;
    showPage(currentVisiblePage);
  };

  const showNextPage = () => {
    currentVisiblePage++;
    showPage(currentVisiblePage);
  };

  const desktopMediaListener = event => {
    if (event.matches) {
      currentVisiblePage = 0;
      showPage(currentVisiblePage);

      prevButton.addEventListener('click', showPrevPage);
      nextButton.addEventListener('click', showNextPage);
    } else {
      prevButton.removeEventListener('click', showPrevPage);
      nextButton.removeEventListener('click', showNextPage);
      tiles.style.left = null;
      for (const tile of tilesElements) {
        tile.style.visibility = null;
      }
    }
  };

  desktopWith2ColumnsMedia.addListener(event => updateColumnsCount(event, 2));
  updateColumnsCount(desktopWith2ColumnsMedia, 2);
  desktopWith3ColumnsMedia.addListener(event => updateColumnsCount(event, 3));
  updateColumnsCount(desktopWith3ColumnsMedia, 3);
  desktopWith4ColumnsMedia.addListener(event => updateColumnsCount(event, 4));
  updateColumnsCount(desktopWith4ColumnsMedia, 4);

  desktopMedia.addListener(desktopMediaListener);
  desktopMediaListener(desktopMedia);
}
