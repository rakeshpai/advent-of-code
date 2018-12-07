const { join } = require('path');
const {
  addIndex, add, always, apply, applySpec,
  ascend, converge, contains, countBy, descend, equals,
  filter, flatten, flip, head, identity, ifElse,
  juxt, last, length, lt, map, pipe, prop, range,
  reject, sort, split, sum, tail,
  toPairs, trim, uniq
} = require('ramda');
const { taggedSum } = require('daggy');
const { createReducer, readFile, trace } = require('../helpers');

// abs :: Number -> Number
const abs = x => Math.abs(x);

// Coordinate :: {id, x, y}
// parseCoordinates :: String -> Coordinate
const parseCoordinates = pipe(
  split('\n'),
  map(
    pipe(
      split(','),
      map(pipe(trim, Number))
    )
  ),
  addIndex(map)((coord, index) => ({id: index, x: coord[0], y: coord[1] }))
);

const x = prop('x');
const y = prop('y');
const id = prop('id');

// manhattanDistance :: Coordinate -> Coordinate -> Number
const manhattanDistance = coordinate1 => coordinate2 =>
  Math.abs(x(coordinate1) - x(coordinate2)) + Math.abs(y(coordinate1) - y(coordinate2));

// gridLimit :: (Math.max|Math.min) -> (x|y) -> [Coordinate] -> Number
const gridLimit = fn => direction => pipe(map(direction), apply(fn));

// following functions :: (x,y) -> [Coordinate] -> Number
const gridMin = gridLimit(Math.min);
const gridMax = gridLimit(Math.max);

// gridRange :: (x|y) -> [Coordinate] -> [Number]
const gridRange = dir => converge(range, [ gridMin(dir), pipe(gridMax(dir), add(1)) ])

// createGrid :: (Coordinate -> a) -> [Coordinate] -> [[a]]
const createGrid = getCellContents => converge(
  (xrange, yrange, cellContents) =>
    yrange.map(
      y => xrange.map(x => cellContents({ x, y }))
    ),
  [ gridRange(x), gridRange(y), getCellContents ]
);

// Distance :: { id: Number, distance: Number }
// distances :: Coordinate -> [Coordinate] -> [Distance]
const distances = coord => map(
  applySpec({
    id: prop('id'),
    distance: manhattanDistance(coord)
  })
);

const distance = prop('distance');
const first = head;
const second = pipe(tail, head);

// closestId :: [Distance] -> Number
const closestId = pipe(
  sort(ascend(distance)),
  ifElse(
    converge(equals, [ pipe(first, distance), pipe(second, distance) ]),
    always(null),
    pipe(first, id)
  )
);

// cellsAtEdges :: Grid -> [Number]
const cellsAtEdges = pipe(
  juxt([
    head,
    last,
    map(head),
    map(last)
  ]),
  flatten,
  uniq
);

const sizeOfLargestBoundArea = pipe(
  grid => {
    const edgeIds = cellsAtEdges(grid);
    const flatGrid = flatten(grid);

    return pipe(
      reject(flip(contains)(edgeIds)),
      countBy(identity),
      toPairs,
      sort(descend(last)),
      head,
      last
    )(flatGrid);
  }
);

const getClosestId = coords => coord =>
  closestId(distances(coord)(coords));

const isWithinRegion = coords => coord =>
  pipe(
    map(distance),
    sum,
    flip(lt)(10000)
  )(distances(coord)(coords));

const part1 = pipe(
  createGrid(getClosestId),
  sizeOfLargestBoundArea
);

const part2 = pipe(
  createGrid(isWithinRegion),
  flatten,
  filter(identity),
  length
);

const input = readFile(join(__dirname, 'coordinates.txt')).trim();
const coords = parseCoordinates(input);

console.log(part1(coords));
console.log(part2(coords));
