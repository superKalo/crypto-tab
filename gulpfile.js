const { src, dest, series, watch } = require('gulp');
const rename = require('gulp-rename');
const notify = require('gulp-notify');
const replace = require('gulp-replace-task');

const { ENV } = process.env;
const distPath = `./dist/${ENV}/`;

const filesArr = [
    './src/js/**/*',
    './src/css/**/*'
];
if (ENV === 'extension') {
    filesArr.push('./src/manifest.json', './src/icons/**/*');
}

function copyFiles() {
    return src(filesArr, { base: './src' })
        .pipe(dest(distPath))
        .pipe(notify({
            message: 'Done!',
            onLast: true
        }));
}

function copyFavicons() {
    return src('./src/favicons/*')
        .pipe(dest(distPath));
}

function preprocess() {
    return src('./src/index.html')
        .pipe(replace({
            patterns: [
                {
                    match: 'title',
                    replacement: ENV === 'extension' ? 'New Tab' : 'Crypto Tab'
                },
                {
                    match: 'favicons',
                    replacement: ENV === 'extension' ? '' :
                        `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
                        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
                        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
                        <link rel="manifest" href="/manifest.json">
                        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
                        <meta name="theme-color" content="#ffffff">`
                },
                {
                    match: 'socialMediaTags',
                    replacement: ENV === 'extension' ? '' :
                        `<!-- Schema.org for Google -->
                        <meta itemprop="name" content="Crypto Tab">
                        <meta itemprop="description" content="Replace your browser New Tab page with a Bitcoin price chart">
                        <meta itemprop="image" content="https://i.imgur.com/pHG5fBk.jpg">
                        <!-- Twitter -->
                        <meta name="twitter:card" content="summary">
                        <meta name="twitter:title" content="Crypto Tab">
                        <meta name="twitter:description" content="Replace your browser New Tab page with a Bitcoin price chart">
                        <meta name="twitter:image:src" content="https://i.imgur.com/pHG5fBk.jpg">
                        <!-- Open Graph general (Facebook, Pinterest & Google+) -->
                        <meta name="og:title" content="Crypto Tab">
                        <meta name="og:description" content="Replace your browser New Tab page with a Bitcoin price chart">
                        <meta name="og:image" content="https://i.imgur.com/pHG5fBk.jpg">
                        <meta name="og:url" content="https://crypto-tab.com">
                        <meta name="og:site_name" content="Crypto Tab">
                        <meta name="og:locale" content="en_US">
                        <meta name="og:type" content="website">`
                }
            ]
        }))
        .pipe(dest(distPath));
}

function setEnv() {
    return src(`./src/env/${ENV}.env.js`)
        .pipe(rename('env.js'))
        .pipe(dest(`${distPath}/env/`));
}

// Copy NPM dependencies
function copyNpmDependencies() {
    return src(
        [
            'node_modules/axios/dist/axios.min.js',
            'node_modules/chart.js/dist/Chart.min.js',
            'node_modules/moment/min/moment.min.js',
            'node_modules/super-repo/lib/index.js'
        ])
        .pipe(dest(`${distPath}/lib/`));
}

const buildTasks = [copyFiles, preprocess, copyNpmDependencies, setEnv];
if (ENV === 'website') {
    buildTasks.push(copyFavicons);
}

const build = series(...buildTasks)

function buildWatch() {
    return watch(['./src/**/*'], series(copyFiles, preprocess));
}

exports.watch = buildWatch
exports.build = build
exports.default = build
