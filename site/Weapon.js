// Weapon-related code.

// If the zombie and the player model circles are just touching, the centers are  32 pixels distance
// from each other. So the bare-minimum distance for a melee weapon is this far,
// then we add in any extra small range we want to allow based on the length of the weapon.
const minMeleeStrikeDistance = 16 + 16;

// Map/dictionary of weapons in the game, by name.
// Ammo value -1 means infinite, anything less means after ammo reaches zero the player drops the empty weapon.
const WeaponsMap = {
  // Melee weapons
  "Dagger" : { type: "Melee", damage: 1, rechargeMsec: 1000, rangePx: minMeleeStrikeDistance + 8, ammo: -1 },
  "HalliganTool" : { type: "Melee", damage: 3, rechargeMsec: 2000, rangePx: minMeleeStrikeDistance + 16, ammo: -1 },
  "Sword" : { type: "Melee", damage: 5, rechargeMsec: 1500, rangePx: minMeleeStrikeDistance + 16, ammo: -1 },
  "Chainsaw" : { type: "Melee", damage: 1, rechargeMsec: 25, rangePx: minMeleeStrikeDistance + 8, ammo: -1 },

  // Ranged weapons
  "Pistol" : { type: "Range", damage: 2, rechargeMsec: 500, accuracyConeRad: 0.4, rangePx: 128, ammo: -1 },
  "Rifle" : { type: "Range", damage: 12, rechargeMsec: 800, accuracyConeRad: 0.2, rangePx: 384, ammo: 12 },
  "MachineGun" : { type: "Range", damage: 12, rechargeMsec: 100, accuracyConeRad: 0.3, rangePx: 318, ammo: 30 },
  "Minigun" : { type: "Range", damage: 20, rechargeMsec: 10, accuracyConeRad: 0.3, rangePx: 256, ammo: 2000 },
};


// --------------------------------------------------------------------
// Exports
module.exports.WeaponsMap = WeaponsMap;
