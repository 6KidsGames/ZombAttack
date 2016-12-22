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
echo Installing build tools and Gulp modules we need:
echo   Uglify - for minifying JavaScript
echo   pump - simplifies dealing with Node.js streams when lots of piping is used.
echo   del - deletes files and folders
echo   path - Always better than using string concatenation.
echo   gulp-filter - Allows filtering files out of a stream.
echo     Used to avoid re-minifying scripts when building.
echo     https://github.com/sindresorhus/gulp-filter
echo   vinyl-source-stream - Allows using stream conversion tools.
echo   vinyl-buffer - Buffer/stream conversion
echo   gulp-sourcemaps - Allows generating a Source Map from .min.js files back
echo     to the original uncompressed source, for debugging.
echo   gulp-babel and presets - Uses Babel (http://babeljs.io) to transpile
echo     ES6 JavaScript to ES5 for older browsers.
echo   browserify - Allows using CommonJS modules (Node.js format) for common code
echo     by bundling a main .js file like game.js with all its require()'d
echo     modules into one file for use in the browser. http://browserify.org/
echo   babelify - Shim for combining Babel and Browserify together to get
echo     both ES5 output code and bundled single file.
echo     https://github.com/babel/babelify
echo   gulp-using - Useful for debugging what files are being processed in Gulp.
echo   gulp-sort - Allows sorting the order of paths processed from gulp. 
echo   gulp-rename - Allows renaming the output filename for a stream.
echo ==========================================================================
echo.
call npm install --save-dev gulp-uglify pump del path gulp-filter vinyl-source-stream vinyl-buffer gulp-sourcemaps gulp-babel babel-preset-es2015 browserify babelify gulp-using gulp-sort gulp-rename
if ERRORLEVEL 1 echo ERROR: npm install failed for Gulp modules  with errorlevel %ERRORLEVEL% && exit /b 1

echo.
echo ==========================================================================
echo Installing development modules we need:
echo   Mocha - unit testing framework that uses Node.js and fits well into
echo     Visual Studio Code. https://mochajs.org/
echo   gulp-mocha - Lets us run Mocha within Gulp to run tests each time we build.
echo   Chai - assertion library for use in Mocha. http://chaijs.com/
echo ==========================================================================
echo.
call npm install --save-dev mocha chai gulp-mocha
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
echo   uws - High performance WebSockets implementation for use in Primus.
echo   binary-pack - needed for using a binary-mode transport in Primus.
echo   Express - web site framework. http://expressjs.com/
echo   compression - Express plugin for compressing content sent over the network.
echo   ApplicationInsights - Microsoft Azure telemetry service, which we use for
echo     game site telemetry.
echo.
echo Installed into site\scripts:
echo   Hexi.js - Wrapper onto Pixi.js WebGL/Canvas game engine, Sound.js, and more.
echo     https://github.com/kittykatattack/hexi
echo ==========================================================================
echo.
call npm install --save primus ws uws binary-pack express compression applicationinsights
if ERRORLEVEL 1 echo ERROR: npm install failed for site modules with errorlevel %ERRORLEVEL% && exit /b 1

echo.
echo ==========================================================================
echo Verifying your installed TexturePacker, and accepting EULA.
echo ==========================================================================
echo.
set __TexturePackerExePath="C:\Program Files\CodeAndWeb\TexturePacker\bin\TexturePacker.exe"
if not exist %__TexturePackerExePath% (
    echo ERROR: TexturePacker does not seem to be installed.
    echo ERROR: Make sure you install it from https://www.codeandweb.com/texturepacker/download
    exit /b 1
)
@rem Auto-accept TexturePacker EULA to avoid it waiting for user input during the build.
call reg add "HKCU\Software\code-and-web.de\TexturePacker\licensing" /v agreementsAccepted /t REG_MULTI_SZ /d "eb31f92f7b39abde5722aa4fe9ba6c1c" /f

call %~dp0Init.cmd

echo.
echo ==========================================================================
echo Complete!
echo ==========================================================================
echo.
