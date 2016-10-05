// Zombie-related code.

const Physics = require('./Physics');
const Util = require('./Util');
const Log = require('./Log');
const Level = require('./Level');

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
  { type: "Crawler", probability: 10, hitPoints: 3, speedPxFrame: 1, costumes: [ "crawler_", "vcrawlerzombie" ] },
  { type: "Shambler", probability: 10,  hitPoints: 5, speedPxFrame: 3, costumes: [ "czombie_", "vnormalzombie" ] },
  { type: "Walker", probability: 10, hitPoints: 5, speedPxFrame: 5, costumes: [ "czombie_", "vnormalzombie" ] },
  { type: "Runner", probability: 10, hitPoints: 10, speedPxFrame: 10, costumes: [ "czombie_", "vnormalzombie" ] },
];

// Sound file references for growls.
// CODESYNC: index.html keeps the opposing list in 2 places.
const numGrowlSounds = 2;
const numHurtSounds = 1;

const zombieMaxTurnPerFrameRadians = 0.4;
const zombieHurtPauseMsec = 500;
const zombieDeadLingerMsec = 300;

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
    modelCircle: Physics.circle(x, y, 16),
    lastGrowlTime: currentTime,
    lastBiteTime: currentTime,
    lastHurtTime: 0,
    dead : false,
    deadAt: 0,
    type: zombieType,

    // The portion of the data structure we send to the clients.
    zombie: {
      id: zombieID,

      // Place the zombie in a random location on the map.
      // TODO: Account for the contents of the underlying tile - only place zombies into locations that
      // make sense, or at map-specific spawn points.
      x: x,
      y: y,
      dir: Util.getRandomFloat(0, 2 * Math.PI),
      hl: zombieType.hitPoints,
      cstm: ZombieCostumeIDs[zombieType.costumes[Util.getRandomInt(0, zombieType.costumes.length)]],
      growl: 0,  // When growlC (growlCount) is increased, this is the growl sound index to play.
      growlC: 0,  // Incremented whenever the zombie growls. Used by the client to know when to growl.
      hurt: 0,  // When huttC (hurtCount) is increased, this is the hurt sound index to play.
      hurtC: 0,  // Incremented whenever the zombie is hurt. Used by the client to know when to play the hurt sound.
    }
  };

  return zombieInfo;
}

// Called on the world update loop.
// currentTime is the current Unix epoch time (milliseconds since Jan 1, 1970).
// Returns false if the zombie remains in the world, or true if the zombie is dead
// and should be removed.
function updateZombie(zombieInfo, currentTime, level) {
  if (zombieInfo.dead) {
    if (currentTime - zombieInfo.deadAt >= zombieDeadLingerMsec) {
      return true;
    }
    return false;
  }
  
  if ((currentTime - zombieInfo.lastHurtTime) < zombieHurtPauseMsec) {
    // Zombie paused for a moment since it got hurt. It does not move or growl for a little while.
    return false;
  }

  let zombie = zombieInfo.zombie;

  // AI: Random walk. Turn some amount each frame, and go that way to the maximum possible distance allowed
  // (based on the zombie's speed).
  let angleChange = Util.getRandomFloat(-zombieMaxTurnPerFrameRadians, zombieMaxTurnPerFrameRadians);
  zombie.dir += angleChange;

  let speedPxPerFrame = zombieInfo.type.speedPxFrame;
  zombie.x -= speedPxPerFrame * Math.sin(zombie.dir);
  zombie.y += speedPxPerFrame * Math.cos(zombie.dir);
  Level.clampPositionToLevel(level, zombie);
  zombieInfo.modelCircle.centerX = zombie.x;
  zombieInfo.modelCircle.centerY = zombie.y;

  // Occasional growls. We tell all the clients to use the same growl sound to get a nice
  // echo effect if people are playing in the same room.
  // We also limit to at most a couple of growls started in a sliding time window, to
  // avoid speaker and CPU overload at the client, and excessive updates across the network. 
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

  return false;
}

function hitByPlayer(zombieInfo, weaponStats, currentTime) {
  let zombie = zombieInfo.zombie;
  zombie.hl -= weaponStats.damage;
  Log.debug(`Z${zombie.id} hit, ${weaponStats.damage} damage, ${zombie.hl} hp remaining`)
  if (zombie.hl <= 0) {
    // TODO: Zombie is dead, what animation and sound to send to the client, and what state machine for death (e.g. blood puddle, spurt particles, ...)
    zombieInfo.dead = true;
    zombieInfo.deadAt = currentTime;
  } else {
    zombieInfo.lastHurtTime = currentTime;
    
    // Pick a hurt sound to play.
    zombie.hurt = Util.getRandomInt(0, numHurtSounds);
    zombie.hurtC++;
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
  if (zombieInfo.dead) {
    return false;
  }
  let msecSinceLastBite = currentTime - zombieInfo.lastBiteTime;
  if (msecSinceLastBite >= 1000) {
    if (Physics.hitTestCircles(playerInfo.modelCircle, zombieInfo.modelCircle)) {
      // Log.debug(`Z${zombieInfo.zombie.id}: Biting ${playerInfo.player.id}`);
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

// Returns true if the bullet hit the zombie, indicating that the bullet
// disappears from the world, the zombie takes damage, and a hit sound is played.
function checkBulletHit(zombieInfo, bulletInfo, currentTime) {
  if (zombieInfo.dead) {
    return false;
  }
  if (Physics.hitTestCircles(bulletInfo.modelCircle, zombieInfo.modelCircle)) {
    Log.debug(`B${bulletInfo.bullet.id} hit Z${zombieInfo.zombie.id}`);
    hitByPlayer(zombieInfo, bulletInfo.weaponStats, currentTime);
    return true;
  }
  return false;
}


// --------------------------------------------------------------------
// Exports
module.exports.spawnZombie = spawnZombie;
module.exports.updateZombie = updateZombie;
module.exports.isBiting = isBiting;
module.exports.hitByPlayer = hitByPlayer;
module.exports.checkBulletHit = checkBulletHit;
