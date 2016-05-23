'use strict';

// We use Express (http://expressjs.com/) for serving web pages and content.
var Express = require('../../node_modules/express');
var webApp = Express();

var httpServer = require('http').createServer(webApp);

// Set up static file serving and a default route to serve index.html.
webApp.use(Express.static('scripts'));
webApp.use(Express.static('css'));
webApp.use(Express.static('images'));
webApp.get('/', function(req, res) {
  res.sendFile('index.html', { root: __dirname });
});

// Attach Primus to the HTTP server. We included uws and ws WebSockets
// frameworks in Setup.cmd.
var Primus = require('../../node_modules/primus');
var primusOptions = {
  // websockets is not the fastest but it Just Works. UWS would be nice but not supported on Windows.
  transformer: 'websockets',
  
  // For speed - makes smaller messages over the wire (or wireless), meaning lower latency.
  // Change to 'JSON' for debugging using WireShark.
  parser: 'binary',  
};
var primus = new Primus(httpServer, primusOptions);

var currentSparks = [];

// Listen for WebSockets connections and echo the events sent.
primus.on('connection', spark => {
  console.log(spark.id, 'Connected to spark from', spark.address);
  currentSparks.push(spark);

  spark.on('data', function received(data) {
    console.log(spark.id, 'received message:', data);
    currentSparks.forEach(s => s.write(data));
  });
});

primus.on('disconnection', spark => {
  console.log(spark.id, 'Spark disconnected from', spark.address);
  currentSparks.remove(spark);
});

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
