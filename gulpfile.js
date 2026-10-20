const fs = require("node:fs");
const gulp = require("gulp");
const rename = require("gulp-rename");
const replace = require("gulp-replace-task");
const { version: productVersion } = require("./package.json");

const { ENV } = process.env;
const distPath = `./dist/${ENV}/`;
const productDescription =
  "Replace your New Tab page with crypto prices, charts, and a clock. Follow Bitcoin, Ether, and more in USD.";
const socialPreviewImage =
  "https://crypto-tab.com/mockups/social/crypto-tab-social-preview.jpg";
const socialPreviewAlt =
  "Crypto Tab showing cryptocurrency prices and a chart on a laptop in a sunlit workspace.";

function readLocaleCatalogs() {
  const catalogs = {};
  for (const file of fs.readdirSync("./src/locales").filter((name) => name.endsWith(".json"))) {
    catalogs[file.slice(0, -5)] = JSON.parse(fs.readFileSync(`./src/locales/${file}`, "utf8"));
  }
  const english = catalogs.en;
  if (!english) throw new Error("The English locale catalog is required");
  const keys = Object.keys(english).sort();
  const placeholders = (text) => (text.match(/\{[a-zA-Z][a-zA-Z0-9]*\}/g) || []).sort().join(",");
  for (const [locale, catalog] of Object.entries(catalogs)) {
    if (Object.keys(catalog).sort().join("\n") !== keys.join("\n")) {
      throw new Error(`Locale ${locale} must contain the same keys as English`);
    }
    for (const key of keys) {
      if (typeof catalog[key] !== "string" || !catalog[key].trim()) {
        throw new Error(`Locale ${locale} has an empty or invalid message: ${key}`);
      }
      if (placeholders(catalog[key]) !== placeholders(english[key])) {
        throw new Error(`Locale ${locale} has mismatched placeholders: ${key}`);
      }
    }
    if (catalog["metadata.extensionDescription"].length > 132) {
      throw new Error(`Locale ${locale} extension description exceeds 132 characters`);
    }
  }
  return catalogs;
}

const filesArr = [
  "./src/js/**/*",
  "./src/css/**/*",
  "./src/img/logo.svg",
  "./src/img/tokens/**/*",
  "./src/img/contributors/**/*",
];
if (ENV.includes("extension")) {
  filesArr.push("./src/manifest.json", "./src/icons/**/*");
} else {
  filesArr.push(
    "./src/img/browsers/*.svg",
    "./src/img/logo.png",
    "./src/mockups/social/crypto-tab-social-preview.jpg",
    "./src/feedback/**/*"
  );
}

// Remove the previous target build so renamed and deleted files cannot leak into dist.
gulp.task("clean", function () {
  return fs.promises.rm(distPath, { recursive: true, force: true });
});

// Copy files from src to dist directory
gulp.task("copy-files", function () {
  return gulp
    .src(filesArr, { base: "./src", encoding: false })
    .pipe(gulp.dest(distPath));
});

// Package translations locally for both transports; no translation service is needed at runtime.
gulp.task("build-locales", async function () {
  const catalogs = readLocaleCatalogs();
  await fs.promises.mkdir(`${distPath}/js`, { recursive: true });
  await fs.promises.writeFile(
    `${distPath}/js/localeCatalogs.js`,
    `globalThis.App = globalThis.App || {};\nglobalThis.App.LocaleCatalogs = ${JSON.stringify(catalogs)};\n`
  );
  if (ENV.includes("extension")) {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      const directory = `${distPath}/_locales/${locale.replace(/-/g, "_")}`;
      await fs.promises.mkdir(directory, { recursive: true });
      await fs.promises.writeFile(
        `${directory}/messages.json`,
        JSON.stringify({ extensionDescription: { message: catalog["metadata.extensionDescription"] } }, null, 2) + "\n"
      );
    }
  }
});

// Copy favicons from src to dist directory
gulp.task("copy-favicons", function () {
  return gulp
    .src("./src/favicons/*", { encoding: false })
    .pipe(gulp.dest(distPath));
});

// Keep the hosted policy in sync with the repository's Markdown source.
gulp.task("build-privacy", async function () {
  const { parse } = await import("marked");
  const [markdown, template] = await Promise.all([
    fs.promises.readFile("./PRIVACY.md", "utf8"),
    fs.promises.readFile("./src/templates/privacy.html", "utf8"),
  ]);
  const html = template.replace("@@privacyContent", () => parse(markdown));

  await fs.promises.mkdir(`${distPath}/privacy`, { recursive: true });
  await fs.promises.writeFile(`${distPath}/privacy/index.html`, html);
});

