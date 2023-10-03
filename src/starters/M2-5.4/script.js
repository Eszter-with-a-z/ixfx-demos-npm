import { pointsTracker } from "../../../docs/ixfx/data.js";
import { pointerVisualise } from "../../../docs/ixfx/dom.js";
import { Points } from "../../../docs/ixfx/geometry.js";
//import * as Things from "./thing.js";
import * as Util from "./util.js";

// #region Settings & state
const settings = Object.freeze({
  centroidElement: document.querySelector(`#centroidEl`),
  visualise: pointerVisualise(document),
  tracker: pointsTracker(),
  container: document.querySelector(`.container`),

  pinchThreshold: 150,
});

/**
 * @typedef {{
 *  things:Things.Thing[]
 * }} State
 */
let state = Object.freeze({
  activePointers: [],
  centroid: 0,
  pinchRate: 0,
  isPinching: false,
  pinchWidth: 0,
});

const createPages = () => {
  const { container } = settings;
  let pageIdCounter = 0;
  let saturation = 100;
  // Check if container exits
  if (!container) {
    console.error(`Container not found.`);
    return;
  }

  for (let index = 0; index <= 100; index += 5) {
    // Create a new <div> element
    const div = document.createElement(`div`);
    div.id = `page-${pageIdCounter}`;
    div.classList.add(`page`);
    div.style.backgroundColor = `hsl(266, ${saturation}%, 50%)`;
    // Append the <div> element to the container
    container.append(div);
    // Increase page Count
    pageIdCounter++;
    saturation -= 5;
  }
};

const use = () => {
  const { centroidElement } = settings;
  let { activePointers } = state;
  let { pinchWidth } = state;
  let { centroid } = state;

  // Update centroid
  document.addEventListener(`pointermove`, function () {
    const { centroid } = state;
    positionFromMiddle(centroidElement, centroid);
  });
  // Remove pointers and centroid
  document.addEventListener(`pointerup`, function (event) {
    let { tracker } = settings;
    centroidElement.style.display = `none`;
    tracker.delete(event.pointerId);
    event.target.remove();
    //detectPinching();
  });
};
// Update pointers
const update = () => {
  let { centroid, activePointers: activePointers } = state;
  let { tracker } = settings;
  const { pinchThreshold } = settings;

  document.addEventListener(`pointermove`, async (event) => {
    if (!tracker) return;
    // Track pointer
    const info = await tracker.seen(event.pointerId, {
      x: event.x,
      y: event.y,
    });

    // Update activePointers
    activePointers = [...tracker.trackedByAge()];
    saveState({ activePointers: activePointers });

    // Find centroid based on activePointers
    if (activePointers.length > 0) {
      centroid = Points.centroid(...activePointers);
      centroid = relativePoint(centroid.x, centroid.y);
      saveState({ centroid });
    }
    detectPinching();
    let { isPinching } = state;
    if (isPinching) {
      // If isPinching is true, move the page-20 element to follow the centroid
      const page20 = document.querySelector(`#page-20`);
      if (event.target.classList.contains(`container`)) {
        positionFromMiddle(event.target, centroid);
        // positionFromMiddle(page20, centroid);
        event.target.addEventListener(`pointerup`, () => {
          // Animate release
        });
      }
    }
    //___
  });
};

function setup() {
  createPages();
  // Find width
  let { centroid, activePointers: activePointers } = state;
  let { tracker } = settings;
  document.addEventListener(`pointerdown`, async (event) => {
    console.log(event.target);
    //Update activ
    if (!tracker) return;
    // Track pointer
    const info = await tracker.seen(event.pointerId, {
      x: event.x,
      y: event.y,
    });

    // Update activePointers
    activePointers = [...tracker.trackedByAge()];
    saveState({ activePointers: activePointers });
    if (activePointers.length > 1) {
      let distance = getDistance(activePointers, centroid);
      console.log(distance);
    }
  });
  // end of width finder
  // Add animation
  setTimeout(function () {
    // Update pointers
    update();
    // Update centroid
    use();
  }, 100);
}

// #region Toolbox
/**
 * Save state
 * @param {Partial<state>} s
 */
function saveState(s) {
  state = Object.freeze({
    ...state,
    ...s,
  });
}
setup();
// #endregion */

/**
 * Make `x` and `y` relative with respect to window dimensions
 * @param {number} x
 * @param {number} y
 * @returns {{x:number,y:number}}
 */
export const relativePoint = (x, y) => {
  return {
    x: x / window.innerWidth,
    y: y / window.innerHeight,
  };
};

/**
 * Position an element from its middle
 * @param {HTMLElement} element
 * @param {Points.Point} relativePos
 */
const positionFromMiddle = (element, relativePos) => {
  if (!element) throw new Error(`Element undefined`);

  // Convert relative to absolute units
  const absPosition = Points.multiply(
    relativePos,
    window.innerWidth,
    window.innerHeight
  );

  const thingRect = element.getBoundingClientRect();
  const offsetPos = Points.subtract(
    absPosition,
    thingRect.width / 2,
    thingRect.height / 2
  );
  //console.log(offsetPos);
  // Apply via CSS
  element.style.transform = `translate(${offsetPos.x}px, ${offsetPos.y}px)`;
  element.style.display = `block`;
};

const detectPinching = () => {
  let { activePointers } = state;
  let { centroid } = state;
  let { isPinching } = state;
  const { pinchThreshold } = settings;
  if (activePointers === 0) {
    saveState({ isPinching: false });
    return;
  }

  document.addEventListener(`pointermove`, function (event) {
    const distance = getDistance(activePointers, centroid);

    // Check if the distance is decreasing significantly (pinching)
    if (distance < pinchThreshold) {
      // Trigger your pinching motion detection logic here
      saveState({ isPinching: true });
    } else saveState({ isPinching: false });
  });
};
const getDistance = (activePointers, centroid) => {
  const distance = Points.distance(
    activePointers[0],
    activePointers[1],
    centroid
  );
  return distance;
};
// 