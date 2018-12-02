const { join } = require('path');
const { map, pipe, prop, split, until } = require('ramda');
const daggy = require('daggy');
const { Set } = require('immutable');
const { readFile, toInt } = require('../helpers');

const input = readFile(join(__dirname, 'codes.txt'));

// inputToArray :: String -> [Number]
const inputToArray = pipe(split('\n'), map(toInt));

// Impure! Returns the next input
// Hey, it's an excuse to use generators!
const getNextInput = (() => {
  const inputArray = inputToArray(input);

  const inputGenerator = (function*() {
    let currentIndex = 0;

    while(true) {
      yield inputArray[currentIndex];
      currentIndex = (currentIndex === inputArray.length - 1) ? 0 : currentIndex + 1;
    }
  })();

  return () => inputGenerator.next().value;
})();

const RunningResult = daggy.tagged('RunningResult', [ 'seenList', 'result' ]);
RunningResult.prototype.add = function(num) {
  return RunningResult(
    this.seenList.add(this.result),
    this.result + num
  );
};

// createRunningResult :: Number -> RunningResult
const createRunningResult = initialValue => RunningResult(Set(), initialValue);

// getFirstRepeat :: Number -> Number
const getFirstRepeat = pipe(
  createRunningResult,
  until(
    r => r.seenList.has(r.result),
    r => r.add(getNextInput())
  ),
  prop('result')
);

console.log(getFirstRepeat(0));
