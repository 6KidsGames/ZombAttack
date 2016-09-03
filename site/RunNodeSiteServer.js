// Main Node.js entry point for ZombAttack.

'use strict';

const Zombie = require('./Zombie');
const Weapon = require('./Weapon');
const Level = require('./Level'); 
const Util = require('./Util');
const Physics = require('./Physics');
const datetimeObj = new Date();

// Start time of the server so we can show milliseconds relative to start in log output.
var startTime = datetimeObj.getTime();
function log() {
  var timeSinceStart = (new Date()).getTime() - startTime;
  console.log.apply(console, [timeSinceStart + 'ms:'].concat(Array.prototype.slice.call(arguments)));
}

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
  // Change to 'JSON' for debugging using WireShark.
  parser: 'binary',  
};
var primusServer = new primus(httpServer, primusOptions);

var currentPlayers = { };  // Maps from spark ID (string) to player state.
function forEachPlayer(func) {
  var sparkIDs = Object.keys(currentPlayers);
  for (var i = 0; i < sparkIDs.length; i++) {
    var sparkID = sparkIDs[i];
    if (currentPlayers.hasOwnProperty(sparkID)) {
      var player = currentPlayers[sparkID]; 
      if (player) {
        func(player);
      }
    }
  }
}

var currentZombies = [ ];
var currentLevel = Level.chooseLevel();

// Returns a PlayerInfo object. Called at connection of the client, before
// we have any identifying information.
function spawnPlayer(sparkID) {
  let x = Util.getRandomInt(32, currentLevel.widthPx - 32);
  let y = Util.getRandomInt(32, currentLevel.heightPx - 32);
  return {
    id: sparkID,  // Used by clients to self-identify
    name: '',

    // Place the player in a random location on the map.
    // TODO: Account for the contents of the underlying tile - only place users into locations that
    // make sense, or at map-specific spawn points.
    currentPosition: {
      x: x,
      y: y
    },
    modelCircle: Physics.circle(x + 16, y + 16, 16),
    rotation: 0.0,
    backpack: [],
    currentWeapon: 'Dagger',
    health: 5,
  };
}

// Listen for WebSockets connections and echo the events sent.
primusServer.on('connection', spark => {
  log(spark.id, 'Connected to spark from', spark.address, '- sending first world update');
  spark.write(prevWorldUpdate);

  currentPlayers[spark.id] = {
    spark: spark,
    latestControlInfo: { },
    playerInfo: spawnPlayer(spark.id)
  };

  spark.on('data', function received(data) {
    log(spark.id, 'received message:', data);
    if (data.type === 'text') {
      // Broadcast player text messages to all players. 
      forEachPlayer(p => p.spark.write(data));
    }
    else if (data.type === 'PlayerControlInfo') {
      // Update our current view of what the player is doing.
      // Our world update loop will use this info to update all players with
      // each other's info.
      currentPlayers[spark.id].latestControlInfo = data;
    }
    else {
      log("Received unknown message type " + data.type)
    }
  });
});

primusServer.on('disconnection', spark => {
  log(spark.id, 'Spark disconnected from', spark.address);
  currentPlayers[spark.id] = undefined;
});

network.DisplayLocalIPAddresses();

httpServer.listen(8080, function() {
  log('Open http://localhost:8080 in your browser');
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
  var currentTime = datetimeObj.getTime();
  var worldUpdateMessage = createEmptyWorldUpdateMessage();

  if (Util.getRandomInt(0, 250) == 0) {  // About once in 10 seconds
    // TODO: Don't spawn within easy reach of players' current positions.
    currentZombies.push(Zombie.spawnZombie(currentLevel));
  }

  currentZombies.forEach(zombie => {
    Zombie.updateZombie(zombie, currentTime);
    worldUpdateMessage.zombies.push(zombie);
  });

  forEachPlayer(player => {
    let playerInfo = player.playerInfo;
    let controlInfo = player.latestControlInfo;

    if (controlInfo.rotationRightPressed) {
      playerInfo.rotation += 0.2;
    }
    if (controlInfo.rotationLeftPressed) {
      playerInfo.rotation -= 0.2;
    }
    if (controlInfo.forwardPressed) {
      let dx = playerSpeedPxPerFrame * Math.sin(playerInfo.rotation);
      let dy = playerSpeedPxPerFrame * Math.cos(playerInfo.rotation);
      playerInfo.currentPosition.x += dx;
      playerInfo.currentPosition.y -= dy;
      playerInfo.modelCircle.centerX += dx;
      playerInfo.modelCircle.centerY -= dy;
      clampPositionToLevel(playerInfo.currentPosition);
    }
    if (controlInfo.backwardPressed) {
      let dx = playerSpeedPxPerFrame * Math.sin(playerInfo.rotation);
      let dy = playerSpeedPxPerFrame * Math.cos(playerInfo.rotation);
      playerInfo.currentPosition.x -= dx;
      playerInfo.currentPosition.y += dy;
      playerInfo.modelCircle.centerX -= dx;
      playerInfo.modelCircle.centerY += dy;
      clampPositionToLevel(playerInfo.currentPosition);
    }
    
    currentZombies.forEach(zombie => {
      if (Physics.hitTestCircles(playerInfo.modelCircle, zombie.modelCircle)) {
        log(`hitTestZombie: ${zombie.modelCircle.centerX}, ${zombie.modelCircle.centerY} vs. player ${playerInfo.modelCircle.centerX}, ${playerInfo.modelCircle.centerY}`)
        // Player got hit by zombie 
        playerInfo.health -= 1;
        log(`hit! ${playerInfo.health} health remaining`);
        // TODO: player should make a sound.
        if (playerInfo.health <= 0) {

          playerInfo.dead = true;
        }
      }
      Zombie.updateZombie(zombie, currentTime);
      worldUpdateMessage.zombies.push(zombie);
    });

    // Never push the 'players' object to this array - Primus sparks
    // are not comparable and should not be sent over the wire.
    // We send only the information in player.playerInfo.
    worldUpdateMessage.players.push(playerInfo);
  });

  // Send world update to all clients, as long as the world has changed
  // from the last time we sent.
  if (!Util.objectsEqual(prevWorldUpdate, worldUpdateMessage)) {
    log("Sending world update");
    forEachPlayer(player => player.spark.write(worldUpdateMessage));

    // Deep clone the original message so we can get new player objects created
    // in order to get a valid comparison in object_equals().
    prevWorldUpdate = JSON.parse(JSON.stringify(worldUpdateMessage));
  }

  var processingTimeMsec = datetimeObj.getTime() - currentTime;
  if (processingTimeMsec > 50) {
    console.log("Excessive loop processing time: ${processingTimeMsec} ms");
  }
}

// Accepts a position and keeps its value within an acceptable reach of the edges.
function clampPositionToLevel(pos) {
  pos.x = Util.clamp(pos.x, 32, currentLevel.widthPx - 32);
  pos.y = Util.clamp(pos.y, 32, currentLevel.heightPx - 32);
}

function createEmptyWorldUpdateMessage() {
  return {
    type: 'worldUpdate',
    levelName: currentLevel.name,
    size: { width: currentLevel.widthPx, height: currentLevel.heightPx },
    players: [],
    zombies: [],
    weapons: []
  };
}
