// Code related to game levels.

const Util = require('./Util');
const Log = require('./Log');
const fs = require("fs");
const path = require("path");

let LevelsFromDisk = loadLevels();

// First-time enumeration of the Levels directory.
function loadLevels() {
  var levels = [];

  let levelsPath = path.join(__dirname, "Levels");
  let levelsFilePaths = Util.getFilesInDirectory(levelsPath);
  let jsonFilePaths = levelsFilePaths.filter(filePath => path.extname(filePath) === '.json');
  jsonFilePaths.forEach(levelFilePath => {
    // TODO: Async readFile() was not working at least on Windows.
    let content = fs.readFileSync(levelFilePath, 'utf8');
    let level = JSON.parse(content);

    let levelInfo = {
      // Used to tell the client which file to load.
      name: path.basename(levelFilePath, '.json'),

      widthPx: level.width * level.tilewidth,
      heightPx: level.height * level.tileheight,

      // Keep the full level data for later use in determining tile types.
      level: level,
    };
    levels.push(levelInfo);

    Log.debug(`Read level file ${levelFilePath}`);
  });

  return levels;
}

// Returns a level chosen from amongst those available.
function chooseLevel() {
  if (LevelsFromDisk.length == 0) {
  }

  let levelInfo = LevelsFromDisk[Util.getRandomInt(0, LevelsFromDisk.length)];
  return levelInfo;
}


// --------------------------------------------------------------------
// Exports
module.exports.chooseLevel = chooseLevel;
