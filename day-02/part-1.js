const { join } = require('path');
const { createReducer, incrementProp, readFile } = require('../helpers');
const {
  add, any, applySpec, converge, defaultTo, equals, lensProp,
  map, multiply, over, pipe, prop, reduce, split
} = require('ramda');

// boxIdCounts :: String -> Object
const boxIdCounts = pipe(
  split(''),
  reduce(createReducer(incrementProp), {})
);

// hasCount :: Number -> Object -> Boolean
const hasCount = count => pipe(
  Object.values,
  any(equals(count))
);

// countMatches :: Object -> { twos: Boolean, threes: Boolean }
const countMatches = applySpec({ twos: hasCount(2), threes: hasCount(3) });

// boxIdMatches :: String -> { twos: Boolean, threes: Boolean }
const boxIdMatches = pipe(boxIdCounts, countMatches);

// addToPropWithDefault :: String -> Number -> Object -> Object
const addToPropWithDefault = (prop, num) =>
  over(lensProp(prop), pipe(defaultTo(0), add(num)))

const addMatches = createReducer(
  ({ twos, threes }) => pipe(
    addToPropWithDefault('twos', twos),
    addToPropWithDefault('threes', threes)
  )
);

// calculateChecksum :: String -> Number
const calculateChecksum = pipe(
  split('\n'),
  map(boxIdMatches),
  reduce(addMatches, {}),
  converge(multiply, [ prop('twos'), prop('threes') ])
);

const input = readFile(join(__dirname, 'box-ids.txt'));
console.log(calculateChecksum(input));
