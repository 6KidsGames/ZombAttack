// Zombie-related code.

const Physics = require('./Physics');
const Util = require('./Util');
const Log = require('./Log');

// Reduce transmission sizes by sending only integers over the wire, mapped to costume names.
// CODESYNC: Numeric values are mapped in index.html back to costume names.
const ZombieCostumeIDs = {
  "crawler_": 0,
  "vcrawlerzombie": 1,
  "czombie_": 2,
  "vnormalzombie": 3,
};

// Zombie information by type, including attributes like speed and costume.
const ZombieTypes = [
  { type: "Crawler", probability: 2, hitPoints: 3, speedPxSec: 2, costumes: [ "crawler_", "vcrawlerzombie" ] },
  { type: "Shambler", probability: 10,  hitPoints: 5, speedPxSec: 10, costumes: [ "czombie_", "vnormalzombie" ] },
  { type: "Walker", probability: 10, hitPoints: 5, speedPxSec: 25, costumes: [ "czombie_", "vnormalzombie" ] },
  { type: "Runner", probability: 1, hitPoints: 10, speedPxSec: 65, costumes: [ "czombie_", "vnormalzombie" ] },
];

// Sound file references for growls.
// CODESYNC: index.html keeps the opposing list in 2 places.
const numGrowlSounds = 2;

// Creates a map from a number in the range of 0..totalZombieProbability to the zombie type
// to use if that number is chosen randomly.
let totalZombieProbability = 0;
function createZombieProbabilityNap() {
  let probMap = { };
  let currentProb = 0;
  ZombieTypes.forEach(zombieType => {
    totalZombieProbability += zombieType.probability;
    for (let i = 0; i < zombieType.probability; i++) {
      probMap[currentProb] = zombieType;
      currentProb++;
    }
  });
  return probMap;
}
const zombieProbabilityMap = createZombieProbabilityNap();

const zombieMinTimeMsecBetweenGrowls = 12 * 1000;
const zombieGrowlProbabilityPerSec = 0.05;
const maxOutstandingGrowls = 1;
const outstandingGrowlTimeWindowMsec = 6000;
let previousGrowlTimes = createInitialGrowlTimes();
let nextZombieNumber = 0;

function spawnZombie(level, currentTime) {
  let zombieID = nextZombieNumber;
  nextZombieNumber++;

  let x = Util.getRandomInt(32, level.widthPx - 32);
  let y = Util.getRandomInt(32, level.heightPx - 32);

  let randomZombieNumber = Util.getRandomInt(0, totalZombieProbability);
  let zombieType = zombieProbabilityMap[randomZombieNumber];

  // A ZombieInfo is the server-side data structure containing all needed server tracking information.
  // Only a subset of this information is passed to the clients, to minimize wire traffic.
  let zombieInfo = {
    modelCircle: Physics.circle(x + 16, y + 16, 16),
    lastGrowlTime: currentTime,
    lastBiteTime: currentTime,
    type: zombieType.type,

    // The portion of the data structure we send to the clients.
    zombie: {
      id: zombieID,

      // Place the player in a random location on the map.
      // TODO: Account for the contents of the underlying tile - only place zombies into locations that
      // make sense, or at map-specific spawn points.
      x: x,
      y: y,
      dir: 0.0,  // TODO: Start in random direction
      hl: zombieType.hitPoints,
      cstm: ZombieCostumeIDs[zombieType.costumes[Util.getRandomInt(0, zombieType.costumes.length)]],
      growl: 0,  // When growlC (growlCount) is increased, this is the growl sound index to play.
      growlC: 0,  // Incremented whenever the zombie growls. Used by the client to know when to growl.
    }
  };

  return zombieInfo;
}

// Called on the world update loop.
// currentTime is the current Unix epoch time (milliseconds since Jan 1, 1970).
function updateZombie(zombieInfo, currentTime) {
  // Occasional growls. We tell all the clients to use the same growl sound to get a nice
  // echo effect if people are playing in the same room.
  // We also limit to at most a couple of growls started in a sliding time window, to
  // avoid speaker and CPU overload at the client. 
  let msecSinceLastGrowl = currentTime - zombieInfo.lastGrowlTime; 
  if (msecSinceLastGrowl > zombieMinTimeMsecBetweenGrowls) {
    let growlProbabilityInMsec = msecSinceLastGrowl * zombieGrowlProbabilityPerSec;
    if (Util.getRandomInt(0, msecSinceLastGrowl) < growlProbabilityInMsec) {
      if (registerGrowl(currentTime)) {
        let zombie = zombieInfo.zombie;
        zombie.growl = Util.getRandomInt(0, numGrowlSounds);
        zombie.growlC++;
        zombieInfo.lastGrowlTime = currentTime;
      } 
    }
  }
}

// Returns true and registers the current time in the global sliding time window if we are able to
// emit a growl at this time, based on the sliding time window and max outstanding growls.
function registerGrowl(currentTime) {
  // Latest growl times are at the end of the array. Check the last time in the array and see if we can pop it.
  if ((currentTime - previousGrowlTimes[previousGrowlTimes.length - 1]) >= outstandingGrowlTimeWindowMsec) {
    previousGrowlTimes.pop();  // Remove old entry at end.
    previousGrowlTimes.unshift(currentTime);  // Add new entry at beginning.
    return true;
  }
  return false;
}

function isBiting(zombieInfo, playerInfo, currentTime) {
  let msecSinceLastBite = currentTime - zombieInfo.lastBiteTime;
  if (msecSinceLastBite >= 1000) {
    if (Physics.hitTestCircles(playerInfo.modelCircle, zombieInfo.modelCircle)) {
      Log.debug(`Z${zombieInfo.zombie.id}: Biting ${playerInfo.player.id}`);
      zombieInfo.lastBiteTime = currentTime;
      return true;
    }
  }
  return false;
}

function createInitialGrowlTimes() {
  let a = [];
  for (let i = 0; i < maxOutstandingGrowls; i++) {
    a.push(0);
  }
  return a;
}


// --------------------------------------------------------------------
// Exports
module.exports.spawnZombie = spawnZombie;
module.exports.updateZombie = updateZombie;
module.exports.isBiting = isBiting;
