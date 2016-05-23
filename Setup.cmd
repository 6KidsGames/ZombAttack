@echo off
rem ScratchPlus Summer 2016 project - setup script for Windows consoles.

echo.
echo ==========================================================================
echo Ensuring we have all the needed Node Package Manager packages.
echo ==========================================================================

echo.
echo Installing Gulp ^(http://gulpjs.com/^) command line
echo We use this as a better way to build code than trying to use Windows command scripts.
echo.
call npm install --global gulp-cli
if ERRORLEVEL 1 echo ERROR: npm install --global gulp-cli failed with errorlevel %ERRORLEVEL% && exit /b 1
call npm install --save-dev gulp
if ERRORLEVEL 1 echo ERROR: npm install --save-dev gulp failed with errorlevel %ERRORLEVEL% && exit /b 1

echo.
echo Installing Gulp modules we need:
echo   Uglify - for minifying JavaScript
echo   pump - simplifies dealing with Node.js streams when lots of piping is used.
echo   del - deletes files and folders
echo   path - Always better than using string concatenation.
echo.
call npm install --save-dev gulp-uglify pump del path
if ERRORLEVEL 1 echo ERROR: npm install failed for Gulp modules  with errorlevel %ERRORLEVEL% && exit /b 1

echo.
echo Installing site modules we need:
echo   primus - wrapper onto various HTML5 WebSockets libraries, with some additional
echo     sugar. https://github.com/primus/primus . Also includes JSON and BinaryePack
echo     ^(https://github.com/binaryjs/js-binarypack^) which is based on MessagePack
echo     ^(http://msgpack.org/^) wire formats for a choice of debuggability and wire
echo     speed.
echo   uws - fast WebSockets implementation, compatible with Primus.
echo   ws - needed for client side of connection to uws 
echo.
call npm install --save primus uws ws
if ERRORLEVEL 1 echo ERROR: npm install failed for site modules with errorlevel %ERRORLEVEL% && exit /b 1

echo.
echo ==========================================================================
echo Complete!
echo ==========================================================================
echo.
