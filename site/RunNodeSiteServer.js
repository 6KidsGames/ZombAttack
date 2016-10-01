// Main Node.js entry point for ZombAttack.

'use strict';

const Level = require('./Level'); 
const Log = require('./Log');
const Physics = require('./Physics');
const Player = require('./Player');
const Util = require('./Util');
const Weapon = require('./Weapon');
const Zombie = require('./Zombie');
const Bullet = require('./Bullet');

// We use Express (http://expressjs.com/) for serving web pages and content.
var express = require('express');
var webApp = express();
var compression = require('compression');  // Compress content returned through HTTP.
webApp.use(compression());
var httpServer = require('http').createServer(webApp);
var network = require('./Network.js');

// Set up static file serving and a default route to serve index.html.
webApp.use('/scripts', express.static(__dirname + '/scripts', { maxAge: '1m' }));
webApp.use('/css', express.static(__dirname + '/css', { maxAge: '1d' }));
webApp.use('/images', express.static(__dirname + '/images', { maxAge: '1h' }));
webApp.use(express.static(__dirname, { maxAge: '10m' }));

// Attach Primus to the HTTP server. We included uws and ws WebSockets
// frameworks in Setup.cmd.
var primus = require('primus');
var primusOptions = {
  // websockets is not the fastest but it Just Works. UWS would be nice but not supported on Windows.
  transformer: 'websockets',
  
  // Wire transport setting - JSON text vs. binary.
  // Binary is used for speed - makes smaller messages over the wire (or wireless), meaning lower latency
  // and better server scalability.
  // Set to 'binary' for smaller and faster messages, which makes for a more scalable server.
  // Set to 'JSON' for debugging using Chrome (F12, Network tab, click the Primus websocket entry, click Frames, and click on any frame).
  //
  // Message size info gathered 9/3/2016 (after message size optimizations added):
  // JSON:
  // - First world msg 83
  // - 1 zombie 166
  // - ~70 bytes per additional zombie
  //
  // Binary:
  // - First world msg: 55
  // - 1 zombie 108
  // - ~45 bytes per additional zombie
  parser: 'binary',  // 'JSON',  
};
var primusServer = new primus(httpServer, primusOptions);

// Server-side object tracking.
var currentPlayers = { };  // Maps from spark ID (string) to PlayerInfo server data structure..
function forEachPlayer(func) { Util.forEachInMap(currentPlayers, func); }
var currentZombies = [ ];
var currentWeapons = [ ];
let currentBullets = [ ];
var currentLevel = Level.chooseLevel();

// Listen for WebSockets connections and echo the events sent.
primusServer.on('connection', spark => {
  Log.info(spark.id, 'Connected to spark from', spark.address, '- sending first world update');
  spark.write(prevWorldUpdate);

  currentPlayers[spark.id] = Player.spawnPlayer(spark, currentLevel);

  spark.on('data', function received(data) {
    //Log.debug(spark.id, 'received message:', data);
    if (data.t === 't') { // t == text
      // Broadcast player text messages to all players. 
      forEachPlayer(p => p.spark.write(data));
    }
    else if (data.t === 'c') {  // c == control
      // Update our current view of what the player is doing.
      // Our world update loop will use this info to update all players with
      // each other's info.
      currentPlayers[spark.id].latestControlInfo = data;
    }
    else {
      Log.error("Received unknown message type " + data.t)
    }
  });
});

primusServer.on('disconnection', spark => {
  Log.debug(spark.id, 'Spark disconnected from', spark.address);
  currentPlayers[spark.id] = undefined;
});

network.DisplayLocalIPAddresses();

httpServer.listen(8080, function() {
  Log.info('Open http://localhost:8080 in your browser');
});

// Augment Array prototype to remove object from array, removes first matching object only.
Array.prototype.remove = function (v) {
  var index = this.indexOf(v); 
  if (index != -1) {
    this.splice(index, 1);
    return true;
  }
  return false;
}

// We keep the last world update message sent, to reduce updates from the
// server when there have been no changes.
var prevWorldUpdate = createEmptyWorldUpdateMessage();

