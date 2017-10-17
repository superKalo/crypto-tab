const gulp = require('gulp');

gulp.task('copy:extension', function () {
    gulp.src([
        './src/index.html',
        './src/manifest.json',
        './src/js/**/*',
        './src/css/**/*',
    ], { base: './src' }).pipe(gulp.dest('./dist/extension/'));
});
