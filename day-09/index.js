const {
  add, always, apply, converge, flip,
  ifElse, lensProp, lensPath, modulo,
  over, pipe, prop, range
} = require('ramda');
const { createReducer } = require('../helpers');

// Doubly-linked-list implementation
// This is mostly imperative/mutative :(
// They return sensible values though
// to help with composition

// Node :: { next: Node, previous: Node, value: Number }
// createNode :: Number -> Node
const createNode = value => ({
  value,
  previous: null,
  next: null
});

// insertAfter :: Node -> Node -> Node
const insertAfter = newNode => existingNode => {
  const oldNextNode = existingNode.next;
  existingNode.next = newNode;
  newNode.previous = existingNode;
  newNode.next = oldNextNode;
  oldNextNode.previous = newNode;
  return existingNode;
};

// removeNode :: Node -> Node
const removeNode = node => {
  node.previous.next = node.next;
  node.next.previous = node.previous;
  return node;
};

// goBack7 :: Node -> Node
const goBack7 = node => node.previous.previous.previous.previous.previous.previous;

// goForward2 :: Node -> Node
const goForward2 = node => node.next.next;

const playerIndex = flip(modulo);
const isRegularIteration = i => (i + 1) % 23 !== 0;

// Game: { node: Node, scores: [Number] }
// createGame :: Number -> Game
const createGame = playerCount => {
  let node = createNode(0);
  node.previous = node,
  node.next = node;

  return {
    node,
    scores: (new Array(playerCount)).fill(0)
  };
};

// addMarble :: Node -> Game -> Game
const addMarble = pipe(insertAfter, over(lensProp('node')));

// updateScore :: Number -> Game -> Game
const updateScore = iterationIndex => game =>
  over(
    lensPath([ 'scores', playerIndex(game.scores.length, iterationIndex) ]),
    add(iterationIndex + 1 + game.node.value),
    game
  );

// removeMarble :: Node -> Game -> Game
const removeMarble = over(lensProp('node'), removeNode);

// goForward2inGame :: Game -> Game
const goForward2inGame = over(lensProp('node'), goForward2);

// goBack7inGane :: Game -> Game
const goBack7inGane = over(lensProp('node'), goBack7);

// makeRegularMove :: Number -> Game -> Game
const makeRegularMove = iterationIndex => pipe(
  goForward2inGame,
  addMarble(createNode(iterationIndex + 1))
);

// makeRegularMove :: Number -> Game -> Game
const makeWeirdMove = iterationIndex => pipe(
  goBack7inGane,
  updateScore(iterationIndex),
  removeMarble
);

// isRegularMove :: Number -> () -> Boolean
const isRegularMove = iterationIndex =>
  always(isRegularIteration(iterationIndex))

// makeMove :: Number -> Game -> Game
const makeMove = converge(
  ifElse,
  [ isRegularMove, makeRegularMove, makeWeirdMove ]
);

const runGame = input =>
  range(0, input.lastMarble)
    .reduce( createReducer(makeMove), createGame(input.playerCount) );

const highScore = pipe(
  runGame, prop('scores'), apply(Math.max)
);

const input = { playerCount: 466, lastMarble: 7143600 };
// const input = { playerCount: 13, lastMarble: 7999 };
// const input = { playerCount: 9, lastMarble: 25 };

console.log('Highest score:', highScore(input));
