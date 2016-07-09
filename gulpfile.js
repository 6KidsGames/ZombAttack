//
// Root Gulp file for building the project code.
// Gulp home is at http://gulpjs.com/ 
//

"use strict";

// Base Gulp library.
var gulp = require('gulp');

// Node.js's exec() for use in running command line tools.
var exec = require('child_process').exec;

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

// Keep important paths here for reference. Only use Paths.Xxx in code below instead of duplicating these strings.
var Paths = {
    OutputRoot: 'out',
    SiteOutput: 'out/site',
    SiteScriptsOutput: 'out/site/scripts',
    SiteImagesOutput: 'out/site/images',
    SiteCssOutput: 'out/site/css',

    // Web site hosted via Node.js, utilizing Primus for WebSockets support.
    Site: 'site',
    SiteAll: 'site/**',
    SiteScripts: 'site/scripts',
    SiteScriptsAll: 'site/scripts/**',

    // Node.js packages.
    PrimusNodeJsRoot: 'node_modules/primus',
    PrimusWebSiteScriptsRoot: 'node_modules/primus/dist',  // The scripts intended for use from a web site client.
    PixiJsRoot: 'node_modules/pixi.js/bin',

    // Sprite graphics.
    SpritesRoot: 'Sprites',
};

// ---------------------------------------------------------------------------
// Primary entry point commands: Running 'gulp' cleans and runs build,
// 'build' is an alias for 'default' and required by Visual Studio Code
// integration.
// ---------------------------------------------------------------------------
gulp.task('default', [
    'copy-site-content',
    'compress-site-scripts',
    'copy-web-primus-script',
    'copy-pixi-js-script',
    'assemble-spritesheet'
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

gulp.task('copy-web-primus-script', ['clean'], function() {
    // Primus web site scripts into 'scripts' directory.
    return pump([
            gulp.src([ Paths.PrimusWebSiteScriptsRoot + '/*.js' ]),
            gulp.dest(Paths.SiteScriptsOutput)
        ]);
});

gulp.task('copy-pixi-js-script', ['clean'], function() {
    // Primus web site scripts into 'scripts' directory.
    return pump([
            gulp.src([ Paths.PixiJsRoot + '/*' ]),
            gulp.dest(Paths.SiteScriptsOutput)
        ]);
});

// Minify scripts - .js files in /site/scripts/... get converted to .js.min files
// in /out/site/scripts
gulp.task('compress-site-scripts', ['copy-site-content'], function () {
    return pump([
            gulp.src(Paths.SiteScriptsAll + '/*.js'),
            uglify(),
            gulp.dest(Paths.SiteScriptsOutput)
        ]);
});

// Use Texture Packer basic mode to create a spritesheet from all sprite files under the sprite root folder.
// Based on: http://www.nonostante.io/devblog/2015-12-02-automate-sprite-management-with-texture-packer.html
// With: https://www.codeandweb.com/texturepacker/documentation
gulp.task('assemble-spritesheet', ['clean'], function() {
    var texturePackerCmd = '"C:\\Program Files\\CodeAndWeb\\TexturePacker\\bin\\TexturePacker.exe" ';
    var spritesheetBaseName = "ZombieDefenseSpritesheet";
    var outputSpritesheetImageFile = path.join(Paths.SiteImagesOutput, spritesheetBaseName + ".png");
    var outputSpritesheetDataFile = path.join(Paths.SiteImagesOutput, spritesheetBaseName + ".json");

    return exec(texturePackerCmd +
        " --data " + outputSpritesheetDataFile +
        " --sheet " + outputSpritesheetImageFile +
        " --trim-sprite-names" +  // Removes .png extensions so you can refer to sprites by their base names (e.g. flower instead of flower.png)
        " --format json" +  //Create a JSON-hash output format that Pixi/Hexi likes.
        " --algorithm Basic" +  // Anything more means buying a TexturePacker pro license per student.
        " --extrude 0" +  // No extrude might cause flickering, but pro license needed.
        " --trim-mode None" +  // Trim optimizations require pro license.
        " --png-opt-level 0" +  // PNG optimization requires pro license
        " --disable-auto-alias" +  // Automatic deduplication of sprite images is a pro license feature
        " " + Paths.SpritesRoot);
});
