const { join } = require('path');
const { readFile, toInt } = require('../helpers');
const { add, map, pipe, reduce, split } = require('ramda');

const getResult = pipe(
  split('\n'),
  map(toInt),
  reduce(add, 0)
);
  
const input = readFile(join(__dirname, 'codes.txt'));
console.log(getResult(input));
