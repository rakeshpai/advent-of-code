const { join } = require('path');
const {
  add, applySpec, allPass, assoc, compose,
  converge, curry, defaultTo, equals, filter, find,
  flatten, flip, fromPairs, groupBy, head, identity,
  inc, invoker, into, isNil, last, length, lensProp, map,
  match, multiply, not, over, pair, path, pathEq, pipe,
  prop, propSatisfies, range, reduce, replace,
  set, sortBy, startsWith, toUpper, unless, until
} = require('ramda');
const { List } = require('immutable');
const { tagged } = require('daggy');
const { createReducer, readFile, switchCase, trace } = require('../helpers');

const fromCharCode = x => String.fromCharCode(x);
const charToRegex = c => new RegExp(`((${c}${toUpper(c)})|(${toUpper(c)}${c}))`, 'g');

const charCodes = range(97, 123);
const charCodesToRegex = map( pipe(fromCharCode, charToRegex) );

// doAPass :: String -> String
const doAPass = flip(
  reduce(createReducer(flip(replace)('')))
)(charCodesToRegex(charCodes));

// doAPassWithChangeTracking :: String -> { result: String, changed: Boolean }
const doAPassWithChangeTracking = converge(
  (oldLength, result) => ({ result, changed: oldLength !== result.length }),
  [ length, doAPass ]
);

// reactPolymers :: String -> String
const reactPolymers = pipe(
  doAPassWithChangeTracking,
  until(
    pipe(prop('changed'), not),
    pipe(prop('result'), doAPassWithChangeTracking)
  ),
  prop('result')
);

const charRemoverRegex = char => new RegExp(`[${char}${toUpper(char)}]`, 'g');

// removeUnit :: Char -> String -> String
const removeUnit = pipe(charRemoverRegex, flip(replace)(''));

// removeUnitReactAndGetLength :: Char -> String -> Number
const removeUnitReactAndGetLength = char => pipe(
  removeUnit(char),
  reactPolymers,
  length
);

// removedReactionLengthFns :: [Char] -> [(String -> Number)]
const removedReactionLengthFns = map(
  pipe(fromCharCode, removeUnitReactAndGetLength)
);

// shortestPolymerLength :: String -> Number
const shortestPolymerLength = converge(Math.min, removedReactionLengthFns(charCodes));

const input = readFile(join(__dirname, 'polymer.txt')).trim();

console.log(reactPolymers(input).length);
console.log(shortestPolymerLength(input));
