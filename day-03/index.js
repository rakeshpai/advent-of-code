const { join } = require('path');
const {
  add, always, applySpec, converge, find,
  flip, gt, inc, map, match, not, pipe,
  prop, range, reduce, split, when, xprod
} = require('ramda');
const { List } = require('immutable');
const { readFile, toInt } = require('../helpers');

// propToInt :: String -> Object -> Number
const propToInt = p => pipe(prop(p), toInt);

// parseClaim :: String -> Claim
const parseClaim = pipe(
  match(/#(\d+) @ (\d+),(\d+): (\d+)x(\d+)/),
  applySpec({
    input: prop('0'),
    id: propToInt('1'),
    left: propToInt('2'),
    top: propToInt('3'),
    width: propToInt('4'),
    height: propToInt('5')
  })
);

// inputToClaims :: String -> [Claims]
const inputToClaims = pipe(
  split('\n'),
  map(parseClaim)
);

// createRange :: String -> String -> Claim -> [Number]
const createRange = (prop1, prop2) =>
  converge(range, [
    prop(prop1),
    converge(add, [ prop(prop1), prop(prop2) ])
  ]);

// occupiedCells :: Claim -> [[Number, Number], ...]
const occupiedCells = pipe(
  applySpec({
    rows: createRange('left', 'width'),
    columns: createRange('top', 'height')
  }),
  converge(xprod, [ prop('rows'), prop('columns') ])
);

// createRowIfNotExists :: Number -> List -> List
const createRowIfNotExists = (row, list) =>
  List.isList(list.get(row)) ? list : list.set(row, List());

// incrementValue :: Number -> Number
const incrementValue = pipe(
  when(isNaN, always(0)), inc
);

// incrementCellOccupancy :: Claim -> List -> List
const incrementCellOccupancy = (claim, list) =>
  occupiedCells(claim).reduce(
    (list, location) =>
      createRowIfNotExists(location[0], list)
        .updateIn(location, incrementValue),
    list
  );

// populateFabric :: Claims -> List
const populateFabric = reduce( flip(incrementCellOccupancy), List() );

// countOverlappingCells :: List -> Number
const countOverlappingCells = reduce(
  (total, row) => row.filter(flip(gt)(1)).size + total,
  0
);

// hasMultipleOccupants :: List -> [Number, Number] -> Boolean
const hasMultipleOccupants = fabric => ([x, y]) => fabric.get(x).get(y) !== 1

// isNonOverlappingClaim :: List -> Claim -> Boolean
const isNonOverlappingClaim = fabric => pipe(
  occupiedCells,
  find(hasMultipleOccupants(fabric)),
  not
);

// nonOverlappingClaim :: List -> [Claims] -> Claim
const nonOverlappingClaim = fabric =>
  find(isNonOverlappingClaim(fabric));

// --- Go, go go!

const input = readFile(join(__dirname, 'claims.txt'));

const claims = inputToClaims(input);
const fabric = populateFabric(claims);
console.log('Overlapping area:', countOverlappingCells(fabric), 'sq.in.');
console.log('Non-overlapping claim id:', nonOverlappingClaim(fabric)(claims).id);
