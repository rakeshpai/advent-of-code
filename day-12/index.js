const { join } = require('path');
const {
  addIndex, add, always, apply, applySpec,
  ascend, converge, contains, countBy, descend, equals,
  filter, flatten, flip, fromPairs, head, identity, ifElse,
  juxt, last, length, lensProp, lt, map, over, pipe, prop, range,
  reject, sort, split, sum, tail,
  toPairs, trim, uniq
} = require('ramda');
const { readFile } = require('../helpers');

const padding = 150;

// parseInitialState :: String -> String
const parseInitialState = pipe(
  split(':'),
  prop(1),
  trim
);

// Rules :: { k: v }  <- eg. { '...#.': '#', ... }
// parseRules :: [String] -> Rules
const parseRules = pipe(
  map(pipe(
    split(' '),
    applySpec([ prop(0), prop(2) ]),
  )),
  fromPairs
);

// parseInput :: String -> Object
const parseInput = input => {
  const lines = input.split('\n');

  return {
    initialState: parseInitialState(lines[0]),
    rules: parseRules(lines.slice(2))
  }
};

// padInput :: String -> String
const padInput = input => (
  (new Array(padding)).fill('.').join('') +
  input +
  (new Array(padding)).fill('.').join('')
);

// nextGeneration :: Rules -> String -> String
const nextGeneration = rules => previousGeneration => {
  let nextGen = '..';
  range(2, previousGeneration.length - 2).forEach(index => {
    const key = previousGeneration.slice(index - 2, index + 3);
    nextGen += rules[key] || '.';
  });

  return nextGen + '..';
};

// score :: String -> Number
const score = state => range(-padding, state.length - padding).reduce(
  (acc, index) => acc + (state.charAt(index+padding) === '#' ? index : 0),
  0
);

// --

// Part 2 isn't solvalble iteratively, because 50 billion.
// I noticed a pattern by generation 100 which just kept
// walking to the right. After that, I solved it manually
// in the REPL. I've replicated the calculations here.

const input = readFile(join(__dirname, 'pots.txt')).trim();
const { initialState, rules } = parseInput(input);

let currentState = padInput(initialState);
let score99;
let score100;

range(0, 100).forEach(index => {
  currentState = nextGeneration(rules)(currentState);
  if(index === 19) console.log('Part 1:', score(currentState));
  if(index === 98) score99 = score(currentState);
  if(index === 99) score100 = score(currentState);
});

// There are 22 #s remaining at generation 100, so every
// subsequent generation simply adds 22 to the previous
// generation.

const difference = score100 - score99;
console.log('Part 2:', score100 + (difference*(50000000000 - 100)));
