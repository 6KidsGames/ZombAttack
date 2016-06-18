//
// Root Gulp file for building the project code.
// Gulp home is at http://gulpjs.com/ 
//

"use strict";

// Base Gulp library.
var gulp = require('gulp');

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

// Used to compile sprite images into a spritesheet with all images listed in JSON for Pixi consumption.
// TODO var spritesheet = require('spritesheet-js');
// TODO var spritesmith = require('gulp.spritesmith');
// TODO var imagemin = require('gulp-imagemin');
// TODO var texturepacker = require('spritesmith-texturepacker');

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
    // TODO 'assemble-spritesheet',
    'copy-sprites',
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

// http://www.addlime.com/blog/game-development/using-gulp-automate-texture-atlas-sprite-sheet-creation-phaser/
/* TODO - toolchain not working on Windows - debug and get spritesheets running.
   For now we simply copy the source sprite files across to the output instead of generating an optimized spritesheet.
gulp.task('assemble-spritesheet', ['clean'], function() {
    var spriteData = gulp.src(Paths.SpritesRoot + '/*.png')
        .pipe(spritesmith({
            imgName: 'ZombieDefense.png',
            cssName: 'ZombieDefense.json',
            algorithm: 'binary-tree',
            cssTemplate: texturepacker
    }));
    spriteData.img.pipe(imagemin()).pipe(gulp.dest(Paths.SiteImagesOutput));
    spriteData.css.pipe(gulp.dest(Paths.SiteCssOutput));
});
*/
gulp.task('copy-sprites', ['clean'], function () {
    // Individual sprite files. TODO - change to compiling a spritesheet - see above.
    return pump([
            gulp.src([ Paths.SpritesRoot + '/*.png' ]),
            gulp.dest(Paths.SiteImagesOutput)
        ]);
});
