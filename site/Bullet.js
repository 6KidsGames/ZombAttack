// Bullet-related code.

const Physics = require('./Physics');
const Util = require('./Util');
const Log = require('./Log');
const Level = require('./Level');


// Sound file references for growls.
// CODESYNC: index.html keeps the opposing list in 2 places.
const numHitSounds = 1;

let nextBulletNumber = 0;

function spawnBullet(x, y, direction, weaponStats) {
  let bulletID = nextBulletNumber;
  nextBulletNumber++;

  // A BulletInfo is the server-side data structure containing all needed server tracking information.
  // Only a subset of this information is passed to the clients, to minimize wire traffic.
  let bulletInfo = {
    modelCircle: Physics.circle(x + 1, y + 1, 2),
    dir: direction,
    weaponStats: weaponStats,

    // The portion of the data structure we send to the clients.
    bullet: {
      id: bulletID,

      // Place the zombie in a random location on the map.
      // TODO: Account for the contents of the underlying tile - only place zombies into locations that
      // make sense, or at map-specific spawn points.
      x: x,
      y: y,
    }
  };

  return bulletInfo;
}

// Called on the world update loop.
// currentTime is the current Unix epoch time (milliseconds since Jan 1, 1970).
function updateBullet(bulletInfo, currentTime, level) {
  let bullet = bulletInfo.bullet;

  let speedPxPerFrame = 16;
  bullet.x += speedPxPerFrame * Math.sin(bulletInfo.dir);
  bullet.y -= speedPxPerFrame * Math.cos(bulletInfo.dir);
  Level.clampPositionToLevel(level, bullet);
  bulletInfo.modelCircle.centerX = bullet.x + 1;
  bulletInfo.modelCircle.centerY = bullet.y + 1;
}


// --------------------------------------------------------------------
// Exports
module.exports.spawnBullet = spawnBullet;
module.exports.updateBullet = updateBullet;
