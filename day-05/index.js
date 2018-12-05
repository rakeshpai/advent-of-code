const { join } = require('path');
const {
  converge, flip, length, map,
  not, pipe, prop, range, reduce,
  replace, toUpper, until
} = require('ramda');
const { createReducer, readFile } = require('../helpers');

// charCodes :: [Number]
const charCodes = range(97, 123);

// fromCharCode :: Number -> Char
const fromCharCode = x => String.fromCharCode(x);

// reactionRegex :: Char -> RegExp
const reactionRegex = c => new RegExp(`((${c}${toUpper(c)})|(${toUpper(c)}${c}))`, 'g');

// charCodesToReactionRegExps :: [Number] -> [RegExp]
const charCodesToReactionRegExps = map( pipe(fromCharCode, reactionRegex) );

// doAPass :: String -> String
const doAPass = flip(
  reduce(createReducer(flip(replace)('')))
)(charCodesToReactionRegExps(charCodes));

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

// reactedPolymerLength :: String -> Number
const reactedPolymerLength = pipe(reactPolymers, length);

// charRemoverRegex :: Char -> RegExp
const charRemoverRegex = char => new RegExp(`[${char}${toUpper(char)}]`, 'g');

// removeUnit :: Char -> String -> String
const removeUnit = pipe(charRemoverRegex, flip(replace)(''));

// removeUnitReactAndGetLength :: Char -> String -> Number
const removeUnitReactAndGetLength = char => pipe(
  removeUnit(char), reactedPolymerLength
);

// removedReactionLengthFns :: [Char] -> [(String -> Number)]
const removedReactionLengthFns = map(
  pipe(fromCharCode, removeUnitReactAndGetLength)
);

// shortestPolymerLength :: String -> Number
const shortestPolymerLength = converge(Math.min, removedReactionLengthFns(charCodes));

const input = readFile(join(__dirname, 'polymer.txt')).trim();

console.log(reactedPolymerLength(input));
console.log(shortestPolymerLength(input));
