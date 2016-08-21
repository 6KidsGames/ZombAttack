//
// Root Gulp file for building the project code.
// Gulp home is at http://gulpjs.com/ 
//

"use strict";

// Base Gulp library.
var gulp = require('gulp');

// Node.js's exec() for use in running command line tools.
var execCommand = require('child_process').exec;

// Use the path class for path joining.
var path = require('path');

// Uglify minifies JavaScript in our project to reduce download times for browsers.
// https://github.com/terinjokes/gulp-uglify
var uglify = require('gulp-uglify');

// pump makes it easier to debug chains of Node.js streams.
// https://github.com/mafintosh/pump
var pump = require('pump');

// del allows cleaning up folders and files. 
const del = require('del');

// Allow filtering file name sets.
// https://github.com/sindresorhus/gulp-filter
const filter = require('gulp-filter');

// For debugging filesets in streams.
// https://www.npmjs.com/package/gulp-using
const using = require('gulp-using');

// Vinyl stream management.
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

// Helper method - allows recursive copying a directory structure.
// http://stackoverflow.com/questions/25038014/how-do-i-copy-directories-recursively-with-gulp#25038015
// 'finishedAsyncTaskCallback' param is optional and is the Gulp completion callback for asynchronous tasks.
// If specified it will be called after this method completes.
gulp.copy = function(src, dest, finishedAsyncTaskCallback) {
    return pump([
        gulp.src(src, { base:"." }),
        gulp.dest(dest)
    ], finishedAsyncTaskCallback);
};

// Conversion tools that use Babel (http://babeljs.io) to convert first from our ES6 JavaScript files
// (like game.js) into CommonJS, then from CommonJS to browser-compatible ES% JavaScript.
const browserify = require('browserify');
const babel      = require('gulp-babel');

// Allows sorting the file ordering from gulp.src.
// https://www.npmjs.com/package/gulp-sort
const sort = require('gulp-sort');

// Allows creating Source Maps - our .min.js minified files from Uglify
// are hard to debug. Source Maps make it far easier.
// http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/
const sourcemaps  = require('gulp-sourcemaps');

// Keep important paths here for reference. Only use Paths.Xxx in code below instead of duplicating these strings.
var Paths = {
    OutputRoot: 'out',
    SiteOutput: 'out/site',
    SiteScriptsOutput: 'out/site/scripts',
    SiteImagesOutput: 'out/site/images',
    SiteCssOutput: 'out/site/css',
    SiteSoundsOutput: 'out/site/sounds',
    SiteScriptMapsOutput: 'out/site/maps',

    // Web site hosted via Node.js, utilizing Primus for WebSockets support.
    Site: 'site',
    SiteAll: 'site/**',
    SiteScripts: 'site/scripts',
    SiteScriptsAll: 'site/scripts/**',
    Hexi: 'External/Hexi.js',

    // Node.js packages.
    PrimusNodeJsRoot: 'node_modules/primus',
    PrimusWebSiteScriptsRoot: 'node_modules/primus/dist',  // The scripts intended for use from a web site client.

    // Sprite graphics.
    SpritesRoot: 'Sprites',

    // Sound files.
    SoundsRoot: 'Sounds',

    // Levels - map definitions and tilesets.
    LevelsRoot: 'Levels',
    TilesRoot: 'Tiles',
};

// ---------------------------------------------------------------------------
// Primary entry point commands: Running 'gulp' cleans and runs build,
// 'build' is an alias for 'default' and required by Visual Studio Code
// integration.
// ---------------------------------------------------------------------------
gulp.task('default', [
    'copy-site-content',
    'convert-scripts-es6-to-es5-minify-sourcemap',
    'copy-Hexi',
    'copy-web-primus-script',
    'assemble-spritesheet',
    'assemble-tileset',
    'copy-deployment-files',
    'copy-sounds',
    'copy-levels'
]);
gulp.task('build', ['default']);

gulp.task('clean', function () {
    // Clean up temp and output directories.
    return del([ Paths.OutputRoot ]);
});

