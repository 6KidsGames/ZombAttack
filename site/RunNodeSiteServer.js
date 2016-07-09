'use strict';

// Start time of the server so we can show milliseconds relative to start in loggimg.
var startTime = (new Date()).getTime();
function log() {
  var timeSinceStart = (new Date()).getTime() - startTime;
  console.log.apply(console, [timeSinceStart + 'ms:'].concat(Array.prototype.slice.call(arguments)));
}

// We use Express (http://expressjs.com/) for serving web pages and content.
var express = require('express');
var webApp = express();

// Compress content returned through HTTP.
var compression = require('compression')
webApp.use(compression());

var httpServer = require('http').createServer(webApp);
var network = require('./Network.js');

// Set up static file serving and a default route to serve index.html.
webApp.use('/scripts', express.static(__dirname + '/scripts', { maxAge: '1d' }));
webApp.use('/css', express.static(__dirname + '/css', { maxAge: '1d' }));
webApp.use('/images', express.static(__dirname + '/images', { maxAge: '1d' }));
webApp.use(express.static(__dirname, { maxAge: '1d' }));

// Attach Primus to the HTTP server. We included uws and ws WebSockets
// frameworks in Setup.cmd.
var primus = require('primus');
var primusOptions = {
  // websockets is not the fastest but it Just Works. UWS would be nice but not supported on Windows.
  transformer: 'websockets',
  
  // For speed - makes smaller messages over the wire (or wireless), meaning lower latency.
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

// Listen for WebSockets connections and echo the events sent.
primusServer.on('connection', spark => {
  log(spark.id, 'Connected to spark from', spark.address, '- sending first world update');
  spark.write(prevWorldUpdate);

  currentPlayers[spark.id] = {
    spark: spark,
    latestControlInfo: { },
    playerInfo: {
      id: spark.id,
      name: '',
      currentPosition: { x: 0, y: 0 },
      scale: 1.0,
      alpha: 1.0,
      rotation: 0.0,
      tint: 0xffffff
    }
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

// We keep the last world update message sent, to reduce updates from the
// server when there have been no changes.
var prevWorldUpdate = createEmptyWorldUpdateMessage();

// World update loop, runs 60 times a second.
setInterval(worldUpdateLoop, 17 /*msec*/);
function worldUpdateLoop() {
  var worldUpdateMessage = createEmptyWorldUpdateMessage();

  forEachPlayer(player => {
    var playerInfo = player.playerInfo;
    var controlInfo = player.latestControlInfo;

    if (controlInfo.upPressed) {
      playerInfo.currentPosition.y -= 1;
    }
    if (controlInfo.downPressed) {
      playerInfo.currentPosition.y += 1;
    }
    if (controlInfo.leftPressed) {
      playerInfo.currentPosition.x -= 1;
    }
    if (controlInfo.rightPressed) {
      playerInfo.currentPosition.x += 1;
    }
    if (controlInfo.inflatePressed) {
      playerInfo.scale *= 1.01; 
    }
    if (controlInfo.ghostPressed) {
      playerInfo.alpha *= 0.97;
    }
    if (controlInfo.rotationPressed) {
      playerInfo.rotation += 0.1;
    }
    if (controlInfo.tintPressed) {
      playerInfo.tint = 0xff00ff;
    }
    if (controlInfo.resetPressed) {
      playerInfo.scale = 0.5;
      playerInfo.currentPosition.x = 0;
      playerInfo.currentPosition.y = 0;
      playerInfo.alpha = 1.0;
      playerInfo.rotation = 0.0;
      playerInfo.tint = 0xffffff;
    }

    // Never push the 'players' object to this array - Primus sparks
    // are not comparable and should not be sent over the wire.
    // We send only the information in player.playerInfo.
    worldUpdateMessage.players.push(playerInfo);
  });

  // Send world update to all clients, as long as the world has changed
  // from the last time we sent.
  if (!objects_equal(prevWorldUpdate, worldUpdateMessage)) {
    log("Sending world update");
    forEachPlayer(player => player.spark.write(worldUpdateMessage));

    // Deep clone the original message so we can get new player objects created
    // in order to get a valid comparison in object_equals().
    prevWorldUpdate = JSON.parse(JSON.stringify(worldUpdateMessage));
  }
}

function createEmptyWorldUpdateMessage() {
  return {
    type: 'worldUpdate',
    players: []
  };
}

// Modified from article below, augmented with array validation.
// http://stackoverflow.com/questions/1068834/object-comparison-in-javascript#1144249
function objects_equal(x, y) {
  if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

  if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

  if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

  if (Array.isArray(x)) {
    if (!Array.isArray(y)) return false;
    if (x.length != y.length) return false;
    for (var i = 0; i < x.length; i++) {
      if (!objects_equal(x[i], y[i])) return false;
    }
  }

  for ( var p in x ) {
    if ( ! x.hasOwnProperty( p ) ) continue;
      // other properties were tested using x.constructor === y.constructor

    if ( ! y.hasOwnProperty( p ) ) return false;
      // allows to compare x[ p ] and y[ p ] when set to undefined

    var xprop = x[p];
    var yprop = y[p];

    if ( xprop === yprop ) continue;
      // if they have the same strict value or identity then they are equal

    if ( typeof(xprop) !== "object" ) return false;
      // Numbers, Strings, Functions, Booleans must be strictly equal

    if (!objects_equal(xprop, yprop)) return false;
      // Objects and Arrays must be tested recursively
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
  }
  return true;
}
