const gulp = require('gulp');
const gnf = require('gulp-npm-files');
const rename = require('gulp-rename');

const { ENV } = process.env;
const distPath = `./dist/${ENV}/`;

const filesArr = [
    './src/index.html',
    './src/js/**/*',
    './src/css/**/*'
];
if (ENV === 'EXTENSION') {
    filesArr.push('./src/manifest.json');
}

gulp.task('copy-files', function () {
    gulp.src(filesArr, { base: './src' }).pipe(gulp.dest(distPath));
});

gulp.task('set-env', function () {
    gulp.src(`./src/env/${ENV}.env.js`)
        .pipe(rename('env.js'))
        .pipe(gulp.dest(`${distPath}/env/`));
});

// Copy dependencies to build/node_modules/
gulp.task('copy-npm-dependencies', function() {
    gulp.src(gnf(), {base:'./'}).pipe(gulp.dest(distPath));
});

gulp.task('build', ['copy-files', 'copy-npm-dependencies', 'set-env']);
