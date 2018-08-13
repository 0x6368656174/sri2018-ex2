import {desktopMedia} from '../../js/media';

const moveScriptsTopButton = document.querySelector('.c-main__favorite-scripts-move-top');
const scripts = document.querySelector('.c-main__favorite-scripts');
const scriptElements = document.querySelectorAll('.c-main__favorite-script');

let currentVisibleScript = 0;

/**
 * Показывает скрипты начиная с index
 *
 * @param {number} index
 */
function showScriptsFrom(index) {
  for (let i = 0; i < scriptElements.length; ++i) {
    const script = scriptElements[i];
    if (i < index || i > index + 1) {
      setTimeout(() => {
        script.style.visibility = 'hidden';
      }, 200);
    } else {
      script.style.visibility = null;
    }
  }

  scripts.style.top = `${index * -135}px`;
}

/**
 * Сдвигает скрипты
 */
function moveScripts() {
  if (currentVisibleScript + 3 > scriptElements.length) {
    alert('К сожалению, кнопки вниз дизайном не предусмотрено, поэтому дальше мотать не будет, чтоб не получилось'
    + ' снизу дырки.');
    return;
  }
  currentVisibleScript++;
  showScriptsFrom(currentVisibleScript);
}

/**
 * Обработчик, вызываемый при изменении сайта с десктоп на мобильную версию
 *
 * @param {MediaQueryList} event
 */
function desktopMediaListener(event) {
  if (event.matches) {
    // Если это десктоп, то включим перемотку
    currentVisibleScript = 0;
    showScriptsFrom(currentVisibleScript);

    moveScriptsTopButton.addEventListener('click', moveScripts);
  } else {
    // Иначе выключим перемотку и востановим состояние
    moveScriptsTopButton.removeEventListener('click', moveScripts);
    scripts.style.top = null;
    for (const script of scriptElements) {
      script.style.visibility = null;
    }
  }
}

// Добавим обработчик изменения размера сайта
desktopMedia.addListener(desktopMediaListener);
desktopMediaListener(desktopMedia);
