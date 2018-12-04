const { join } = require('path');
const { readFile } = require('../helpers');
const { add, map, pipe, reduce, split } = require('ramda');

const getResult = pipe(
  split('\n'),
  map(Number),
  reduce(add, 0)
);
  
const input = readFile(join(__dirname, 'codes.txt'));
console.log(getResult(input));
