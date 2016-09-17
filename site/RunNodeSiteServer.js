// Main Node.js entry point for ZombAttack.

'use strict';

const Zombie = require('./Zombie');
const Weapon = require('./Weapon');
const Level = require('./Level'); 
const Util = require('./Util');
const Physics = require('./Physics');
const Log = require('./Log');

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
webApp.use(express.static(__dirname, { maxAge: '1h' }));

// Attach Primus to the HTTP server. We included uws and ws WebSockets
// frameworks in Setup.cmd.
var primus = require('primus');
var primusOptions = {
  // websockets is not the fastest but it Just Works. UWS would be nice but not supported on Windows.
  transformer: 'websockets',
  
  // For speed - makes smaller messages over the wire (or wireless), meaning lower latency
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

var currentPlayers = { };  // Maps from spark ID (string) to PlayerInfo server data structure..
function forEachPlayer(func) {
  let sparkIDs = Object.keys(currentPlayers);
  for (let i = 0; i < sparkIDs.length; i++) {
    let sparkID = sparkIDs[i];
    if (currentPlayers.hasOwnProperty(sparkID)) {
      let playerInfo = currentPlayers[sparkID]; 
      if (playerInfo) {
        func(playerInfo);
      }
    }
  }
}

// Stores server-side objects
var currentZombies = [ ];
var currentWeapons = [ ];

var currentLevel = Level.chooseLevel();

// Returns a PlayerInfo object. Called at connection of the client, before
// we have any identifying information.
// This data structure is the full server-side view of the player.
// The 'player' object is the information that is shared with clients.
// Property names are deliberately kept short to reduce space over the network.
function spawnPlayer(spark) {
  let x = Util.getRandomInt(32, currentLevel.widthPx - 32);
  let y = Util.getRandomInt(32, currentLevel.heightPx - 32);

  const defaultWeaponIndex = 0;

  return {
    spark: spark,

    latestControlInfo: { },

    // The abstract representation of the player for hit detection purposes.
    modelCircle: Physics.circle(x + 16, y + 16, 16),

    currentWeapon: Weapon.WeaponTypes[defaultWeaponIndex],
    lastWeaponUse: 0,  // allow to use weapon immediately
    
    player: {
      id: spark.id,  // Used by clients to self-identify
      name: '',

      // Place the player in a random location on the map.
      // TODO: Account for the contents of the underlying tile - only place users into locations that
      // make sense, or at map-specific spawn points.
      x: x,
      y: y,
      dir: 0.0,
      inv: [],  // Inventory
      w: defaultWeaponIndex,  // Weapon
      hl: 5,  // health
      snd: 0,  // sound number
      sndC: 0,  // sound state machine
    }
  };
}

const playerMaxTurnPerFrameRadians = 0.3;

// Listen for WebSockets connections and echo the events sent.
primusServer.on('connection', spark => {
  Log.info(spark.id, 'Connected to spark from', spark.address, '- sending first world update');
  spark.write(prevWorldUpdate);

  currentPlayers[spark.id] = spawnPlayer(spark);

  spark.on('data', function received(data) {
    //Log.debug(spark.id, 'received message:', data);
    if (data.type === 'text') {
      // Broadcast player text messages to all players. 
      forEachPlayer(p => p.spark.write(data));
    }
    else if (data.type === 'ctrl') {
      // Update our current view of what the player is doing.
      // Our world update loop will use this info to update all players with
      // each other's info.
      currentPlayers[spark.id].latestControlInfo = data;
    }
    else {
      Log.error("Received unknown message type " + data.type)
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

const playerSpeedPxPerFrame = 10;

// We keep the last world update message sent, to reduce updates from the
// server when there have been no changes.
var prevWorldUpdate = createEmptyWorldUpdateMessage();

// World update loop, runs 25 times a second.
setInterval(worldUpdateLoop, 40 /*msec*/);
function worldUpdateLoop() {
  let currentTime = (new Date()).getTime();
  let worldUpdateMessage = createEmptyWorldUpdateMessage();

  if (Util.getRandomInt(0, 25) === 0) {  // About once in 100 seconds
    currentWeapons.push(Weapon.spawnWeapon(currentLevel, currentTime));
  }

  let weaponsToRemove = [];  // TODO: andle weapons being picked up and disappearing from world.
  currentWeapons.forEach(weaponInfo => {
    worldUpdateMessage.w.push(weaponInfo.weapon);  // Send only the client-side data structure.
  });

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

  forEachPlayer(playerInfo => {
    let player = playerInfo.player;
    let controlInfo = playerInfo.latestControlInfo;

    if (controlInfo.turnRight) {
      player.dir += playerMaxTurnPerFrameRadians;
    }
    if (controlInfo.turnLeft) {
      player.dir -= playerMaxTurnPerFrameRadians;
    }
    if (controlInfo.fwd) {
      player.x += playerSpeedPxPerFrame * Math.sin(player.dir);
      player.y -= playerSpeedPxPerFrame * Math.cos(player.dir);
      Level.clampPositionToLevel(currentLevel, player);
      playerInfo.modelCircle.centerX = player.x + 16;
      playerInfo.modelCircle.centerY = player.y + 16;
    }
    if (controlInfo.back) {
      player.x -= playerSpeedPxPerFrame * Math.sin(player.dir);
      player.y += playerSpeedPxPerFrame * Math.cos(player.dir);
      Level.clampPositionToLevel(currentLevel, player);
      playerInfo.modelCircle.centerX = player.x + 16;
      playerInfo.modelCircle.centerY = player.y + 16;
    }

    let zombieDistances = [];
    currentZombies.forEach(zombieInfo => {
      zombieDistances.push({ zombieInfo: zombieInfo, sqrDist: Physics.sqrDistanceCircles(zombieInfo.modelCircle, playerInfo.modelCircle) });
    });
    if (zombieDistances.length > 0) {
      if (controlInfo.useWeapon) {
        let weaponStats = playerInfo.currentWeapon;
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
          }
        }
      }
    }

    currentZombies.forEach(zombie => {
      if (Zombie.isBiting(zombie, playerInfo, currentTime)) {
        // Player got hit by zombie, reduce health.
        player.hl -= 1;
        player.snd = Util.getRandomInt(0, 2);
        player.sndC++;
        if (player.hl <= 0) {

          player.dead = true;
        }
      }
    });

    // Never push the playerInfo object to this array, to minimize
    // wire traffic, and Primus sparks are not comparable and should not be sent over the wire.
    // We send only the information in playerInfo.player.
    worldUpdateMessage.p.push(player);
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
    type: 'update',
    lvl: currentLevel.name,
    lvlW: currentLevel.widthPx,
    lvlH: currentLevel.heightPx,
    p: [],  // Players
    z: [],  // Zombies
    w: []  // Weapons
  };
}
