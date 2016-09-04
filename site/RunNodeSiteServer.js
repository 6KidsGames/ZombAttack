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
  parser: 'JSON', //binary',  
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

// Stores server-side ZombieInfo objects.
var currentZombies = [ ];

var currentLevel = Level.chooseLevel();

// Returns a PlayerInfo object. Called at connection of the client, before
// we have any identifying information.
// This data structure is the full server-side view of the player.
// The 'player' object is the information that is shared with clients.
function spawnPlayer(spark) {
  let x = Util.getRandomInt(32, currentLevel.widthPx - 32);
  let y = Util.getRandomInt(32, currentLevel.heightPx - 32);

  return {
    spark: spark,

    latestControlInfo: { },

    // The abstract representation of the player for hit detection purposes.
    modelCircle: Physics.circle(x + 16, y + 16, 16),
    
    player: {
      id: spark.id,  // Used by clients to self-identify
      name: '',

      // Place the player in a random location on the map.
      // TODO: Account for the contents of the underlying tile - only place users into locations that
      // make sense, or at map-specific spawn points.
      x: x,
      y: y,
      dir: 0.0,
      backpack: [],
      weapon: 'Dagger',
      health: 5,
    }
  };
}

// Listen for WebSockets connections and echo the events sent.
primusServer.on('connection', spark => {
  Log.info(spark.id, 'Connected to spark from', spark.address, '- sending first world update');
  spark.write(prevWorldUpdate);

  currentPlayers[spark.id] = spawnPlayer(spark);

  spark.on('data', function received(data) {
    Log.debug(spark.id, 'received message:', data);
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

  if (Util.getRandomInt(0, 250) == 0) {  // About once in 10 seconds
    // TODO: Don't spawn within easy reach of players' current positions.
    currentZombies.push(Zombie.spawnZombie(currentLevel, currentTime));
  }

  currentZombies.forEach(zombieInfo => {
    Zombie.updateZombie(zombieInfo, currentTime);
    worldUpdateMessage.zombies.push(zombieInfo.zombie);  // Send only the client-side data structure.
  });

  forEachPlayer(playerInfo => {
    let player = playerInfo.player;
    let controlInfo = playerInfo.latestControlInfo;

    if (controlInfo.turnRight) {
      player.dir += 0.2;
    }
    if (controlInfo.turnLeft) {
      player.dir -= 0.2;
    }
    if (controlInfo.fwd) {
      player.x += playerSpeedPxPerFrame * Math.sin(player.dir);
      player.y -= playerSpeedPxPerFrame * Math.cos(player.dir);
      clampPositionToLevel(player);
      playerInfo.modelCircle.centerX = player.x + 16;
      playerInfo.modelCircle.centerY = player.y + 16;
    }
    if (controlInfo.back) {
      player.x -= playerSpeedPxPerFrame * Math.sin(player.dir);
      player.y += playerSpeedPxPerFrame * Math.cos(player.dir);
      clampPositionToLevel(player);
      playerInfo.modelCircle.centerX = player.x + 16;
      playerInfo.modelCircle.centerY = player.y + 16;
    }
    
    currentZombies.forEach(zombie => {
      if (Zombie.isBiting(zombie, playerInfo, currentTime)) {
        // Player got hit by zombie 
        player.health -= 1;
        // TODO: player should make a sound.
        if (player.health <= 0) {

          player.dead = true;
        }
      }
    });

    // Never push the playerInfo object to this array, to minimize
    // wire traffic, and Primus sparks are not comparable and should not be sent over the wire.
    // We send only the information in playerInfo.player.
    worldUpdateMessage.players.push(player);
  });

  // Send world update to all clients, as long as the world has changed
  // from the last time we sent.
  if (!Util.objectsEqual(prevWorldUpdate, worldUpdateMessage)) {
    Log.debug("Sending world update");
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

// Accepts an object containing 'x' and 'y' and keeps its location within an acceptable reach of the edges.
function clampPositionToLevel(pos) {
  pos.x = Util.clamp(pos.x, 32, currentLevel.widthPx - 32);
  pos.y = Util.clamp(pos.y, 32, currentLevel.heightPx - 32);
}

function createEmptyWorldUpdateMessage() {
  return {
    type: 'update',
    lvl: currentLevel.name,
    lvlW: currentLevel.widthPx,
    lvlH: currentLevel.heightPx,
    players: [],
    zombies: [],
    weapons: []
  };
}
