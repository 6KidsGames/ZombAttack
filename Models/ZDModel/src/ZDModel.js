// Game model classes for Zombie Defense.

'use strict';

/**
 * Sent on a timer from the client to the server to update what client control
 * (mouse, keyboard) values are currently in effect.
 */
class PlayerControlInfo {
    constructor() { }

    constructor(currentMousePosition) {
        this.MousePosition = currentMousePosition;
    }

}
