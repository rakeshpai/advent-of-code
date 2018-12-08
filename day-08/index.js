const { join: pathJoin } = require('path');
const {
  add, all, always, apply, applySpec, append,
  both, concat, converge, cond, curry,
  difference, equals, filter, flip, head,
  identity, inc, includes, isNil, join,
  length, lensProp, map, match, not, over, pick,
  pipe, prop, range, reduce, reject, sortBy,
  slice, split, sum, uniq, until, view
} = require('ramda');
const { createReducer, readFile, trace } = require('../helpers');

const index = prop;

// State :: { metaData: [Number], remainder: [Number] }

const remainder = prop('remainder');
const metaData = prop('metaData');

const numChildren = pipe(remainder, index(0));
const numMetaData = pipe(remainder, index(1));

const leafOwnMetaData = state =>
  remainder(state).slice(2, numMetaData(state) + 2);

const leafMetaData = converge( concat, [ metaData, leafOwnMetaData ] );

const leafRemainder = state =>
  remainder(state).slice(numMetaData(state) + 2)

const leafNode = applySpec({
  type: always('leaf'),
  metaData: leafMetaData,
  remainder: leafRemainder,
  ownMetaData: leafMetaData
});

const emptyParentNode = applySpec({
  type: always('parent'),
  metaData,
  remainder: pipe(remainder, slice(2, Infinity)),
  children: always([]),
  ownMetaData: always([])
});

const parentOwnMetaData = numMetaData => state =>
  remainder(state).slice(0, numMetaData);

const nodeMetaData = numMetaData => state =>
  metaData(state).concat(parentOwnMetaData(numMetaData)(state));

const nodeRemainder = numMetaData => state =>
  remainder(state).slice(numMetaData);

const appendChild = numMetaData => state => {
  return [
    ...(state.children || []),
    pick([ 'ownMetaData', 'children', 'type' ], state)
  ];
};

const node = numMetaData => applySpec({
  metaData: nodeMetaData(numMetaData),
  ownMetaData: parentOwnMetaData(numMetaData),
  remainder: nodeRemainder(numMetaData),
  children: appendChild(numMetaData)
});

const processData = state => {
  if(numChildren(state) === 0) return leafNode(state);

  return pipe(
    reduce( processData, emptyParentNode(state) ),
    node(numMetaData(state)),
  )(range(0, numChildren(state)))
};

const process = pipe(
  split(' '),
  map(Number),
  applySpec({
    metaData: always([]),
    remainder: identity,
    value: 0
  }),
  processData,
);

const part1 = pipe(
  prop('metaData'),
  sum
);

// const input = readFile(pathJoin(__dirname, 'license.txt')).trim();
const input = `2 3 0 3 10 11 12 1 1 0 1 99 2 1 1 2`;
const processed = process(input);
console.log('result', part1(processed));
