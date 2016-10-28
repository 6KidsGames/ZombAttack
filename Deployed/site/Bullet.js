// Bullet-related code.

const Physics = require('./Physics');
const Util = require('./Util');
const Log = require('./Log');
const Level = require('./Level');

const BulletSpeedPxPerFrame = 24;

let nextBulletNumber = 0;

function spawnBullet(x, y, direction, weaponStats, currentTime) {
  let bulletID = nextBulletNumber;
  nextBulletNumber++;

  // A BulletInfo is the server-side data structure containing all needed server tracking information.
  // Only a subset of this information is passed to the clients, to minimize wire traffic.
  let bulletInfo = {
    modelCircle: Physics.circle(x, y, 3),  // Bullet radius is 1.5 but give some extra hit probabilty
    dir: direction,
    weaponStats: weaponStats,
    hasTraveledPx: 0,

    // The portion of the data structure we send to the clients.
    bullet: {
      id: bulletID,
      x: x,
      y: y,
    }
  };

  return bulletInfo;
}

// Called on the world update loop.
// currentTime is the current Unix epoch time (milliseconds since Jan 1, 1970).
// Returns true if the bullet should remain in the world, false if it should be removed.
function updateBullet(bulletInfo, currentTime, level) {
  let bullet = bulletInfo.bullet;

  // Account for max range.
  bulletInfo.hasTraveledPx += BulletSpeedPxPerFrame;
  if (bulletInfo.hasTraveledPx > bulletInfo.weaponStats.rangePx) {
    return false;
  }

  bullet.x += BulletSpeedPxPerFrame * Math.sin(bulletInfo.dir);
  bullet.y -= BulletSpeedPxPerFrame * Math.cos(bulletInfo.dir);
  if (Level.isOutsideLevel(level, bullet)) {
    return false;
  }
  bulletInfo.modelCircle.centerX = bullet.x;
  bulletInfo.modelCircle.centerY = bullet.y;
  return true;
}


// --------------------------------------------------------------------
// Exports
module.exports.spawnBullet = spawnBullet;
module.exports.updateBullet = updateBullet;
