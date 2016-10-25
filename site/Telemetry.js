// Telemetry manager.

const AppInsights = require("applicationinsights");


let appInsightsClient = undefined;
let currentConnectedUserCount = 0;

function init() {
  // We assume use (or non-use for local dev cases) of the APPINSIGHTS_INSTRUMENTATIONKEY
  // environment variable. setup() with no params uses this value. If it has not been set
  // in the environment we don't talk to AppInsights at all (setup() throws an exception).
  //
  // In Azure (portal.azure.com) there are two AppInsights keys for use here:
  // - ZombAttackDev - for local testing
  // - ZombAttackPROD - for production deployment
  let appInsightsKey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
  if (appInsightsKey) {
    AppInsights.setup().start();

    // The client is used to send custom telemetry tuples.
    appInsightsClient = AppInsights.getClient();
  }
}

function sendServerLoopStats(serverLoopProcessingTimeMsec, numZombies) {
  if (appInsightsClient) {
    appInsightsClient.trackMetric("ServerProcessingLoopTime", serverLoopProcessingTimeMsec);
    appInsightsClient.trackMetric("ZombieCount", serverLoopProcessingTimeMsec);
    
    // Report each time through the loop to ensure our dashboard continues
    // to have a current count.
    sendCurrentUserCount();
  }
}

function onUserConnected() {
  if (appInsightsClient) {
    currentConnectedUserCount++;
    appInsightsClient.trackEvent("UserConnected");
  }
}

function onUserDisconnected() {
  if (appInsightsClient) {
    currentConnectedUserCount--;
    appInsightsClient.trackEvent("UserDisconnected");
  }
}

// Returns a started stopwatch timer tied to a server metric.
function startStopwatch() {
  return {
    startMsec: (new Date()).getTime(),
  };
}

function sendStopwatch(stopwatch, metricName) {
  if (appInsightsClient) {
    let processingTimeMsec = (new Date()).getTime() - stopwatch.startMsec;
    appInsightsClient.trackMetric(metricName, processingTimeMsec);
  }
}

function sendCurrentUserCount() {
  appInsightsClient.trackMetric("UsersConnected", currentConnectedUserCount);
}


// --------------------------------------------------------------------
// Exports
module.exports.init = init;
module.exports.sendServerLoopStats = sendServerLoopStats;
module.exports.onUserConnected = onUserConnected;
module.exports.onUserDisconnected = onUserDisconnected;
module.exports.startStopwatch = startStopwatch;
module.exports.sendStopwatch = sendStopwatch;
