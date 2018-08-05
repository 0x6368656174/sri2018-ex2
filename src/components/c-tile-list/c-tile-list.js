import MobileSelect from 'mobile-select';

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
  new MobileSelect({
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
}

