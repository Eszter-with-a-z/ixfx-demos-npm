/**
 * Demonstrates using two movingAverage instances to smooth
 * pointer x,y positions in order to position an element.
 */
import { movingAverage } from '../../ixfx/data.js';
import { Points } from '../../ixfx/geometry.js';
import { mapObject } from '../../ixfx/util.js';

const settings = Object.freeze({
  // Create an averager over {x, y}
  average: mapObject({ x:0, y:0 }, (v) => movingAverage(100))
});


let state = Object.freeze({
  avg: { x: 0, y: 0 },
  pointer: { x: 0, y: 0 }
});

const update = () => {
  const { pointer } = state;
  // Adds the current pointer position to moving average
  addAverage(pointer.x, pointer.y);
};

const addAverage = (absX, absY) => {
  const { x, y } = settings.average;

  // Add relative x,y to their respective movingAverage instance
  updateState ({
    avg: {
      x: x.add(absX / window.innerWidth),
      y: y.add(absY / window.innerHeight)
    }
  });
};

const useState = () => {
  const thingElement = /** @type HTMLElement */(document.querySelector(`#thing`));
  moveElement(thingElement);
};
/**
 * Updates position of element based on
 * computed average
 * @param {HTMLElement|null} thingElement;
 */
const moveElement = (thingElement) => {
  if (!thingElement) return;
  const { avg } = state;

  // Map x,y to absolute pos
  const abs = Points.multiply(avg, window.innerWidth, window.innerHeight);

  // We want to position by its middle, not the top-left
  const thingSize = thingElement.getBoundingClientRect();
  const pt = Points.subtract(abs, thingSize.width / 2, thingSize.height / 2);

  // Move thing
  thingElement.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
};

const setup = () => {
  document.addEventListener(`pointermove`, event => {
    updateState({
      pointer: {
        x: event.clientX,
        y: event.clientY
      }
    });
  });

  // If pointer leaves, use center
  document.addEventListener(`pointerout`, () => {
    updateState({
      pointer: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      }
    });
  });

  const loop = () => {
    update();
    useState();
    window.requestAnimationFrame(loop);
  };
  window.requestAnimationFrame(loop);
};
setup();

/**
 * Update state
 * @param {Partial<state>} s 
 */
function updateState (s) {
  state = Object.freeze({
    ...state,
    ...s
  });
}