// World update loop.
const worldUpdateHz = 20;
setInterval(worldUpdateLoop, 1000 / worldUpdateHz /*msec*/);
function worldUpdateLoop() {
  let currentTime = (new Date()).getTime();
  let worldUpdateMessage = createEmptyWorldUpdateMessage();

  if (Util.getRandomInt(0, 200) === 0) {  // About once in 100 seconds
    currentWeapons.push(Weapon.spawnWeapon(currentLevel, currentTime));
  }

  if (Util.getRandomInt(0, 250) === 0) {  // About once in 10 seconds
    // TODO: Don't spawn within easy reach of players' current positions.
    currentZombies.push(Zombie.spawnZombie(currentLevel, currentTime));
  }

  let zombiesToRemove = [];
  currentZombies.forEach(zombieInfo => {
    if (Zombie.updateZombie(zombieInfo, currentTime, currentLevel)) {
      zombiesToRemove.push(zombieInfo);
    }
    else {
      worldUpdateMessage.z.push(zombieInfo.zombie);  // Send only the client-side data structure.
    }
  });
  zombiesToRemove.forEach(deadZombieInfo => currentZombies.remove(deadZombieInfo));

  let bulletsToRemove = [];
  currentBullets.forEach(bulletInfo => {
    Bullet.updateBullet(bulletInfo, currentTime, currentLevel);
    
    let bulletHitAZombie = currentZombies.some(zombieInfo => {
      if (Zombie.checkBulletHit(zombieInfo, bulletInfo, currentTime, currentLevel)) {
        bulletsToRemove.push(bulletInfo);
        return true;
      }
      return false;
    });
    if (!bulletHitAZombie) {
      worldUpdateMessage.b.push(bulletInfo.bullet);  // Send only the client-side data structure.
    }
  });
  bulletsToRemove.forEach(deadBulletInfo => currentBullets.remove(deadBulletInfo));

  forEachPlayer(playerInfo => {
    let player = playerInfo.player;
    let controlInfo = playerInfo.latestControlInfo;

    Player.updatePlayerFromClientControls(playerInfo, currentLevel);

    let zombieDistances = [];
    currentZombies.forEach(zombieInfo => {
      zombieDistances.push({ zombieInfo: zombieInfo, sqrDist: Physics.sqrDistanceCircles(zombieInfo.modelCircle, playerInfo.modelCircle) });
    });
    if (zombieDistances.length > 0) {
      if (controlInfo.useWeapon) {
        let weaponTracker = playerInfo.currentWeapon;
        let weaponStats = weaponTracker.weaponType;
        if ((currentTime - playerInfo.lastWeaponUse) >= weaponStats.rechargeMsec) {
          playerInfo.lastWeaponUse = currentTime;
          if (weaponStats.type === "Melee") {
            // Melee weapons different from ranged weapons - strikes nearest zombie if close enough.
            zombieDistances.sort((a, b) => a.sqrDist - b.sqrDist);
            let closestZombie = zombieDistances[0];
            let sqrWeaponRange = weaponStats.rangePx * weaponStats.rangePx;
            Log.debug(`closest zombie ${closestZombie.sqrDist}, we can hit out to ${sqrWeaponRange}`);
            if (closestZombie.sqrDist <= sqrWeaponRange) {
              // TODO - add in logic to only hit in front of player instead of in any direction.
              //let angle = Math.atan2(closestZombie.zombie.modelCircle.y - playerInfo.modelCircle.y,
              //  closestZombie.zombie.modelCircle.x - playerInfo.modelCircle.x);
              //const halfFrontalArc = Math.PI / 3;
              //if (angle >= -halfFrontalArc && angle <= halfFrontalArc) {
                Zombie.hitByPlayer(closestZombie.zombieInfo, weaponStats, currentTime);
                Log.debug(`zombie ${closestZombie.zombieInfo.zombie.id} hit, remainingHealth ${closestZombie.zombieInfo.zombie.hl}`);
              //}
            } 
          } else {
            // Ranged weapon
            currentBullets.push(Bullet.spawnBullet(player.x, player.y, player.dir, weaponStats));
          }
        }
      }

      let weaponsToRemove = [];
      currentWeapons.forEach(weaponInfo => {
        if (Weapon.isPickedUp(weaponInfo, playerInfo)) {
          Log.debug(`Player ${playerInfo.player.id} touching weapon ${weaponInfo.type.name} id ${weaponInfo.weapon.id}`);
          if (Player.pickedUpWeapon(playerInfo, weaponInfo, currentTime)) {
            weaponsToRemove.push(weaponInfo);
          } else {
            Log.debug(`Player ${playerInfo.player.id} did not pick up weapon ${weaponInfo.weapon.id}`);
          }
        }
      });
      weaponsToRemove.forEach(w => currentWeapons.remove(w));
    }

    currentZombies.forEach(zombieInfo => {
      if (Zombie.isBiting(zombieInfo, playerInfo, currentTime)) {
        Player.hitByZombie(playerInfo, currentTime);
      }
    });

    currentWeapons.forEach(weaponInfo => {
      worldUpdateMessage.w.push(weaponInfo.weapon);  // Send only the client-side data structure.
    });

    worldUpdateMessage.p.push(player);  // Player object, never playerInfo.
  });

  // Send world update to all clients, as long as the world has changed
  // from the last time we sent.
  if (!Util.objectsEqual(prevWorldUpdate, worldUpdateMessage)) {
    //Log.debug("Sending world update");
    forEachPlayer(playerInfo => playerInfo.spark.write(worldUpdateMessage));

    // Deep clone the original message so we can get new player objects created
    // in order to get a valid comparison in object_equals().
    prevWorldUpdate = JSON.parse(JSON.stringify(worldUpdateMessage));
  }

  let processingTimeMsec = (new Date()).getTime() - currentTime;
  if (processingTimeMsec > 50) {
    Log.warning(`Excessive loop processing time: ${processingTimeMsec} ms`);
  }
}

function createEmptyWorldUpdateMessage() {
  // Property names deliberately kept short to reduce space on the network.
  return {
    t: 'u',  // Message type
    l: currentLevel.name,
    lW: currentLevel.widthPx,
    lH: currentLevel.heightPx,
    p: [],  // Players
    z: [],  // Zombies
    w: [],  // Weapons
    b: [],  // Bullets
  };
}
