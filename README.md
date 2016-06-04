# ScratchPlus class - 2016 summer project

Public repo for use with the Summer 2016 class project.

## Getting started

1. Install Git from https://git-scm.com/download/win (for Windows), or https://git-scm.com/download for other operating systems.
1. Install Node.js from https://nodejs.org (click the Current button to get the latest).
1. Install Visual Studio Code from https://www.visualstudio.com/products/code-vs
1. Open a Windows console: Windows+R (to open the Run box), then type `cmd` and press Enter.
1. Create a new folder: `mkdir c:\Class2016`
1. Change location to that folder: `cd c:\Class2016`
1. Pull down a copy of the code from this repo, using Git: `git clone https://github.com/erikma/ScratchPlus2016Project.git .`
1. Run Setup.cmd by entering: `Setup`

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
* To stop running, press `Shift+F5`.
* If you are already running and have changed code and want to run again, use `Shift+F5` to stop, `Ctrl+Shift+B` to build, then `F5` to run.

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

## Useful Links

* JSDoc - JavaScript doc comment format. http://usejsdoc.org/
