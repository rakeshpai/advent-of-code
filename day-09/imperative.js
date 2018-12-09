const { range } = require('ramda');

const playerCount = 466;
const lastMarble = 7143600;
// const playerCount = 13;
// const lastMarble = 7999;
// const playerCount = 9;
// const lastMarble = 25;

const scores = (new Array(playerCount)).fill(0);

// Node :: { next: Node, previous: Node, value: Number }
// createNode :: value -> Node
const createNode = value => ({
  value,
  previous: null,
  next: null
});

const insertAfter = (node1, node2) => {
  const oldNext = node1.next;
  node1.next = node2;
  node2.previous = node1;
  node2.next = oldNext;
  oldNext.previous = node2;
};

const removeNode = node => {
  node.previous.next = node.next;
  node.next.previous = node.previous;
};

const goBack7 = node => node.previous.previous.previous.previous.previous.previous;

const playerIndex = i => i % playerCount;
const isRegularIteration = i => (i + 1) % 23 !== 0;

// Create a self-referential starting node
const createStartingNode = () => {
  let currentNode = createNode(0);
  currentNode.previous = currentNode,
  currentNode.next = currentNode;
  return currentNode;
};

range(0, lastMarble)
  .reduce(
    (currentNode, iterationIndex) => {
      if(isRegularIteration(iterationIndex)) {
        currentNode = currentNode.next.next;
        const newNode = createNode(iterationIndex + 1);
        insertAfter(currentNode, newNode);
      } else {
        scores[playerIndex(iterationIndex)] += iterationIndex + 1;
        currentNode = goBack7(currentNode);
        scores[playerIndex(iterationIndex)] += currentNode.value;
        removeNode(currentNode);
      }
    
      return currentNode;
    },
    createStartingNode()
  );


console.log('Highest score:', Math.max.apply(Math, scores));
