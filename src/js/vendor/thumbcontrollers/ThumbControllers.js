export const ThumbControllers = {};

ThumbControllers.CircularSlider = function(options) {
  const that = this;

  let width = 200;

  let width2 = 100;

  let color1 = '#666';

  let color2 = '#333';

  let color3 = '#111';

  let onChange = null;

  this.value = 0;
  this.max = 1;
  this.min = 0;
  this.step = 0.01;
  this.display = true;

  let x0 = false;
  let y0;
  let value;
  let thumbValue;

  const style = document.createElement('style');

  document.head.appendChild(style);

  style.sheet.insertRule('.grab{cursor:grab;cursor:-webkit-grab;cursor:-moz-grab;}', 0);
  style.sheet.insertRule('.grab:active{cursor:grabbing;cursor:-webkit-grabbing;cursor:-moz-grabbing;}', 0);

  if (options) {
    this.max = typeof options.max === 'undefined' ? this.max : options.max;
    this.min = typeof options.min === 'undefined' ? this.min : options.min;
    this.step = typeof options.step === 'undefined' ? this.step : options.step;
    this.value = typeof options.value === 'undefined' ? this.value : options.value;
    this.display = typeof options.display === 'undefined' ? this.display : options.display;

    width = typeof options.width === 'undefined' ? width : options.width;
    width2 = width / 2;
    color1 = options.color1 || color1;
    color2 = options.color2 || color2;
    color3 = options.color3 || color3;
    onChange = options.onChange || null;
  }

  const container = document.createElement('div');

  const ns = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(ns, 'svg');

  const ramp = document.createElementNS(ns, 'circle');

  const progress = document.createElementNS(ns, 'circle');

  const innerCircle = document.createElementNS(ns, 'circle');

  const text = document.createElement('p');

  svg.setAttribute('width', width);
  svg.setAttribute('height', width);
  svg.style.cssText = 'width: 100%; height: 100%;';
  container.style.width = `${width}px`;
  container.style.height = `${width}px`;
  container.style.left = '20px';
  container.style.top = '20px';
  container.style.position = 'relative';
  container.style.transform = 'scale(1.227)';
  container.appendChild(svg);

  const t = `translate(${width2},${width2})`;

  ramp.setAttribute('transform', t);
  ramp.setAttribute('r', '90');
  ramp.setAttribute('fill', color3);
  ramp.setAttribute('class', 'grab');
  progress.setAttribute('transform', `${t}rotate(90)`);
  progress.setAttribute('r', '80');
  progress.setAttribute('fill', 'none');
  progress.setAttribute('class', 'grab');
  // progress.setAttribute( 'stroke-dashoffset', '953' );
  innerCircle.setAttribute('transform', t);
  innerCircle.setAttribute('r', '70');
  innerCircle.setAttribute('fill', color2);
  innerCircle.setAttribute('class', 'grab');
  text.className = 'grab f-circular-slider__text';

  progress.style.cssText = `stroke: ${color1}; fill: none; stroke-width: 20;stroke-dasharray: 503`;

  text.style.cssText = 'position: absolute; width: 100%; text-align:center;';

  svg.appendChild(ramp);
  svg.appendChild(progress);
  svg.appendChild(innerCircle);

  if (that.display) {
    container.appendChild(text);
  }

  text.addEventListener('mousedown', onMouseDown, false);
  text.addEventListener('touchstart', onMouseDown, false);

  progress.addEventListener('mousedown', onMouseDown, false);
  progress.addEventListener('touchstart', onMouseDown, false);

  ramp.addEventListener('mousedown', onMouseDown, false);
  ramp.addEventListener('touchstart', onMouseDown, false);

  innerCircle.addEventListener('mousedown', onMouseDown, false);
  innerCircle.addEventListener('touchstart', onMouseDown, false);

  window.addEventListener('mouseup', onMouseUp, false);
  window.addEventListener('touchend', onMouseUp, false);

  window.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('touchmove', onMouseMove, false);

  update();

  this.el = container;

  this.onChange = function(f) {
    onChange = f;
  };

  this.setValue = function(v) {
    v = (v - that.min) / (that.max - that.min);

    update(v);
  };

  function onMouseMove(e) {
    if (x0 !== false) {
      value = getValue(e);

      update(value);
    }
  }

  function onMouseDown(e) {
    e.preventDefault();

    e.stopPropagation();

    let ref = container;

    x0 = y0 = 0;

    while (ref) {
      x0 += ref.offsetLeft;
      y0 += ref.offsetTop;

      ref = ref.offsetParent;
    }

    x0 += width2;
    y0 += width2;

    value = getValue(e);

    update(value);
  }

  function onMouseUp() {
    x0 = false;
  }

  function update(v) {
    const value = typeof v === 'undefined' ? that.value : v;

    computeValue(value);

    const offset = ((value * 2 * Math.PI + Math.PI / 2) * 100) / (2 * Math.PI);

    progress.setAttribute('stroke-dashoffset', offset.toString());

    if (that.display) {
      text.textContent = that.value;
    }

    if (onChange) {
      onChange(that.value);
    }
  }

  function computeValue(v) {
    let value = typeof v === 'undefined' ? that.value : v;

    thumbValue = 1 - value;

    progress.style.strokeDashoffset = (thumbValue * 503).toString();

    value = value * (that.max - that.min) + that.min;

    let step = that.step;
    let val = value;
    let m = 0;

    // Convert to integers to avoid floating point operation issues.
    if (val !== parseInt(val) || step !== parseInt(step)) {
      while (val !== parseInt(val) || step !== parseInt(step)) {
        val *= 10;

        step *= 10;

        m++;

        if (m > 5) {
          // Not much sense to go further of even 2 actually.. ?
          val = parseInt(val);

          step = parseInt(step);
        }
      }
    }

    value = (val - (val % step)) / Math.pow(10, m);

    that.value = value;
  }

  function getValue(e) {
    let x;
    let y;
    let result;

    x = e.touches ? e.touches[0].clientX : e.clientX;

    y = e.touches ? e.touches[0].clientY : e.clientY;

    x = x - x0;

    y = -y + y0;

    const a = Math.atan(y / x) + Math.PI / 2;

    result = x < 0 ? Math.PI + a : a;

    result /= 2 * Math.PI;

    result = 1 - result;

    return result;
  }
};
