'use strict';

// Create the HTTP server and serve our index.html
var server = require('http').createServer(function incoming(req, res) {
  res.setHeader('Content-Type', 'text/html');
  require('fs').createReadStream(__dirname + '/index.html').pipe(res);
});

// Attach Primus to the HTTP server. We included uws and ws WebSockets
// frameworks in Setup.cmd.
var Primus = require('../../node_modules/primus');
var primus = new Primus(server, { transformer: 'websockets' });

// Listen for WebSockets connections and echo the events sent.
primus.on('connection', function connection(spark) {
  console.log(spark,id, 'Connected to spark');
  spark.on('data', function received(data) {
    console.log(spark.id, 'received message:', data);
    spark.write(data);
  });
});

server.listen(8080, function () {
  console.log('Open http://localhost:8080 in your browser');
});
