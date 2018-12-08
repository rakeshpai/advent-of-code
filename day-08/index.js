// This didn't turn out to be idiomatic FP. :(
// Please forgive my stateful mutative imperative sins below.

const { join: pathJoin } = require('path');
const { dissoc, map, pick, pipe, range, split, sum } = require('ramda');
const { readFile } = require('../helpers');

const processData = remainder => {
  const numChildren = remainder[0];
  const numMetaData = remainder[1]

  remainder = remainder.slice(2);

  const children = range(0, numChildren)
    .map(() => {
      const newState = processData(remainder);
      remainder = newState.remainder;
      return pick([ 'metaData', 'children' ])(newState);
    });
  
  return {
    metaData: remainder.slice(0, numMetaData),
    remainder: remainder.slice(numMetaData),
    children,
  };
};

const createGraph = pipe(
  split(' '),
  map(Number),
  processData,
  dissoc('remainder')
);

const totalMetadata = graph =>
  sum(graph.children.map(totalMetadata).concat(graph.metaData));

const getValue = graph => {
  if(!graph.children.length) return sum(graph.metaData);

  return sum(graph.metaData.map(index => {
    if(index === 0) return 0;
    if(graph.children[index - 1]) return getValue(graph.children[index - 1]);
    return 0;
  }))
};

const input = readFile(pathJoin(__dirname, 'license.txt')).trim();
const graph = createGraph(input);
console.log('part 1:', totalMetadata(graph));
console.log('part 2:', getValue(graph));
