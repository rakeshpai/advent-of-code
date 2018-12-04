const { join } = require('path');
const {
  add, applySpec, assoc, converge, defaultTo,
  filter, find, flatten, groupBy, head, inc,
  isNil, last, lensProp, map, match, multiply,
  not, over, pipe, prop, propSatisfies, range,
  reduce, sortBy, startsWith, unless
} = require('ramda');
const leftPad = require('left-pad');
const { createReducer, readFile, switchCase, toInt, trace } = require('../helpers');

// parseLogLine :: String -> Object
const parseLogLine = pipe(
  match(/\[((.*)\s(.*):(.*))\] (.*)/),
  applySpec({
    input: prop('0'),
    date: pipe(prop('1'), d => new Date(d)),
    day: prop('2'),
    hours: prop('3'),
    minutes: pipe(prop('4'), toInt),
    log: prop('5')
  })
);

// isGuardLog :: String -> Boolean
const isGuardLog = startsWith('Guard #');

// isSleepLog :: String -> Boolean
const isSleepLog = pipe(isGuardLog, not);

// extractGuardId :: [String] -> String
const extractGuardId = pipe(
  map(prop('log')),
  find(isGuardLog),
  match(/Guard #(\d+)/),
  prop('1')
);

// getSleepingMinutes :: [String] -> [Number]
const getSleepingMinutes = pipe(
  filter(propSatisfies(isSleepLog, 'log')),
  sortBy(prop('minutes')),
  reduce(
    createReducer(
      line => switchCase({
        'falls asleep': assoc('lastSleepMinute', line.minutes),
        'wakes up': acc => ({
          ...acc,
          sleepingMinutes: [ ...acc.sleepingMinutes, ...range(acc.lastSleepMinute, line.minutes) ]
        })
      }, null, line.log)
    ),
    { sleepingMinutes: [] }
  ),
  prop('sleepingMinutes')
);

// processDay :: [String, Object] -> Object
const processDay = applySpec({
  day: head,
  guardId: pipe(last, extractGuardId),
  sleepingMinutes: pipe(last, getSleepingMinutes),
});

// createGroupingDateString :: Object -> Object
const addGroupingKey = line => {
  const dt = new Date(line.date);
  dt.setHours(dt.getHours() + 1); // Guard might begin shift on the previous day

  return {
    ...line,
    groupKey: `${dt.getFullYear()}-${leftPad(dt.getMonth() + 1, 2, '0')}-${leftPad(dt.getDate(), 2, '0')}`
  };
};

// DailySleepLog :: Object
// process :: String -> [DailySleepLog]
const process = pipe(
  map(parseLogLine),
  map(addGroupingKey),
  groupBy(prop('groupKey')),
  Object.entries,
  map(processDay)
);

// GuardSleepLog :: Object
// sleepLogByGuard :: [DailySleepLog] -> [GuardSleepLog]
const sleepLogByGuard = pipe(
  groupBy(prop('guardId')),
  Object.entries,
  map(applySpec({
    guardId: head,
    totalHours: pipe(
      last,
      reduce(createReducer(({ sleepingMinutes }) => add(sleepingMinutes.length)), 0)
    ),
    entries: last
  })),
);

// guardThatSleepsTheMost :: [DailySleepLog] -> GuardSleepLog
const guardThatSleepsTheMost = pipe(
  sleepLogByGuard,
  sortBy(prop('totalHours')),
  last
);

// sleepFrequencyByMinute :: GuardSleepLog -> Object
const sleepFrequencyByMinute = pipe(
  prop('entries'),
  map(prop('sleepingMinutes')),
  flatten,
  reduce( createReducer(minute => over(lensProp(minute), pipe(defaultTo(0), inc))), {} )
);

// mostSleptMinute :: GuardSleepLog -> Number | undefined
const mostSleptMinute = pipe(
  sleepFrequencyByMinute,
  Object.entries,
  sortBy(last),
  last,
  unless(
    isNil,
    applySpec({
      minute: head,
      count: last
    })
  )
);

// strategy1 :: [DailySleepLog] -> Number
const strategy1 = pipe(
  guardThatSleepsTheMost,
  converge(multiply, [ prop('guardId'), pipe(mostSleptMinute, prop('minute')) ])
);

// strategy2 :: [DailySleepLog] -> Number
const strategy2 = pipe(
  sleepLogByGuard,
  map( converge(assoc('guardId'), [ prop('guardId'), mostSleptMinute ]) ),
  filter(pipe(prop('count'), isNil, not)),
  sortBy(prop('count')),
  last,
  converge(multiply, [ prop('guardId'), prop('minute') ])
);

const input = readFile(join(__dirname, 'logs.txt')).trim().split('\n');
const processed = process(input);

console.log('Strategy 1:', strategy1(processed));
console.log('Strategy 2:', strategy2(processed));
