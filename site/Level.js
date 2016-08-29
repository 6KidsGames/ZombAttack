// Code related to game levels.

const Util = require('./Util');

const tileSizePx = 64;

// TODO: Get tile width and height from the level's JSON info. 
const Levels = [
  { name: 'SpawnCity', widthPx: tileSizePx * 35, heightPx: tileSizePx * 35 },
];

// Returns a level chosen from amongst those available.
function chooseLevel() {
    let levelInfo = Levels[Util.getRandomInt(0, Levels.length)];
    return levelInfo;
}


// --------------------------------------------------------------------
// Exports
module.exports.chooseLevel = chooseLevel;
