const { join } = require('path');
const { readFile } = require('../helpers');
const {
  any, applySpec, converge, equals,
  map, multiply, pipe, prop, reduce, split
} = require('ramda');

const incrementCharacterCount = (characterCounts, character) => ({
  ...characterCounts,
  [character]: (characterCounts[character] || 0) + 1
});

// boxIdCounts :: String -> Object
const boxIdCounts = pipe(
  split(''),
  reduce(incrementCharacterCount, {})
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

const addMatches = (previousMatches, { twos, threes }) => ({
  twos: (previousMatches.twos || 0) + twos,
  threes: (previousMatches.threes || 0) + threes
});

// calculateChecksum :: String -> Number
const calculateChecksum = pipe(
  split('\n'),
  map(boxIdMatches),
  reduce(addMatches, {}),
  converge(multiply, [ prop('twos'), prop('threes') ])
);

const input = readFile(join(__dirname, 'box-ids.txt'));
console.log(calculateChecksum(input));
