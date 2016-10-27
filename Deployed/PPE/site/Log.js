// Logging module.
    
var startTime = new Date().getTime();

function log(prefix) {
  let timeSinceStart = new Date().getTime() - startTime;
  console.log(timeSinceStart + 'ms:', ...arguments);
}

function info() {
  log('INFO ', ...arguments);
}

function debug() {
  log('DEBUG', ...arguments);
}

function warning() {
  log('WARN ', ...arguments);
}

function error() {
  log('ERROR', ...arguments);
}

// --------------------------------------------------------------------
// Exports
module.exports.info = info;
module.exports.debug = debug;
module.exports.warning = warning;
module.exports.error = error;