// Preprocess HTML files by replacing certain patterns based on the environment
gulp.task("preprocess-index", function () {
  return gulp
    .src("./src/index.html")
    .pipe(
      replace({
        patterns: [
          {
            match: "bodyClass",
            replacement: ENV === "website" ? "website" : "",
          },
          {
            match: "websiteHeader",
            replacement:
              ENV === "website"
                ? fs.readFileSync("./src/templates/website-header.html", "utf8").trim()
                : "",
          },
          {
            match: "title",
            replacement: ENV.includes("extension") ? "New Tab" : "Crypto Tab",
          },
          {
            match: "version",
            replacement: productVersion,
          },
          {
            match: "favicons",
            replacement:
              ENV.includes("extension")
                ? ""
                : `<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">
                        <link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png">
                        <link rel="icon" type="image/png" sizes="16x16" href="favicon-16x16.png">
                        <link rel="icon" type="image/svg+xml" sizes="any" href="img/logo.svg">
                        <link rel="manifest" href="manifest.json">
                        <link rel="mask-icon" href="safari-pinned-tab.svg" color="#4f78e2">
                        <meta name="theme-color" content="#ffffff">`,
          },
          {
            match: "socialMediaTags",
            replacement:
              ENV.includes("extension")
                ? ""
                : `<!-- X / Twitter -->
                        <meta name="twitter:card" content="summary_large_image">
                        <meta name="twitter:title" content="Crypto Tab">
                        <meta name="twitter:description" content="${productDescription}">
                        <meta name="twitter:image" content="${socialPreviewImage}">
                        <meta name="twitter:image:alt" content="${socialPreviewAlt}">
                        <!-- Open Graph -->
                        <meta property="og:title" content="Crypto Tab">
                        <meta property="og:description" content="${productDescription}">
                        <meta property="og:image" content="${socialPreviewImage}">
                        <meta property="og:image:type" content="image/jpeg">
                        <meta property="og:image:width" content="1200">
                        <meta property="og:image:height" content="630">
                        <meta property="og:image:alt" content="${socialPreviewAlt}">
                        <meta property="og:url" content="https://crypto-tab.com/">
                        <meta property="og:site_name" content="Crypto Tab">
                        <meta property="og:locale" content="en_US">
                        <meta property="og:type" content="website">`,
          },
          {
            match: "superRepoScript",
            replacement:
              ENV === "website" ? '<script defer src="lib/index.js"></script>' : "",
          },
          {
            match: "priceRepositoryScripts",
            replacement:
              ENV === "website"
                ? `<script defer src="js/priceApi.js"></script>
    <script defer src="js/priceRepositoryFactory.js"></script>`
                : "",
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
              { "service_worker": "js/background.js" } :
              {
                "scripts": [
                  "lib/dayjs.min.js",
                  "lib/utc.js",
                  "lib/index.js",
                  "js/storageMigration.js",
                  "js/localeConfig.js",
                  "js/cryptoTokens.js",
                  "js/priceApi.js",
                  "js/priceRepositoryFactory.js",
                  "js/background.js"
                ]
              }
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
      "node_modules/chart.js/dist/chart.umd.min.js",
      "node_modules/super-repo/lib/index.js",
      "node_modules/dayjs/dayjs.min.js",
      "node_modules/dayjs/plugin/relativeTime.js",
      "node_modules/dayjs/plugin/utc.js",
      "node_modules/dayjs/plugin/localizedFormat.js",
      "node_modules/dayjs/plugin/calendar.js",
      "node_modules/dayjs/locale/pt-br.js",
      "node_modules/dayjs/locale/pt.js",
      "node_modules/dayjs/locale/es.js",
      "node_modules/dayjs/locale/fr.js",
      "node_modules/dayjs/locale/id.js",
      "node_modules/dayjs/locale/bg.js",
    ])
    .pipe(gulp.dest(`${distPath}/lib/`));
});

// Define the build tasks based on the environment
const buildTasks = gulp.series(
  "clean",
  gulp.parallel("copy-files", "preprocess-index", "copy-npm-dependencies", "set-env", "build-locales"),
  ENV.includes("extension") ? "preprocess-manifest" : (done) => done(),
  ENV === "website" ? gulp.parallel("copy-favicons", "build-privacy") : (done) => done()
);

// Main build task to run all necessary tasks in sequence and parallel as needed
gulp.task("build", buildTasks);

// Create a clean initial build and fully rebuild when source files change.
gulp.task(
  "build:watch",
  gulp.series("build", function watchFiles() {
    const watchPaths = ["./src/**/*"];
    if (ENV === "website") {
      watchPaths.push("./PRIVACY.md");
    }
    return gulp.watch(watchPaths, gulp.series("build"));
  })
);
