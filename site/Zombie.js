// Zombie-related code.

const Util = require('./Util');

// Zombie information by type, including attributes like speed and costume.
const ZombieTypes = [
  { type: "Crawler", probability: 2, hitPoints: 3, speedPxSec: 2, costumes: [ "crawler_", "vcrawlerzombie" ] },
  { type: "Shambler", probability: 10,  hitPoints: 5, speedPxSec: 10, costumes: [ "czombie_", "vnormalzombie" ] },
  { type: "Walker", probability: 10, hitPoints: 5, speedPxSec: 25, costumes: [ "czombie_", "vnormalzombie" ] },
  { type: "Runner", probability: 1, hitPoints: 10, speedPxSec: 65, costumes: [ "czombie_", "vnormalzombie" ] },
];

// Sound files for growls.
// CODESYNC: index.html keeps this list in 2 places.
const growlSounds = [
  'Sounds/ZombieGrowl1.mp3',
  'Sounds/ZombieGrowl2.mp3',
];

// Creates a map from a number in the range of 0..totalZombieProbability to the zombie type
// to use if that number is chosen randomly.
var totalZombieProbability = 0;
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
var zombieProbabilityMap = createZombieProbabilityNap();

const zombieMinTimeMsecBetweenGrowls = 8000;
const zombieGrowlProbabilityPerSec = 0.1;
var nextZombieNumber = 0;

function spawnZombie(level) {
  let zombieID = "z" + nextZombieNumber;
  nextZombieNumber++;

  let randomZombieNumber = Util.getRandomInt(0, totalZombieProbability);
  let zombieType = zombieProbabilityMap[randomZombieNumber];

  let zombie = {
    id: zombieID,

    // Place the player in a random location on the map.
    // TODO: Account for the contents of the underlying tile - only place zombies into locations that
    // make sense, or at map-specific spawn points.
    currentPosition: {
      x: Util.getRandomInt(32, level.widthPx - 32),
      y: Util.getRandomInt(32, level.widthPx - 32)
    },
    rotation: 0.0,  // TODO: Start in random direction
    health: zombieType.hitPoints,
    type: zombieType.type,
    costume: zombieType.costumes[Util.getRandomInt(0, zombieType.costumes.length)],
    lastGrowlTime: 0,  // Jan 1, 1970, meaning overdue to growl.
    growlCount: 0,  // Incremented whenever the zombie growls. Used by the client to know when to growl.
    growlSound: '',  // When growlCount is increased, this is the growl sound name to play.
  };

  return zombie;
}

// Called on the world update loop.
// currentTime is the current Unix epoch time (milliseconds since Jan 1, 1970).
function updateZombie(zombie, currentTime) {
  // Occasional growls. We tell all the clients to use the same growl sound.
  let msecSinceLastGrowl = currentTime - zombie.lastGrowlTime; 
  if (msecSinceLastGrowl > zombieMinTimeMsecBetweenGrowls) {
    let growlProbabilityInMsec = msecSinceLastGrowl * zombieGrowlProbabilityPerSec;
    if (Util.getRandomInt(0, msecSinceLastGrowl) < growlProbabilityInMsec) {
      zombie.growlSound = growlSounds[Util.getRandomInt(0, growlSounds.length)];
      zombie.growlCount++;
      zombie.lastGrowlTime = currentTime; 
    }
  }
}


// --------------------------------------------------------------------
// Exports
module.exports.spawnZombie = spawnZombie;
module.exports.updateZombie = updateZombie;
