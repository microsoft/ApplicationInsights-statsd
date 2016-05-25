"use strict";

const gulp        = require("gulp"),
      tslint      = require("gulp-tslint"),
      tsc         = require("gulp-typescript"),
      runSequence = require("run-sequence"),
      mocha       = require("gulp-mocha"),
      istanbul    = require("gulp-istanbul"),
      sloc        = require("gulp-sloc"),
      sourcemaps  = require("gulp-sourcemaps");
    
gulp.task("lint", function() {
    return gulp.src([
        "lib/appinsights.ts",
        "tests/appinsights.test.ts"
    ])
    .pipe(tslint())
    .pipe(tslint.report("verbose"));
});

const tsProject = tsc.createProject("tsconfig.json");

gulp.task('sloc', function(){
    return tsProject.src()
        .pipe(tsc(tsProject))
        .js
        .pipe(sloc());
});

gulp.task("build", ["lint"], function() {
    const tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsc(tsProject));
    
    return tsResult.js
        .pipe(sourcemaps.write("./", { sourceRoot: __dirname }))
        .pipe(gulp.dest(function(file) {
            return file.base;
        }));
});

gulp.task("istanbul:hook", ["build"], function() {
    return gulp.src([
        'lib/appinsights.js'
        ])
        // Covering files
        .pipe(istanbul())
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire());
});

gulp.task("test", ["istanbul:hook"], function() {
    return gulp.src('tests/appinsights.test.js')
        .pipe(mocha({ui: 'bdd'}))
        .pipe(istanbul.writeReports());
});

gulp.task("default", function (cb) {
    runSequence("test", cb);
});