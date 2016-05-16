# ScratchPlus class - 2016 summer project

Public repo for use with the Summer 2016 class project.

## Getting started

1. Install Git from https://git-scm.com/download/win (for Windows), or https://git-scm.com/download for other operating systems.
1. Install Node.js from https://nodejs.org (click the Current button to get the latest).
1. Install Visual Studio Code from https://www.visualstudio.com/products/code-vs
1. Open a Windows console: Windows+R (to open the Run box), then type `cmd` and press Enter.
1. Create a new folder: `mkdir c:\Class2016`
1. Change location to that folder: `cd c:\Class2016`
1. Pull down a copy of the code from this repo, using Git: `git clone https://github.com/erikma/ScratchPlus2016Project.git`
1. Run Setup.cmd by entering: `Setup`

## Editing code

1. Open a Windows console and change to the c:\Class2016 folder.
1. Now you can edit everything in the repo by running Visual Studio Code from where you are: `code .` (where `.` means "in this folder")

## Building code
We use Gulp (https://gulpjs.org/) as a simple build system to convert code files into final results. To run a build:

1. Run Gulp: `gulp`

## Running code on your machine
Building the code places the results into the out/ folder.
