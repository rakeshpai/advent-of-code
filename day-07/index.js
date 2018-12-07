const { join: pathJoin } = require('path');
const {
  addIndex, add, all, always, apply, applySpec, append,
  both, concat, converge, cond, countBy, curry, difference, equals,
  filter, flatten, flip, head, identity, ifElse, inc, includes, isNil,
  join, juxt, last, length, lensProp, lt, map, match, not, over, pipe, prop, range,
  reduce, reject, sortBy, split, sum, tail,
  toPairs, trim, uniq, until, view
} = require('ramda');
const { createReducer, readFile, trace } = require('../helpers');

// Node :: { id: String, child: String, parents: [String] }
// parseInput :: String -> [Node]
const parseInput = pipe(
  split('\n'),
  map(
    pipe(
      match(/Step (.*) must be finished before step (.*) can begin./),
      applySpec({
        id: prop('1'),
        child: prop('2')
      })
    )
  )
);

const id = prop('id');
const child = prop('child');

// parents :: [Node] -> Node -> [String]
const parents = flip((node, nodes) =>
  pipe(
    filter( pipe( child, equals(id(node))) ),
    map(id)
  )(nodes)
);

// isIn :: [a] -> a -> Boolean
const isIn = flip(includes);

// addParents :: [Node] -> [Node]
const addParents = nodes =>
  pipe(
    map(applySpec({ id, child, parents: parents(nodes) }))
  )(nodes)

// missingNodes :: [Node] -> [Node]
const missingNodes = pipe(
  converge(difference, [ map(child), map(id) ]),
  map(id => ({ id }))
);

// addMissingNodes :: [Node] -> [Node]
const addMissingNodes = converge(concat, [ identity, missingNodes ]);

// parentsAreDone :: [String] -> Node -> Boolean
const parentsAreDone = sequence => pipe(
  prop('parents'),
  map(isIn(sequence)),
  all(identity)
);

// availableTasks :: [Node] -> [String] -> [String]
const availableTasks = curry((nodes, sequence) =>
  pipe(
    filter(parentsAreDone(sequence)),
    map(id),
    uniq,
    filter(pipe(isIn(sequence), not)),
    sortBy(identity)
  )(nodes)
);

// nextTask :: [Node] -> [String] -> [String]
const nextTask = nodes => pipe(availableTasks(nodes), head);

// prepareInput :: String -> [Node]
const prepareInput = pipe(
  parseInput,
  addMissingNodes,
  addParents
);

// noMoreTasks :: [Node] -> [String] -> Boolean
const noMoreTasks = nodes => pipe(nextTask(nodes), not);

// performTask :: [Node] -> [String] -> [String]
const performTask = nodes => converge(append, [ nextTask(nodes), identity ]);

// part1 :: String -> String
const part1 = pipe(
  prepareInput,
  nodes => until(
    noMoreTasks(nodes),
    performTask(nodes)
  )([]),
  join('')
);

// timeForTask :: String -> Number
const timeForTask = task => task.charCodeAt(0) - 4;

// ElfTask :: { startTime: Number, task: String }
// TimesheetEntry :: { time: Number, elves: [ElfTask], done: [String] }

// elfTask :: Number -> String -> ElfTask
const elfTask = curry((startTime, task) => ({ startTime, task }));

const nextTaskIndex = lensProp('nextTaskIndex');
const appendElf = elf => over(lensProp('elves'), append(elf));
const incrementTaskIndex = over(nextTaskIndex, inc);

// assignTasks :: [String] -> TimesheetEntry -> [elfTask]
const assignTasks = (tasks, { time, elves }) => {
  if(!tasks.length) return elves;

  const getTask = pipe( view(nextTaskIndex), flip(prop)(tasks) );

  return pipe(
    reduce(
      createReducer(
        elf => cond([
          [always(!isNil(elf)), appendElf(elf)],
          [getTask, pipe(
            e => appendElf(elfTask(time, getTask(e)))(e),
            incrementTaskIndex
          )],
          [always(true), appendElf(null)]
        ])
      ),
      { nextTaskIndex: 0, elves: [] }
    ),
    prop('elves')
  )(elves);
};

// startChart :: Number -> TimesheetEntry
const startTimesheet = numElves => ({
  time: 0,
  elves: range(0, numElves).map(always(null)),
  done: []
});

// nextInterestingTime :: [ElfTask] -> Number
const nextInterestingTime = pipe(
  reject(isNil),
  map(converge(add, [ prop('startTime'), pipe(prop('task'), timeForTask) ])),
  apply(Math.min)
);

// markTasksCompleted :: TimesheetEntry -> TimesheetEntry
const markTasksCompleted = entry => {
  const completedTasks = [];

  const newElves = entry.elves.map(
    elf => {
      if(!elf) return null;
      if((entry.time - elf.startTime) === timeForTask(elf.task)) {
        completedTasks.push(elf.task);
        return null;
      }

      return elf;
    }
  );

  return {
    time: entry.time,
    elves: newElves,
    done: concat(entry.done, completedTasks)
  };
};

// inFlightTasks :: TimesheetEntry -> [String]
const inFlightTasks = pipe(
  prop('elves'),
  reject(isNil),
  map(prop('task'))
);

// isNotInFlight :: TimesheetEntry -> String -> Boolean
const isNotInFlight = timesheet => pipe( isIn(inFlightTasks(timesheet)), not );

const preventInfinity = (val1, val2) => isFinite(val2) ? val2 : val1;

// availableTasksPt2 :: [Node] -> TimesheetEntry -> [String]
const availableTasksPt2 = nodes => timesheet =>
  availableTasks(nodes, timesheet.done).filter(isNotInFlight(timesheet));

// allocateTasks :: [Node] -> TimesheetEntry -> TimesheetEntry
const allocateTasks = nodes => applySpec({
  time: prop('time'),
  elves: converge( assignTasks, [ availableTasksPt2(nodes), identity ] ),
  done: prop('done')
});

// advanceTime :: TimesheetEntry -> TimesheetEntry
const advanceTime = applySpec({
  time: converge(preventInfinity, [
    prop('time'),
    pipe( prop('elves'), nextInterestingTime)
  ]),
  elves: prop('elves'),
  done: prop('done')
});

// part2 :: Number -> String -> String
const part2 = numElves => pipe(
  prepareInput,
  nodes => until(
    both(
      pipe( prop('done'), noMoreTasks(nodes) ),
      pipe( prop('elves'), reject(isNil), length, equals(0) )
    ),
    pipe(
      markTasksCompleted,
      allocateTasks(nodes),
      advanceTime
    )
  )(startTimesheet(numElves)),
  prop('time')
);

const input = readFile(pathJoin(__dirname, 'instructions.txt')).trim();
console.log(part1(input));
console.log(part2(5)(input));
