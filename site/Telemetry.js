// Telemetry manager.

'use strict';

// Azure Application Insights
const AppInsights = require("applicationinsights");

// AppIns
const updateIntervalMsec = 60000;

let lastWriteTime = 0;

let currentIntervalTracker = {
  serverLoopTime: 0,
  serverLoopTimeSamples: 0,

  sendWorldUpdateMsec: 0,
  sendWorldUpdateMsecSamples: 0,

  cloneWorldMsec: 0,
  cloneWorldMsecSamples: 0,

  zombieCount: 0,
  usersConnected: 0,
};

function resetTracker() {
  for (var name in currentIntervalTracker) {
    if (currentIntervalTracker.hasOwnProperty(name)) {
      currentIntervalTracker[name] = 0;
    }
  }
}

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

    lastWriteTime = (new Date()).getTime();
  }
}

function sendServerLoopStats(serverLoopProcessingTimeMsec, numZombies) {
  if (appInsightsClient) {
    // Average counters.
    currentIntervalTracker.serverLoopTime += serverLoopProcessingTimeMsec;
    currentIntervalTracker.serverLoopTimeSamples++;

    // Max counters.
    currentIntervalTracker.zombieCount = Math.max(currentIntervalTracker.zombieCount, numZombies);
    currentIntervalTracker.usersConnected = Math.max(currentIntervalTracker.usersConnected, currentConnectedUserCount);

    let now = (new Date()).getTime();
    if (now - lastWriteTime >= updateIntervalMsec) {
      sendIntervalStats();
      lastWriteTime = now;
      resetTracker();
    }
  }
}

function sendIntervalStats() {
  if (appInsightsClient) {
    // Average counters
    sendOneMetric("ServerProcessingLoopTime", currentIntervalTracker.serverLoopTime, currentIntervalTracker.serverLoopTimeSamples);
    sendOneMetric("SendWorldUpdateMsec", currentIntervalTracker["sendWorldUpdateMsec"], currentIntervalTracker["sendWorldUpdateMsecSamples"]);
    sendOneMetric("CloneWorldMsec", currentIntervalTracker["cloneWorldMsec"], currentIntervalTracker["cloneWorldMsecSamples"]);

    // Max counters
    sendOneMetric("ZombieCount", currentIntervalTracker.zombieCount);
    sendOneMetric("UsersConnected", currentIntervalTracker.usersConnected);
  }
}

function sendOneMetric(metricName, value, denominator = undefined) {
  if (value !== 0) {
    if (denominator) {
      value = value / denominator;
    }
    appInsightsClient.trackMetric(metricName, value);
  }
}

function onUserConnected() {
  currentConnectedUserCount++;
}

function onUserDisconnected() {
  currentConnectedUserCount--;
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
    currentIntervalTracker[metricName] += processingTimeMsec;
    currentIntervalTracker[metricName + "Samples"]++;
  }
}


// --------------------------------------------------------------------
// Exports
module.exports.init = init;
module.exports.sendServerLoopStats = sendServerLoopStats;
module.exports.onUserConnected = onUserConnected;
module.exports.onUserDisconnected = onUserDisconnected;
module.exports.startStopwatch = startStopwatch;
module.exports.sendStopwatch = sendStopwatch;
