const { readFileSync } = require('fs');
const { flip, pipe, trim } = require('ramda');

// readFile :: String -> String
exports.readFile = pipe(
  readFileSync,
  f => f.toString('utf8'),
  trim
);

// toInt :: a -> Number
exports.toInt = flip(parseInt)(10);

// trace :: a -> a
exports.trace = (...args) => value => console.log(...args, value) || value;
