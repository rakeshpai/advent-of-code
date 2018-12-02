const { join: pathJoin } = require('path');
const { readFile } = require('../helpers');
const {
  always, apply, converge, equals, filter,
  head, identity, ifElse, join, map, length,
  pipe, reject, split, take, zip, zipWith
} = require('ramda');

// stringToArray :: String -> [Char]
const stringToArray = split('');

// isMatchingBoxIds :: String -> String -> Boolean
const isMatchingBoxIds = aBoxId => pipe(
  converge(zipWith(equals), [ always(stringToArray(aBoxId)), stringToArray ]),
  reject(identity),
  length,
  equals(1)
);

const matchFinder = (boxId, index, boxIds) => {
  if(index === 0) return false;

  const subset = take(index, boxIds);
  const match = subset.find(isMatchingBoxIds(boxId));

  return match ? [ boxId, match ] : false;
};

// findMatches :: [String] -> [[String, String]]
const findMatches = a => a.map(matchFinder);

// findMatch :: [String] -> [String]
const findMatch = pipe(findMatches, filter(identity), head);

// dropDifference :: [String] -> String
const dropDifference = pipe(
  map(stringToArray),
  apply(zip),
  map( ifElse(apply(equals), head, always(false)) ),
  filter(identity),
  join('')
);

// commonLetters :: [String] -> String
const commonLetters = pipe(findMatch, dropDifference);

const input = readFile(pathJoin(__dirname, 'box-ids.txt')).split('\n');
console.log(commonLetters(input));
