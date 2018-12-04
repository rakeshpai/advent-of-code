const { join } = require('path');
const {
  add, applySpec, assoc, compose,
  converge, defaultTo, filter, find,
  flatten, groupBy, head, identity,
  inc, into, isNil, last, lensProp, map,
  match, multiply, not, over, path, pipe,
  prop, propSatisfies, range, reduce,
  set, sortBy, startsWith, unless
} = require('ramda');
const leftPad = require('left-pad');
const { addHours } = require('date-fns/fp');
const { createReducer, readFile, switchCase } = require('../helpers');

// parseLogLine :: String -> Object
const parseLogLine = pipe(
  match(/\[((.*)\s(.*):(.*))\] (.*)/),
  applySpec({
    input: prop('0'),
    date: pipe(prop('1'), d => new Date(d)),
    day: prop('2'),
    hours: prop('3'),
    minutes: pipe(prop('4'), Number),
    log: prop('5')
  })
);

// isGuardLog :: String -> Boolean
const isGuardLog = startsWith('Guard #');

// isSleepLog :: String -> Boolean
const isSleepLog = compose(not, isGuardLog);

// extractGuardId :: [String] -> String
const extractGuardId = pipe(
  into('', compose(
    map(prop('log')),
    find(isGuardLog),
  )),
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

// addGroupingKey :: Object -> Object
const addGroupingKey = converge(
  set(lensProp('groupKey')),
  [
    pipe(
      prop('date'),
      addHours(1),
      dt => `${dt.getFullYear()}-${leftPad(dt.getMonth() + 1, 2, '0')}-${leftPad(dt.getDate(), 2, '0')}`
    ),
    identity
  ]
);

// DailySleepLog :: Object
// process :: String -> [DailySleepLog]
const process = pipe(
  into({}, compose(
    map(parseLogLine),
    map(addGroupingKey),
    groupBy(prop('groupKey'))
  )),
  Object.entries,
  map(applySpec({
    day: head,
    guardId: pipe(last, extractGuardId),
    sleepingMinutes: pipe(last, getSleepingMinutes),
  }))
);

// GuardSleepLog :: Object
// sleepLogByGuard :: [DailySleepLog] -> [GuardSleepLog]
const sleepLogByGuard = pipe(
  groupBy(prop('guardId')),
  Object.entries,
  map(applySpec({
    guardId: head,
    entries: last,
    totalHours: pipe(
      last,
      reduce(
        createReducer( pipe(path(['sleepingMinutes', 'length']), add) ),
        0
      )
    )
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
  into([], compose(
    map( converge(assoc('guardId'), [ prop('guardId'), mostSleptMinute ]) ),
    filter(pipe(prop('count'), isNil, not)),
  )),
  sortBy(prop('count')),
  last,
  converge(multiply, [ prop('guardId'), prop('minute') ])
);

const input = readFile(join(__dirname, 'logs.txt')).trim().split('\n');
const processed = process(input);

console.log('Strategy 1:', strategy1(processed));
console.log('Strategy 2:', strategy2(processed));
