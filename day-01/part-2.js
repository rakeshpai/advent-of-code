const { readFileSync } = require('fs');
const path = require('path');
const { flip, last, map, pipe, prop, split, until } = require('ramda');
const daggy = require('daggy');

const input = readFileSync(path.join(__dirname, 'codes.txt')).toString('utf8');

const toInt = flip(parseInt)(10);
const inputToArray = pipe(split('\n'), map(toInt));

const inputGenerator = (function*(inputArray) {
  let currentIndex = 0;
  while(true) {
    yield inputArray[currentIndex];
    currentIndex = (currentIndex === inputArray.length - 1) ? 0 : currentIndex + 1;
  }
})(inputToArray(input));

const getNextInput = () => inputGenerator.next().value;

const RunningResult = daggy.tagged(
  'RunningResult',
  [ 'seenList', 'result', 'isResultSeen' ]
);

RunningResult.prototype.add = function(item) {
  console.log(this.result, item);
  const result = this.result + item;

  return RunningResult(
    [ ...this.seenList, result ],
    result,
    this.seenList.includes(result)
  );
};

const createRunningResult = initialValue => RunningResult([], initialValue, false);

const getFirstRepeat = pipe(
  until(prop('isResultSeen'), r => r.add(getNextInput())),
  prop('seenList'),
  last
);

console.log(getFirstRepeat(createRunningResult(0)));
