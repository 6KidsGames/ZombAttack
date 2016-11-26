// Player-related data and code.

const Level = require('./Level');
const Log = require('./Log');
const Physics = require('./Physics');
const Util = require('./Util');
const Weapon = require('./Weapon');

const playerMaxTurnPerFrameRadians = 0.3;
const playerSpeedPxPerFrame = 10;
const playerOuchSoundsPerCharacter = 2;
const numCharacters = 3;

// Returns a new PlayerInfo object. Called at connection of the client, before
// we have any identifying information.
// The PlayerInfo data structure is the full server-side view of the player.
// The 'player' object inside iof it is the information that is shared with clients.
// Player property names are deliberately kept short to reduce space over the network.
function spawnPlayer(spark, currentLevel) {
  let x = Util.getRandomInt(32, currentLevel.widthPx - 32);
  let y = Util.getRandomInt(32, currentLevel.heightPx - 32);

  const defaultWeaponIndex = 0;
  let defaultWeaponType = Weapon.WeaponTypes[defaultWeaponIndex]; 

  let weaponTracker = {
    weaponType: defaultWeaponType,
    currentAmmo: defaultWeaponType.ammo,
  };

  return {
    spark: spark,

    latestControlInfo: { },

    // The abstract representation of the player for hit detection purposes.
    modelCircle: Physics.circle(x, y, 16),

    currentWeapon: weaponTracker,
    lastWeaponUse: 0,  // allow to use weapon immediately
    inventory: [ weaponTracker ],

    lastWeaponChangeID: 0,  // Track client weapon change keypresses
    
    player: {
      id: spark.id,  // Used by clients to self-identify
      n:  Util.getRandomInt(0, numCharacters),  // character number

      // Place the player in a random location on the map.
      // TODO: Account for the contents of the underlying tile - only place users into locations that
      // make sense, or at map-specific spawn points.
      x: x,
      y: y,
      d: 0.0,  // Direction in radians
      // Restore if used by the client.  i: [ defaultWeaponIndex ],  // Inventory
      w: defaultWeaponIndex,  // Current weapon number
      h: 10,  // health
      s: 0,  // sound number
      sC: 0,  // sound state machine
      wC: 0,  // Weapon use state machine - increments on actual weapon use. Used for triggering sounds and other actions.
      // 'dead' variable starts undefined and gets set true on player death.
    }
  };
}

function updatePlayerFromClientControls(playerInfo, currentLevel) {
  let player = playerInfo.player;
  if (player.dead) {
    // Dead, can't do much of anything but bleed out.
    return;
  }
  
  let controlInfo = playerInfo.latestControlInfo;
  if (controlInfo.R) {  // Right
    player.d += playerMaxTurnPerFrameRadians;
  }
  if (controlInfo.L) {  // Left
    player.d -= playerMaxTurnPerFrameRadians;
  }
  if (controlInfo.F) {  // Forward
    player.x += playerSpeedPxPerFrame * Math.sin(player.d);
    player.y -= playerSpeedPxPerFrame * Math.cos(player.d);
    Level.clampPositionToLevel(currentLevel, player);
    playerInfo.modelCircle.centerX = player.x;
    playerInfo.modelCircle.centerY = player.y;
  }
  if (controlInfo.B) {  // Back
    player.x -= playerSpeedPxPerFrame * Math.sin(player.d);
    player.y += playerSpeedPxPerFrame * Math.cos(player.d);
    Level.clampPositionToLevel(currentLevel, player);
    playerInfo.modelCircle.centerX = player.x;
    playerInfo.modelCircle.centerY = player.y;
  }
  if (controlInfo.wC > playerInfo.lastWeaponChangeID) {
    playerInfo.lastWeaponChangeID = controlInfo.wC;
    let weaponID = Util.clamp(controlInfo.w, 0, Weapon.NumWeapons - 1); 
    //Log.debug("Weapon change", controlInfo.w);
    if (player.w !== weaponID) {
      let weaponTracker = playerInfo.inventory.find(tracker => tracker.weaponType.number === weaponID);
      if (weaponTracker) {
        //Log.debug("Found weapon in inventory, changing");
        player.w = weaponID;
        playerInfo.currentWeapon = weaponTracker;
      }
    }
  }
}

// Called at the end of player processing.
function updatePlayer(playerInfo, currentTime) {
  playerInfo.player.a = playerInfo.currentWeapon.currentAmmo;
}

function hitByZombie(playerInfo, currentTime) {
  let player = playerInfo.player;
  player.h -= 1;
  if (player.h <= 0) {
    playerInfo.deadAt = currentTime;
    player.dead = true;
    player.s = 0;  // Last death sound.
  } else {
    // Pick a hurt sound to play. Hurt sounds are at the head of the client's sound array.
    player.s = Util.getRandomInt(0, playerOuchSoundsPerCharacter);
  }
  player.sC++;
}

// Called when a player runs over a weapon.
// Returns true if the player really picked up the weapon (player might not need it if already in inventory).
function pickedUpWeapon(playerInfo, weaponInfo, currentTime) {
  let newWeaponType = weaponInfo.type;
  let player = playerInfo.player;
  let existingWeaponTracker = playerInfo.inventory.find(t => t.weaponType === newWeaponType); 
  if (existingWeaponTracker) {
    if (newWeaponType.type === "Melee") {
      // When we already have a melee weapon we don't pick up another one.
      return false;
    }
    
    // Take the ammo from the ranged weapon.
    existingWeaponTracker.currentAmmo += newWeaponType.ammo;
    return true;
  }

  let weaponTracker = {
    weaponType: newWeaponType,
    currentAmmo: newWeaponType.ammo
  };
  playerInfo.inventory.push(weaponTracker);
  // Restore if used by the client  player.inv.push(newWeaponType.number);

  if (playerInfo.currentWeapon.weaponType.awesomeness < newWeaponType.awesomeness) {
    playerInfo.currentWeapon = weaponTracker;
    player.w = newWeaponType.number;
  }
  return true;
}

function dropWeapon(playerInfo, weaponTracker) {
  playerInfo.inventory.remove(weaponTracker);
  // Restore if used by the client  playerInfo.player.inv.remove(weaponTracker.weaponType.number);
  if (playerInfo.currentWeapon.weaponType.number === weaponTracker.weaponType.number) {
    playerInfo.inventory.sort((a, b) => b.weaponType.awesomeness - a.weaponType.awesomeness);
    playerInfo.currentWeapon = playerInfo.inventory[0];
    playerInfo.player.w = playerInfo.inventory[0].weaponType.number;
  }
}


// --------------------------------------------------------------------
// Exports
module.exports.spawnPlayer = spawnPlayer;
module.exports.updatePlayer = updatePlayer;
module.exports.updatePlayerFromClientControls = updatePlayerFromClientControls;
module.exports.hitByZombie = hitByZombie;
module.exports.pickedUpWeapon = pickedUpWeapon;
module.exports.dropWeapon = dropWeapon;