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
