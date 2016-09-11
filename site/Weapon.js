// Weapon-related code.

// Map/dictionary of weapons in the game, by name.
// Ammo value -1 means infinite, anything less means after ammo reaches zero the player drops the empty weapon.
const WeaponsMap = {
  "Dagger" : { type: "Melee", damage: 1, rechargeMsec: 1000, rangePx: 24, ammo: -1 },
  "HalliganTool" : { type: "Melee", damage: 3, rechargeMsec: 2000, rangePx: 28, ammo: -1 },
  "Sword" : { type: "Melee", damage: 5, rechargeMsec: 1500, rangePx: 28, ammo: -1 },
  "Chainsaw" : { type: "Melee", damage: 1, rechargeMsec: 25, rangePx: 24, ammo: -1 },
  "Pistol" : { type: "Range", damage: 2, rechargeMsec: 500, accuracyConeRad: 0.4, rangePx: 128, ammo: -1 },
  "Rifle" : { type: "Range", damage: 12, rechargeMsec: 800, accuracyConeRad: 0.2, rangePx: 384, ammo: 12 },
  "MachineGun" : { type: "Range", damage: 12, rechargeMsec: 100, accuracyConeRad: 0.3, rangePx: 318, ammo: 30 },
  "Minigun" : { type: "Range", damage: 20, rechargeMsec: 10, accuracyConeRad: 0.3, rangePx: 256, ammo: 2000 },
};


// --------------------------------------------------------------------
// Exports
module.exports.WeaponsMap = WeaponsMap;
