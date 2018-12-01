const { join } = require('path');
const { map, pipe, prop, split, until } = require('ramda');
const daggy = require('daggy');
const { readFile, toInt } = require('../helpers');

const input = readFile(join(__dirname, 'codes.txt'));

// inputToArray :: String -> [Number]
const inputToArray = pipe(split('\n'), map(toInt));

const inputGenerator = (function*(inputArray) {
  let currentIndex = 0;

  while(true) {
    yield inputArray[currentIndex];
    currentIndex = (currentIndex === inputArray.length - 1) ? 0 : currentIndex + 1;
  }
})(inputToArray(input));

const getNextInput = () => inputGenerator.next().value;

const RunningResult = daggy.tagged('RunningResult', [ 'seenList', 'result' ]);
RunningResult.prototype.add = function(num) {
  return RunningResult(
    [ ...this.seenList, this.result ],  // I suspect this is what's taking time
    this.result + num
  );
};

// createRunningResult :: Number -> RunningResult
const createRunningResult = initialValue => RunningResult([], initialValue);

// getFirstRepeat :: Number -> Number
const getFirstRepeat = pipe(
  createRunningResult,
  until(
    r => r.seenList.includes(r.result),
    r => r.add(getNextInput())
  ),
  prop('result')
);

console.log('This will take a couple of minutes...');
console.time('totalTime');
console.log(getFirstRepeat(0));
console.timeEnd('totalTime');
