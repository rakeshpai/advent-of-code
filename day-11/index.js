const { range } = require('ramda');

// This solution is just brute-force.
// Ramda slows things down quite a bit.
// Written in pure JS, to get max perf.

// Knowing that this was going to be trashing
// the CPU, I put in logs to see the progress
// and noticed that the hightest power level stops
// improving quickly.
// This implementation only tries the first 25
// possibilities, and finds the correct answer.
// Not ideal, but hey.

const hundredthsDigit = num => {
  if(num < 100) return 0;
  return Math.floor(num / 100) % 10;
};

const powerLevel = (serialNumber, x, y) => {
  return hundredthsDigit(((y * (x + 10)) + serialNumber) * (x + 10)) - 5;
};

const powerLevelInSize = (size, serialNumber) => cell => {
  let total = 0;
  for(let y = 0; y < size; y++) {
    for(let x = 0; x < size; x++) {
      total += powerLevel(serialNumber, cell.x + x, cell.y + y);
    }
  }

  return total;
}

const maxPowerLevel = (serialNumber, size) => {
  let maxLevel = { x: null, y: null, level: -Infinity };

  for(let y = 0; y < 300 - size; y++) {
    for(let x = 0; x < 300 - size; x++) {
      const level = powerLevelInSize(size, serialNumber)({ x, y });
      if(level > maxLevel.level) {
        maxLevel = { x, y, level };
      }
    }
  }

  return maxLevel;
};

const maxPowerLevelAcrossSizes = serialNumber => {
  let maxLevel = { x: null, y: null, size: null, level: -Infinity };

  for(let size = 0; size < 25; size ++) {
    const level = maxPowerLevel(serialNumber, size);
    if(level.level > maxLevel.level) {
      maxLevel = { ...level, size };
    }

    console.log(maxLevel, size);
  }

  return maxLevel;
};

const input = 1308;

console.log('Part 1', maxPowerLevel(input, 3));
console.log('Part 2', maxPowerLevelAcrossSizes(input));
