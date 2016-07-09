@echo off
rem ScratchPlus Summer 2016 project - setup script for Windows consoles.
rem Can be run over and over if you need to. If you see it change when
rem you do a git pull, you should run it again to pull down any Node.js
rem NPM packages or perform other setups.

where npm
if ERRORLEVEL 1 echo ERROR: NPM not found. Did you install Node.js according to the instructions at https://github.com/erikma/ScratchPlus2016Project ? && exit /b 1

echo.
echo ==========================================================================
echo Ensuring we have all the needed Node.js Package Manager packages.
echo ==========================================================================

echo.
echo ==========================================================================
echo Installing Gulp ^(http://gulpjs.com/^) command line
echo We use this as a cross-operating-system way to build code instead of
echo trying to use Windows command scripts.
echo ==========================================================================
echo.
call npm install --global gulp-cli
if ERRORLEVEL 1 echo ERROR: npm install --global gulp-cli failed with errorlevel %ERRORLEVEL% && exit /b 1
call npm install --save-dev gulp
if ERRORLEVEL 1 echo ERROR: npm install --save-dev gulp failed with errorlevel %ERRORLEVEL% && exit /b 1

echo.
echo ==========================================================================
echo Installing Gulp modules we need:
echo   Uglify - for minifying JavaScript
echo   pump - simplifies dealing with Node.js streams when lots of piping is used.
echo   del - deletes files and folders
echo   path - Always better than using string concatenation.
echo.
echo TODO - get working:
echo   gulp-spritesmith - Lets us assemble a spritesheet/tilemap for Pixi.js
echo     from individual sprite images.
echo     https://www.npmjs.com/package/gulp.spritesmith/
echo   spritesmith-texturepacker - Creates JSON based outputs for spritesheets
echo     from SpriteSmith, for use with Pixi.js.
echo ==========================================================================
echo.
call npm install --save-dev gulp-uglify pump del path
@rem TODO - add some or all of these back and get spritesheet compilation working on Windows: gulp-spritesmith spritesmith-texturepacker gulp-imagemin
if ERRORLEVEL 1 echo ERROR: npm install failed for Gulp modules  with errorlevel %ERRORLEVEL% && exit /b 1

echo.
echo ==========================================================================
echo Installing development modules we need:
echo   Mocha - unit testing framework that uses Node.js and fits well into
echo     Visual Studio Code. https://mochajs.org/
echo   Chai - assertion library for use in Mocha. http://chaijs.com/
echo   spritesheet-js - Assembles individual sprite images into a spritesheet
echo     suitable for Pixi.js. https://github.com/krzysztof-o/spritesheet.js/
echo ==========================================================================
echo.
call npm install --save-dev mocha chai spritesheet-js
if ERRORLEVEL 1 echo ERROR: npm install failed for dev modules with errorlevel %ERRORLEVEL% && exit /b 1

echo.
echo ==========================================================================
echo Installing site modules we need:
echo   Primus - wrapper onto various HTML5 WebSockets libraries, with some additional
echo     sugar. https://github.com/primus/primus . Also includes JSON and BinaryePack
echo     ^(https://github.com/binaryjs/js-binarypack^) which is based on MessagePack
echo     ^(http://msgpack.org/^) wire formats for a choice of debuggability and wire
echo     speed.
echo   ws - needed for Primus as a WebSockets implementation.
echo   binary-pack - needed for using a binary-mode transport in Primus.
echo   Express - web site framework. http://expressjs.com/
echo   compression - Express plugin for compressing content sent over the network.
echo   Pixi.JS - WebGL/Canvas wrapper for Flash-like game and animation authoring.
echo     https://github.com/pixijs/pixi.js
echo ==========================================================================
echo.
call npm install --save primus ws binary-pack express compression pixi.js
if ERRORLEVEL 1 echo ERROR: npm install failed for site modules with errorlevel %ERRORLEVEL% && exit /b 1

call %~dp0Init.cmd

echo.
echo ==========================================================================
echo Complete!
echo ==========================================================================
echo.
