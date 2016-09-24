// Utility methods.

const fs = require("fs");
const path = require("path");

// Foreach method for maps. Executes 'func' against each value.
function forEachInMap(map, func) {
  let keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (map.hasOwnProperty(key)) {
      let val = map[key]; 
      if (val) {
        func(val);
      }
    }
  }
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomFloat(min, max) {
  return min + Math.random() * (max - min);
}

// Modified from article below, augmented with array validation.
// http://stackoverflow.com/questions/1068834/object-comparison-in-javascript#1144249
function objectsEqual(x, y) {
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
      if (!objectsEqual(x[i], y[i])) return false;
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

    if (!objectsEqual(xprop, yprop)) return false;
      // Objects and Arrays must be tested recursively
  }

  for ( p in y ) {
    if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
  }
  return true;
}

// Forces a value to be within the specified min and max.
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Gets the fully qualified files in the specified directory and pattern, without
// recursion. Returns a (possibly empty) array of strings.
// Example: let filePAths = getFilesInDirectory("c:\\data", "*");
// http://nodeexamples.com/2012/09/28/getting-a-directory-listing-using-the-fs-module-in-node-js/
function getFilesInDirectory(dir) {
  let dirEntries = fs.readdirSync(dir);
  let full = dirEntries.map(dirEntry => path.join(dir, dirEntry));
  let files = full.filter(fullyQualifiedDirEntry => fs.statSync(fullyQualifiedDirEntry).isFile());
  return files;
}


// --------------------------------------------------------------------
// Exports
module.exports.getRandomInt = getRandomInt;
module.exports.getRandomFloat = getRandomFloat;
module.exports.objectsEqual = objectsEqual;
module.exports.clamp = clamp;
module.exports.getFilesInDirectory = getFilesInDirectory;
module.exports.forEachInMap = forEachInMap;
