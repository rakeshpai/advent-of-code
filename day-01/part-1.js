const { readFileSync } = require('fs');
const path = require('path');
const { add, flip, map, pipe, reduce, split } = require('ramda');

const toInt = flip(parseInt)(10);

const getResult = pipe(
  split('\n'),
  map(toInt),
  reduce(add, 0)
);
  
const input = readFileSync(path.join(__dirname, 'codes.txt')).toString('utf8');
console.log(getResult(input));
