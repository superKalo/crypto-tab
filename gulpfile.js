const gulp = require('gulp');
const gnf = require('gulp-npm-files');
const rename = require('gulp-rename');
const notify = require('gulp-notify');

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
    gulp.src(filesArr, { base: './src' }).pipe(gulp.dest(distPath)).pipe(notify({
      message: 'Done!',
      onLast: true
    }));
});

gulp.task('set-env', function () {
    gulp.src(`./src/env/${ENV}.env.js`)
        .pipe(rename('env.js'))
        .pipe(gulp.dest(`${distPath}/env/`));
});

// Copy NPM dependencies
gulp.task('copy-npm-dependencies', function() {
    gulp.src([
        'node_modules/axios/dist/axios.min.js',
        'node_modules/chart.js/dist/Chart.min.js',
        'node_modules/moment/min/moment.min.js',
        'node_modules/super-repo/lib/index.js'
    ]).pipe(gulp.dest(`${distPath}/lib/`));
});

gulp.task('build', ['copy-files', 'copy-npm-dependencies', 'set-env']);

gulp.task('build:watch', function () {
    gulp.watch('./src/**/*', ['copy-files']);
});
