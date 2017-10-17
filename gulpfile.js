const gulp = require('gulp');
const gnf = require('gulp-npm-files');
const rename = require('gulp-rename');

gulp.task('copy-files:extension', function () {
    gulp.src([
        './src/index.html',
        './src/manifest.json',
        './src/js/**/*',
        './src/css/**/*'
    ], { base: './src' }).pipe(gulp.dest('./dist/extension/'));
});

gulp.task('set-env', function () {
    gulp.src(`./src/env/${process.env.ENV}.env.js`)
        .pipe(rename('env.js'))
        .pipe(gulp.dest('./dist/extension/env/'));
});



// Copy dependencies to build/node_modules/
gulp.task('copy-npm-dependencies:extension', function() {
    gulp.src(gnf(), {base:'./'}).pipe(gulp.dest('./dist/extension'));
});

gulp.task('build:extension', ['copy-files:extension', 'copy-npm-dependencies:extension', 'set-env']);
