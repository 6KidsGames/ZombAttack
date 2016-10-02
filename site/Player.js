// Player-related data and code.

const Level = require('./Level');
const Log = require('./Log');
const Physics = require('./Physics');
const Util = require('./Util');
const Weapon = require('./Weapon');

const playerMaxTurnPerFrameRadians = 0.3;
const playerSpeedPxPerFrame = 10;
const playerOuchSoundsPerCharacter = 2;

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
    currentAmmo: defaultWeaponType.currentAmmo,
  };

  return {
    spark: spark,

    latestControlInfo: { },

    // The abstract representation of the player for hit detection purposes.
    modelCircle: Physics.circle(x + 16, y + 16, 16),

    currentWeapon: weaponTracker,
    lastWeaponUse: 0,  // allow to use weapon immediately
    
    player: {
      id: spark.id,  // Used by clients to self-identify
      name: '',

      // Place the player in a random location on the map.
      // TODO: Account for the contents of the underlying tile - only place users into locations that
      // make sense, or at map-specific spawn points.
      x: x,
      y: y,
      dir: 0.0,
      inv: [ weaponTracker ],  // Inventory
      w: defaultWeaponIndex,  // Weapon number
      hl: 10,  // health
      snd: 0,  // sound number
      sndC: 0,  // sound state machine
    }
  };
}

function updatePlayerFromClientControls(playerInfo, currentLevel) {
    let player = playerInfo.player;
    let controlInfo = playerInfo.latestControlInfo;

    if (controlInfo.turnRight) {
        player.dir += playerMaxTurnPerFrameRadians;
    }
    if (controlInfo.turnLeft) {
        player.dir -= playerMaxTurnPerFrameRadians;
    }
    if (controlInfo.fwd) {
        player.x += playerSpeedPxPerFrame * Math.sin(player.dir);
        player.y -= playerSpeedPxPerFrame * Math.cos(player.dir);
        Level.clampPositionToLevel(currentLevel, player);
        playerInfo.modelCircle.centerX = player.x + 16;
        playerInfo.modelCircle.centerY = player.y + 16;
    }
    if (controlInfo.back) {
        player.x -= playerSpeedPxPerFrame * Math.sin(player.dir);
        player.y += playerSpeedPxPerFrame * Math.cos(player.dir);
        Level.clampPositionToLevel(currentLevel, player);
        playerInfo.modelCircle.centerX = player.x + 16;
        playerInfo.modelCircle.centerY = player.y + 16;
    }
}

function updatePlayer(playerInfo, currentTime) {

}

function hitByZombie(playerInfo, currentTime) {
  let player = playerInfo.player;
  player.hl -= 1;
  if (player.hl <= 0) {
    // TODO: Player is dead, what animation and sound to send to the client, and what state machine for death (e.g. blood puddle, spurt particles, ...)
    playerInfo.dead = true;
    playerInfo.deadAt = currentTime;
  } else {
    // Pick a hurt sound to play.
    player.snd = Util.getRandomInt(0, playerOuchSoundsPerCharacter);
    player.sndC++;
  }
}

// Called when a player runs over a weapon.
// Returns true if the player really picked up the weapon (player might not need it if already in inventory).
function pickedUpWeapon(playerInfo, weaponInfo, currentTime) {
  let newWeaponType = weaponInfo.type;
  let existingWeaponTracker = playerInfo.player.inv.find(t => t.weaponType === newWeaponType); 
  if (existingWeaponTracker) {
    if (newWeaponType.type === "Melee") {
      return false;
    }
    existingWeaponTracker.ammo += newWeaponType.ammo;
    return true;
  }

  let weaponTracker = {
    weaponType: newWeaponType,
    currentAmmo: newWeaponType.ammo
  }
  playerInfo.player.inv.push(weaponTracker);

  if (playerInfo.currentWeapon.weaponType.awesomeness < newWeaponType.awesomeness) {
    playerInfo.currentWeapon = weaponTracker;
    playerInfo.player.w = newWeaponType.number;
  }
  return true;
}


// --------------------------------------------------------------------
// Exports
module.exports.spawnPlayer = spawnPlayer;
module.exports.updatePlayer = updatePlayer;
module.exports.updatePlayerFromClientControls = updatePlayerFromClientControls;
module.exports.hitByZombie = hitByZombie;
module.exports.pickedUpWeapon = pickedUpWeapon;
