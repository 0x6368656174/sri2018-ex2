/**
 * Устанавливает ориентацию слайдера
 *
 * @param {HTMLElement} range Слайдер
 * @param {string} orientation Ориентация, доступно 'horizontal', 'vertical'
 */
export function setOrientation(range, orientation) {
  switch (orientation) {
    case 'horizontal':
      {
        range.classList.remove('f-range--orientation-vertical');
      }
      break;
    case 'vertical':
      {
        range.classList.add('f-range--orientation-vertical');
      }
      break;
  }
}
