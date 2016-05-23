//
// Root Gulp file for building the project code.
// Gulp home is at http://gulpjs.com/ 
//

"use strict";

// Base Gulp library.
var gulp = require('gulp');

// Use the path class for path joining.
var path = require('path');

// Uglify minifies JavaScript in our project to reduce download times for browsers browsing web sites.
// https://github.com/terinjokes/gulp-uglify
var uglify = require('gulp-uglify');

// pump makes it easier to debug chains of Node.js streams.
// https://github.com/mafintosh/pump
var pump = require('pump');

// del allows cleaning up folders and files. 
const del = require('del');

// Keep important paths here for reference. Only use Paths.Xxx in code below instead of duplicating these strings.
Paths = {
    Site: 'site/',
    OutputRoot: 'out/',
    SiteOutput: 'out/site/'
};

gulp.task('default', function() {
    gulp.run('compress-site-scripts');
});

gulp.task('clean', function (done) {
    // Clean up temp and output directories.
    del([Paths.OutputRoot]);
});

gulp.task('compress-site-script', function (cb) {
    pump([
            gulp.src(Paths.Site + 'scripts/**/*.js'),
            uglify(),
            gulp.dest(path.join(Paths.SiteOutput, 'scripts'))
        ],
        cb);
});
