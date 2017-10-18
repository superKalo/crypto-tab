const gulp = require('gulp');
const rename = require('gulp-rename');
const notify = require('gulp-notify');
const replace = require('gulp-replace-task');

const { ENV } = process.env;
const distPath = `./dist/${ENV}/`;

const filesArr = [
    './src/js/**/*',
    './src/img/**/*',
    './src/css/**/*'
];
if (ENV === 'extension') {
    filesArr.push('./src/manifest.json');
}

gulp.task('copy-files', function () {
    gulp.src(filesArr, { base: './src' }).pipe(gulp.dest(distPath)).pipe(notify({
      message: 'Done!',
      onLast: true
    }));
});

gulp.task('preprocess', function () {
    gulp.src('./src/index.html')
        .pipe(replace({
            patterns: [{
                match: 'title',
                replacement: ENV === 'extension' ? 'New Tab' : 'Crypto Tab'
            }]
        }))
        .pipe(gulp.dest(distPath));
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

gulp.task('build', ['copy-files', 'preprocess', 'copy-npm-dependencies', 'set-env']);

gulp.task('build:watch', function () {
    gulp.watch('./src/**/*', ['copy-files']);
});
