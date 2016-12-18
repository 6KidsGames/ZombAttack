# ZombAttack - 6KidsGames 2016 Summer Project

![6KidsGames Logo](https://github.com/6KidsGames/ZombAttack/blob/master/Sprites/6KidsLogo.png "6KidsGames")

![ZombAttack Logo](https://github.com/6KidsGames/ZombAttack/blob/master/Sprites/ZombAttackLogo1.png "ZombAttack")


# About This Repo
This repo contains the first large-scale game created by the kid-developers at 6 Kids Games,
from May through October, 2016.


# Using This Repo

## Getting started - First Time Setup

1. Install Git from https://git-scm.com/download/win (for Windows), or https://git-scm.com/download for other operating systems.
1. Install Node.js from https://nodejs.org (click the Current button to get the latest).
1. Install Visual Studio Code from https://www.visualstudio.com/products/code-vs
1. Install Paint.NET from http://www.dotpdn.com/downloads/pdn.html (click the Free Download Now link, then open the resulting ZIP file and run the install executable).
1. Install TexturePacker from https://www.codeandweb.com/texturepacker/download . We use this tool during the build for creating spritesheets. For basic info, see https://www.codeandweb.com/texturepacker/documentation
1. Install the Tiled tilemap editor from https://thorbjorn.itch.io/tiled . The Art/Website team uses this for designing tile maps. The main website is at http://www.mapeditor.org/
1. Open a Windows console: Windows+R (to open the Run box), then type `cmd` and press Enter.
1. Create a new folder: `mkdir c:\ZombAttack`
1. Move to that folder: `cd c:\ZombAttack`
1. Clone the Git repo to your new folder: `git clone https://github.com/6KidsGames/ZombAttack .`

## Every day - syncing code and installing updates
When you're developing code with a team, you're going to need to get their code as well as upload your code. A good time to do this is at the start of
each day, unless you're in the middle of something.

1. (If you don't already have a console open) Open a Windows console: Windows+R (to open the Run box), then type `cmd` and press Enter.
1. Change location to that folder: `cd c:\ZombAttack`
1. See if you have any files changed locally, and if you're in a working branch: `git status` .
1. If you are not on the `master` branch, run `git checkout master`
1. If "package.json" is listed in red, run `git checkout -- package.json`
1. If you have other files changed, get it committed and `git checkout master`, or talk to the teacher.
1. Pull down the latest code: `git pull`
1. Run Setup.cmd (which installs the latest helper code from the Internet) by entering: `Setup`
1. Run Visual Studio Code: `code .`

### Changing the Code
When you want to make changes that others in your team will get to see, you need to use Git to create
what's called a "topic branch," which tells Git to create a container for your changes.
When you are done with your changes you'll use GitHub to send the changes for teacher approval. 

1. To create a topic branch (container) - be sure you've run Setup.cmd, and type: `cb WhatYouAreWorkingOn` where "WhatYouAreWorkingOn" is a short description of the work you are doing (without spaces). For example, it could be AddSprites or FixNetworkErrors or something else.
1. Now you're ready to make changes to the code, graphics, sounds, and other parts of the system.
1. When you have something done that you want to check in, use `git commit -a` and give a good description of the changes you made.
1. When you are done with everything in your change, it is time to push your code to the cloud (GitHub.com). Use `push`.
1. Now you can request that the team accept the changes in your topic branch. In your browser go to https://github.com/6KidsGames/ZombAttack and click the `New pull request` button.
1. Select your topic branch name from the list.
1. On the next page, click the "Create pull request" button.
1. Add some information into the pull request instructions if you need to, then click "Create pull request"

The team can now see a pull request waiting. Tell the teacher as well. The teacher can merge your pull request into master.

## Building code
We use Gulp (https://gulpjs.org/) as a simple build system to convert code files into final results.
We have integrated Gulp into Visual Studio Code to make life easier. To run a build, press `Ctrl+Shift+B` and ensure you have no errors showing in VSCode.

Building the code places the results into the out/ folder.

You can also run the build in the Windows console if you need to by running the command `gulp`.

## Running code on your machine
We have integrated executing the Node.js server into Visual Studio Code. There are several options for running:

* Pressing the `F5` key will run the project within VSCode.
* If you are already running and have changed code and want to run again, use `Ctrl+Shift+F5` which will stop, build, and start again.

### Hexi.js as a Game Engine
We're using Hexi.js as our game engine, since its Pixi.js engine provides fast animation on pretty much any modern browser,
and is structured similar to Flash when programming it. Hexi also includes Sound.js and other helpful classes to help us
avoid writing lots of extra code.

* Hexi main site: https://github.com/kittykatattack/hexi 
* Pixi main site: http://www.pixijs.com/
* Leaning Pixi: https://github.com/kittykatattack/learningPixi

## Useful Links

* Learning the basics of JavaScript - https://www.codecademy.com/learn/javascript
* More JavaScript lessons - Khan Academy - games using Processing.js (we're using Pixi.js but many ideas are similar) - https://www.khanacademy.org/computing/computer-programming
* JSDoc - JavaScript doc comment format. http://usejsdoc.org/
* Valve Software article on network game engine, lag, and interpolation: https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking
* Related game design paper: https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization
