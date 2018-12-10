const { readFileSync } = require('fs');
const {
  applySpec, curry, converge, defaultTo,
  inc, identity, lensProp, merge, over,
  pipe, tap, trim
} = require('ramda');

// readFile :: String -> String
exports.readFile = pipe(
  readFileSync,
  f => f.toString('utf8'),
  trim
);

// trace :: b -> a -> a
exports.trace = (...args) => tap(x => console.log(...args, x));

// createReducer :: (b -> a -> a) -> ((a, b) -> a)
exports.createReducer = fn => (acc, val) => curry(fn)(val)(acc);

// switchCase :: { k: fn, ... } -> b -> k -> a -> fn(a) | b
exports.switchCase = curry(
  (cases, def, caseName, a) =>
    cases[caseName] ? cases[caseName](a): def
);

// incrementProp :: String -> Object -> Object
exports.incrementProp = prop => over(lensProp(prop), pipe( defaultTo(0), inc ));

// mergeSpec :: { k: fn, ... } -> a -> { k: fn(a), ... }
exports.mergeSpec = spec => converge(merge, [ identity, applySpec(spec)]);

exports.time = key => tap(() => console.time(key));
exports.timeEnd = key => tap(() => console.timeEnd(key));
