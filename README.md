# ScratchPlus class - 2016 summer project

Public repo for use with the ScratchPlus Summer 2016 class project.

## Getting started - First Time Setup

1. Install Git from https://git-scm.com/download/win (for Windows), or https://git-scm.com/download for other operating systems.
1. Install Node.js from https://nodejs.org (click the Current button to get the latest).
1. Install Visual Studio Code from https://www.visualstudio.com/products/code-vs
1. Install Paint.NET from http://www.dotpdn.com/downloads/pdn.html (click the Free Download Now link, then open the resulting ZIP file and run the install executable).
1. Install ImageMagick from http://www.imagemagick.org/script/binary-releases.php#windows
1. Install GraphicsMagick from https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/ - click the highest version number, then click the "Q8" link at the top of the list. 
1. Open a Windows console: Windows+R (to open the Run box), then type `cmd` and press Enter.
1. Create a new folder: `mkdir c:\Class2016`

## Every day - syncing code and installing updates
When you're developing code with a team, you're going to need to get their code as well as upload your code. A good time to do this is at the start of
each day, unless you're in the middle of something.

1. (If you don't already have a console open) Open a Windows console: Windows+R (to open the Run box), then type `cmd` and press Enter.
1. Change location to that folder: `cd c:\Class2016`
1. See if you have any fies changed locally, and if you're in a working branch: `git status` . If you are not on the `master` branch or you have files changed, get it committed and `git checkout master`, or talk to the teacher.
1. Change to the `master` branch, which is where done code gets put. Run: `git checkout master`
1. Pull down a copy of the code from this repo, using Git: `git clone https://github.com/erikma/ScratchPlus2016Project.git .`
1. Run Setup.cmd(which installs the latesthelper code from the Internet) by entering: `Setup`

## Editing code

1. Open a Windows console and change to the c:\Class2016 folder.
1. Now you can edit everything in the repo by running Visual Studio Code from where you are: `code .` (where `.` means "in this folder")

## Building code
We use Gulp (https://gulpjs.org/) as a simple build system to convert code files into final results.
We have integrated Gulp into Visual Studio Code to make life easier. To run a build, press `Ctrl+Shift+B` and ensure you have no errors showing in VSCode.

Building the code places the results into the out/ folder.

You can also run the build in the Windows console if you need to by running the command `gulp`.

## Running code on your machine
We have integrated executing the Node.js server into Visual Studio Code. There are several options for running:

* Pressing the `F5` key will run the project within VSCode.
* If you are already running and have changed code and want to run again, use `Ctrl+Shift+F5` which will stop, build, and start again.

### The Chat Server
Lesson 1 includes running the first code in the class project, the chat program.
When you press `F5` to run the program, you're told to open a browser and go to http://localhost:8080.
You can type messages and press Enter. They will get sent to everyone connected to your server.

But wait! If you're running a server on your computer, and connecting with your browser, and everyone else is doing the same with their own computers, how can you chat to each other?

In order to connect to another person's server you need to find the IP address of their computer. It's displayed on your server, like this:

`This machine has IP address: 10.0.0.16 (interface: Wi-Fi)`

The 10.0.0.16 address is just an example; yours will likely be different. If others take that address and make a browser URL for it:

`http://10.0.0.16:8080`

Everyone can connect to one server, and the chats will be shared.

### Pixi.js as a Game Engine
We're using Pixi.js as our game engine, since it provides fast animation on pretty much any modern browser, and is structured similer
to Flash when programming it.

* Pixi main site: http://www.pixijs.com/
* Leaning Pixi: https://github.com/kittykatattack/learningPixi

## Useful Links

* Learning the basics of JavaScript - https://www.codecademy.com/learn/javascript
* More JavaScript lessons - Khan Academy - games using Processing.js (we're using Pixi.js but many ideas are similar) - https://www.khanacademy.org/computing/computer-programming
* JSDoc - JavaScript doc comment format. http://usejsdoc.org/
