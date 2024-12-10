const gulp = require("gulp");
const rename = require("gulp-rename");
const notify = require("gulp-notify");
const replace = require("gulp-replace-task");

const { ENV } = process.env;
const distPath = `./dist/${ENV}/`;

const filesArr = ["./src/js/**/*", "./src/css/**/*"];
if (ENV.includes("extension")) {
  filesArr.push("./src/manifest.json", "./src/icons/**/*");
}

// Copy files from src to dist directory
gulp.task("copy-files", function () {
  return gulp
    .src(filesArr, { base: "./src", encoding: false })
    .pipe(gulp.dest(distPath))
    .pipe(
      notify({
        message: "Done!",
        onLast: true,
      })
    );
});

// Copy favicons from src to dist directory
gulp.task("copy-favicons", function () {
  return gulp.src("./src/favicons/*").pipe(gulp.dest(distPath));
});

// Preprocess HTML files by replacing certain patterns based on the environment
gulp.task("preprocess-index", function () {
  return gulp
    .src("./src/index.html")
    .pipe(
      replace({
        patterns: [
          {
            match: "title",
            replacement: ENV.includes("extension") ? "New Tab" : "Crypto Tab",
          },
          {
            match: "favicons",
            replacement:
              ENV.includes("extension")
                ? ""
                : `<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
                        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
                        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
                        <link rel="manifest" href="/manifest.json">
                        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
                        <meta name="theme-color" content="#ffffff">`,
          },
          {
            match: "socialMediaTags",
            replacement:
              ENV.includes("extension")
                ? ""
                : `<!-- Schema.org for Google -->
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
                        <meta name="og:type" content="website">`,
          },
        ],
      })
    )
    .pipe(gulp.dest(distPath));
});

// Preprocess manifest.json by replacing certain patterns based on the environment
gulp.task("preprocess-manifest", function () {
  return gulp
    .src("./src/manifest.json")
    .pipe(
      replace({
        patterns: [
          {
            match: "background",
            // Firefox doesn't yet support service workers, but they have a concept
            // for background scripts that can be used in a similar way.
            replacement: ENV === 'extension-webkit' ?
              { "service_worker": "js/background.js" } : { "scripts": ["js/background.js"] }
          },
        ],
      })
    )
    .pipe(gulp.dest(distPath));
});

// Set the environment configuration by copying the appropriate env file to the dist directory
gulp.task("set-env", function () {
  return gulp
    .src(`./src/env/${ENV.includes('extension') ? 'extension' : 'website'}.env.js`)
    .pipe(rename("env.js"))
    .pipe(gulp.dest(`${distPath}/env/`));
});

// Copy specific NPM dependencies to the dist directory
gulp.task("copy-npm-dependencies", function () {
  return gulp
    .src([
      "node_modules/axios/dist/axios.min.js",
      "node_modules/chart.js/dist/chart.umd.js",
      "node_modules/super-repo/lib/index.js",
      "node_modules/dayjs/dayjs.min.js",
      "node_modules/dayjs/plugin/relativeTime.js",
      "node_modules/dayjs/plugin/utc.js",
      "node_modules/dayjs/plugin/localizedFormat.js",
      "node_modules/dayjs/plugin/calendar.js",
    ])
    .pipe(gulp.dest(`${distPath}/lib/`));
});

// Define the build tasks based on the environment
const buildTasks = gulp.series(
  gulp.parallel("copy-files", "preprocess-index", "copy-npm-dependencies", "set-env"),
  ENV.includes("extension") ? "preprocess-manifest" : (done) => done(),
  ENV === "website" ? "copy-favicons" : (done) => done()
);

// Main build task to run all necessary tasks in sequence and parallel as needed
gulp.task("build", buildTasks);

// Watch for changes in the src directory and rerun relevant tasks
gulp.task("build:watch", function () {
  gulp.watch("./src/**/*", gulp.series("copy-files", "preprocess-index"));
});
