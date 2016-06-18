'use strict';

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

var currentSparks = [];

// Listen for WebSockets connections and echo the events sent.
primusServer.on('connection', spark => {
  console.log(spark.id, 'Connected to spark from', spark.address);
  currentSparks.push(spark);

  spark.on('data', function received(data) {
    console.log(spark.id, 'received message:', data);
    currentSparks.forEach(s => s.write(data));
  });
});

primusServer.on('disconnection', spark => {
  console.log(spark.id, 'Spark disconnected from', spark.address);
  currentSparks.remove(spark);
});

network.DisplayLocalIPAddresses();

httpServer.listen(8080, function() {
  console.log('Open http://localhost:8080 in your browser');
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
