// Weapon-related code.

const Util = require('./Util');
const Log = require('./Log');
const Physics = require('./Physics');

// If the zombie and the player model circles are just touching, the centers are 32 pixels distance
// from each other. So the bare-minimum distance for a melee weapon is this far,
// then we add in any extra small range we want to allow based on the length of the weapon.
const minMeleeStrikeDistance = 16 + 16;

const weaponLifeMsec = 30 * 1000;

// Map/dictionary of weapons in the game, by name.
// Ammo value -1 means infinite, anything less means after ammo reaches zero the player drops the empty weapon.
const WeaponTypes = [
  // Melee weapons
  { name: "Dagger", number: 0, awesomeness: 0, probability: 0, type: "Melee", damage: 2, rechargeMsec: 500, rangePx: minMeleeStrikeDistance + 8, ammo: -1 },
  { name: "HalliganTool", number: 1, awesomeness: 10, probability: 10, type: "Melee", damage: 4, rechargeMsec: 1000, rangePx: minMeleeStrikeDistance + 16, ammo: -1 },
  { name: "Sword", number: 2, awesomeness: 20, probability: 5, type: "Melee", damage: 5, rechargeMsec: 750, rangePx: minMeleeStrikeDistance + 16, ammo: -1 },
  { name: "Chainsaw", number: 3, awesomeness: 30, probability: 8, type: "Melee", damage: 1, rechargeMsec: 100, rangePx: minMeleeStrikeDistance + 8, ammo: -1 },

  // Ranged weapons
  { name: "Pistol", number: 4, awesomeness: 50, probability: 15, type: "Range", damage: 3, rechargeMsec: 500, accuracyConeRad: 0.4, rangePx: 192, ammo: 15 },
  { name: "Rifle", number: 5, awesomeness: 60, probability: 8, type: "Range", damage: 12, rechargeMsec: 800, accuracyConeRad: 0.2, rangePx: 512, ammo: 12 },
  { name: "MachineGun", number: 6, awesomeness: 70, probability: 2, type: "Range", damage: 10, rechargeMsec: 100, accuracyConeRad: 0.3, rangePx: 384, ammo: 30 },
  { name: "Minigun", number: 7, awesomeness: 80, probability: 10, type: "Range", damage: 12, rechargeMsec: 10, accuracyConeRad: 0.3, rangePx: 324, ammo: 200 },
];
const NumWeapons = 8;

function getWeaponStats(weaponName) {
  return WeaponTypes.find(w => w.name === weaponName);
}

// Creates a map from a number in the range of 0..totalZombieProbability to the zombie type
// to use if that number is chosen randomly.
let totalWeaponProbability = 0;
function createWeaponProbabilityNap() {
  let probMap = { };
  let currentProb = 0;
  WeaponTypes.forEach(weaponType => {
    totalWeaponProbability += weaponType.probability;
    for (let i = 0; i < weaponType.probability; i++) {
      probMap[currentProb] = weaponType;
      currentProb++;
    }
  });
  return probMap;
}
const weaponProbabilityMap = createWeaponProbabilityNap();

let nextWeaponNumber = 0;

function spawnWeapon(level, currentTime) {
  let weaponID = nextWeaponNumber;
  nextWeaponNumber++;

  let x = Util.getRandomInt(32, level.widthPx - 32);
  let y = Util.getRandomInt(32, level.heightPx - 32);

  let randomWeaponNumber = Util.getRandomInt(0, totalWeaponProbability);
  let weaponType = weaponProbabilityMap[randomWeaponNumber];

  Log.debug(`Creating weapon ${weaponType.name}, number ${weaponType.number}`);

  // A WeaponInfo is the server-side data structure containing all needed server tracking information.
  // Only a subset of this information is passed to the clients, to minimize wire traffic.
  let weaponInfo = {
    modelCircle: Physics.circle(x, y, 24),
    
    type: weaponType,
    timeOutAt: currentTime + weaponLifeMsec,

    // The portion of the data structure we send to the clients.
    weapon: {
      id: weaponID,

      // Place the weapon in a random location on the map.
      // TODO: Account for the contents of the underlying tile - only place weapons into locations that
      // make sense, or at map-specific spawn points.
      x: x,
      y: y,
      n: weaponType.number,
    }
  };

  return weaponInfo;
}

function isTimedOut(weaponInfo, currentTime) {
  return (currentTime >= weaponInfo.timeOutAt);
}

function isPickedUp(weaponInfo, playerInfo) {
  if (Physics.hitTestCircles(playerInfo.modelCircle, weaponInfo.modelCircle)) {
    Log.debug(`W${weaponInfo.weapon.id}: Picked up by ${playerInfo.player.id}`);
    return true;
  }
  return false;
}


// --------------------------------------------------------------------
// Exports
module.exports.WeaponTypes = WeaponTypes;
module.exports.NumWeapons = NumWeapons;
module.exports.spawnWeapon = spawnWeapon;
module.exports.isTimedOut = isTimedOut;
module.exports.isPickedUp = isPickedUp;
module.exports.getWeaponStats = getWeaponStats;
