const { join: pathJoin } = require('path');
const {
  applySpec, both, concat, equals,
  flip, map, match, path, pipe,
  prop, range, reduce, split, trim
} = require('ramda');
const { createReducer, mergeSpec, readFile } = require('../helpers');

const propToNum = index => pipe(prop(index), trim(), Number);

// Point :: { position: { x: Number, y: Number }, velocity: { x: Number, y: Number } }
// parseFile :: String -> [Point]
const parseFile = pipe(
  split('\n'),
  map(pipe(
    match(/position=<(.*),(.*)> velocity=<(.*),(.*)>/),
    applySpec({
      position: { x: propToNum(1), y: propToNum(2) },
      velocity: { x: propToNum(3), y: propToNum(4) }
    })
  ))
);

// getPosition :: String -> Number -> Point -> Number
const getPosition = dir => seconds =>
  ({ position, velocity }) => position[dir] + (seconds * velocity[dir]);

// pointsAtTime :: Number -> [Point] -> [Point]
const pointsAtTime = seconds => map(mergeSpec({
  position: {
    x: getPosition('x')(seconds),
    y: getPosition('y')(seconds)
  }
}));

// position :: String -> Point -> Number
const position = coord => path(['position', coord]);

// positionX :: Point -> Number
const posX = position('x');

// positionY :: Point -> Number
const posY = position('y');

// BoundingBox :: { minX: Number, maxX: Number, minY: Number, maxY: Number }
// boundingBoxSize :: [Point] -> BoundingBox
const boundingBoxSize = reduce(
  (result, point) => ({
    minX: Math.min(result.minX, posX(point)),
    minY: Math.min(result.minY, posY(point)),
    maxX: Math.max(result.maxX, posX(point)),
    maxY: Math.max(result.maxY, posY(point))
  }),
  { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
);

// area :: BoundingBox -> Number
const area = o => (o.maxX - o.minX) * (o.maxY - o.minY);

// areaFromParsed :: Number -> [Point] -> Number
const areaFromPoints = seconds => pipe(
  pointsAtTime(seconds),
  boundingBoxSize,
  area
);

// The pure FP version of the following
// function isn't nearly as clean.

// timeAtSmallestArea :: [Point] -> Number
const timeAtSmallestArea = parsed => {
  let seconds = 0;
  let previousArea = Infinity;
  let area = Number.MAX_SAFE_INTEGER;

  while(area < previousArea) {
    previousArea = area;
    area = areaFromPoints(seconds)(parsed);
    seconds++;
  }

  return seconds - 2;
};

// yEquals :: Number -> Point -> Boolean
const yEquals = y => pipe(posY, equals(y));

// xEquals :: Number -> Point -> Boolean
const xEquals = x => pipe(posX, equals(x));

// xRange :: BoundingBox -> [Number]
const xRange = boundingBox => range(boundingBox.minX, boundingBox.maxX + 1);

// yRange :: BoundingBox -> [Number]
const yRange = boundingBox => range(boundingBox.minY, boundingBox.maxY + 1);

// isValidPoint :: (Number, Number) -> Point -> Boolean
const isValidPoint = (x, y) => both(xEquals(x), yEquals(y));

// drawPoint :: (Number, Number, [Point]) -> String
const drawPoint = (x, y, points) =>
  points.find(isValidPoint(x, y)) ? '#': ' ';

// plotMessage :: Number -> [Point] -> String
const plotMessage = seconds => parsed => {
  const points = pointsAtTime(seconds)(parsed);
  const boundingBox = boundingBoxSize(points);

  return yRange(boundingBox).reduce(
    createReducer(y => flip(concat)(
      xRange(boundingBox).reduce(
        createReducer(x => flip(concat)( drawPoint(x, y, points) )),
        '\n'
      )
    )),
    ''
  );
};

// ----

const input = readFile(pathJoin(__dirname, 'points.txt')).trim();
const points = parseFile(input);

console.log('Running clocks forward...');
const time = timeAtSmallestArea(points);
console.log(
  `Smallest bounding box found at ${time} seconds,`,
  `and has an area of ${areaFromPoints(time)(points)} square units.`
);
console.log('Visualising message...');
console.log(plotMessage(time)(points));
