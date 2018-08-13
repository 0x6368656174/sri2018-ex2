import {ThumbControllers} from './../../js/vendor/thumbcontrollers/ThumbControllers';

// Реализация слайдера взята с https://github.com/Astrak/ThumbControllers.js
// Пришлось ее чуть-чуть допилить, т.к. она там никак не настраивается

const circularSliderBlocks = document.querySelectorAll('.f-circular-slider');
for (const circularSliderBlock of circularSliderBlocks) {
  const text = circularSliderBlock.querySelector('.f-circular-slider__text');

  const slider = new ThumbControllers.CircularSlider({
    color1: '#F5A623',
    color2: '#fff',
    color3: '#333333',
    max: 100,
    step: 1,
    width: 180,
    onChange: value => {
      text.innerHTML = `+${value}`;
    },
  });

  slider.setValue(33);

  circularSliderBlock.appendChild(slider.el);
}