gulp.task('copy-site-content', ['clean'], function () {
    // Base content - Node.js execution script, HTML content, static scripts.
    return gulp.copy([ Paths.SiteAll ], Paths.OutputRoot);
});

gulp.task('copy-Hexi', ['clean'], function () {
    return pump([
            gulp.src([ Paths.Hexi + '/**/*.js' ]),
            gulp.dest(Paths.SiteScriptsOutput)
        ]);
});

gulp.task('copy-sounds', ['clean'], function () {
    return gulp.copy([ Paths.SoundsRoot + '/**/*.mp3' ], Paths.SiteOutput);
});

gulp.task('copy-levels', ['clean'], function () {
    return gulp.copy([ Paths.LevelsRoot + '/**/*.json' ], Paths.SiteOutput);
});

gulp.task('copy-deployment-files', ['clean'], function() {
    return pump([
            gulp.src([ "package.json", "Dockerfile" ]),
            gulp.dest(Paths.OutputRoot)
        ]);
});

gulp.task('copy-web-primus-script', ['clean'], function() {
    // Primus web site scripts into 'scripts' directory.
    return pump([
            gulp.src([ Paths.PrimusWebSiteScriptsRoot + '/*.js' ]),
            gulp.dest(Paths.SiteScriptsOutput)
        ]);
});

// Convert ES6 JavaScript to ES5 JavaScript for scripts in the site/scripts directory
// that are not already minified.
gulp.task('convert-scripts-es6-to-es5-minify-sourcemap', ['copy-site-content'], function () {
    return pump([
        gulp.src(Paths.SiteScripts + '/*.js'),
        // using(),
        babel({ "presets": [ "es2015" ] }),
        sourcemaps.init(),
        uglify(),
        sourcemaps.write('.'),  // Path is relative to output directory, writes script.js.map
        gulp.dest(Paths.SiteScriptsOutput)
    ]);
});

gulp.task('assemble-tileset', [ 'clean'], function() {
  return runTexturePacker('ZombieDefenseTileset', Paths.TilesRoot);
});

gulp.task('assemble-spritesheet', ['clean'], function() {
  return runTexturePacker('ZombieDefenseSpritesheet', Paths.SpritesRoot);
});

// Use Texture Packer basic mode to create a spritesheet from all sprite files under the sprite root folder.
// Based on: http://www.nonostante.io/devblog/2015-12-02-automate-sprite-management-with-texture-packer.html
// With: https://www.codeandweb.com/texturepacker/documentation
function runTexturePacker(baseFileName, sourceDirectoryOrFiles) {
    var texturePackerCmd = '"C:\\Program Files\\CodeAndWeb\\TexturePacker\\bin\\TexturePacker.exe"';
    var outputSpritesheetImageFile = path.join(Paths.SiteImagesOutput, baseFileName + ".png");
    var outputSpritesheetDataFile = path.join(Paths.SiteImagesOutput, baseFileName + ".json");

    console.log("Building in current working folder:", __dirname);

    var command = texturePackerCmd +
        " --data " + outputSpritesheetDataFile +
        " --sheet " + outputSpritesheetImageFile +
        " --trim-sprite-names" +  // Removes .png extensions so you can refer to sprites by their base names (e.g. flower instead of flower.png)
        " --format json" +  // Create a JSON-hash output format that Pixi/Hexi likes.
        " --algorithm Basic" +  // Anything more means buying a TexturePacker pro license per student.
        " --extrude 0" +  // No extrude might cause flickering, but pro license needed.
        " --trim-mode None" +  // Trim optimizations require pro license.
        " --png-opt-level 0" +  // PNG optimization requires pro license
        " --disable-auto-alias" +  // Automatic deduplication of sprite images is a pro license feature
        " " + sourceDirectoryOrFiles;

    return execCommand(command, (err, stdout, stderr) => {
      if (err) {
        console.log("Failed running TexturePacker command:", command);
        //console.log('TexturePacker error:', err);
        //console.log('TexturePacker stderr:', stderr);
        //console.log('TexturePacker stdout:', stdout);
        throw err;
      }
    });
}
