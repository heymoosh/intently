# Third-Party Licenses

This document enumerates the third-party open-source packages bundled with the Intently mobile app (`app/`). It covers **production dependencies only** — `devDependencies` are excluded.

**Generated:** 2026-04-24
**Method:** `npx license-checker --production --csv` run against `app/package-lock.json`.
**Total packages:** 610 third-party packages across 17 distinct license types.

## License-compatibility summary

All bundled licenses have been reviewed and are compatible with Intently's MIT-licensed distribution (see [`LICENSE`](./LICENSE)). Notes on the non-MIT licenses appearing in the list:

- **ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, BlueOak-1.0.0, Unlicense** — permissive; no additional obligations beyond attribution, which this document satisfies.
- **MIT AND OFL-1.1** — the four `@expo-google-fonts/*` packages ship Google Fonts under the SIL Open Font License; bundled as-is, redistributable without restriction.
- **MPL-2.0** (`lightningcss`, `lightningcss-darwin-arm64`) — weak copyleft, applies file-level only. We ship unmodified upstream binaries; no source-disclosure obligation triggered.
- **`(BSD-3-Clause OR GPL-2.0)`** (`node-forge`) — dual-licensed. Intently elects **BSD-3-Clause**.
- **`(BSD-2-Clause OR MIT OR Apache-2.0)`** (`rc`) — tri-licensed, all permissive; Intently elects MIT.
- **`(MIT OR CC0-1.0)`** (`type-fest`) — dual-licensed; Intently elects MIT.
- **CC-BY-4.0** (`caniuse-lite`) — attribution license covering browser-compatibility data; listing in this file satisfies attribution.
- **Python-2.0** (`argparse`) — historical Python Software Foundation license; permissive, BSD-style.
- **Beerware** (`react-native-fit-image`) — joke-style permissive license; transitive via the markdown renderer (see note below).

None of the above conflict with the hackathon asset policy (all OSS, no proprietary terms).

**Note on the markdown-it renderer.** The package `@ronradtke/react-native-markdown-display@8.1.0` listed under MIT below is the maintained community fork of `react-native-markdown-display`. The swap landed in PR #46 to clear unresolved `markdown-it` security advisories on the unmaintained upstream.

---

## Packages by license

### Apache-2.0 (14)

Includes one package listed upstream as `Apache 2.0` (`rc@1.2.8`); normalized here for clarity.

| Package | Version | Repository |
|---|---|---|
| `baseline-browser-mapping` | 2.10.21 | [link](https://github.com/web-platform-dx/baseline-browser-mapping) |
| `bser` | 2.1.1 | [link](https://github.com/facebook/watchman) |
| `chrome-launcher` | 0.15.2 | [link](https://github.com/GoogleChrome/chrome-launcher) |
| `chromium-edge-launcher` | 0.2.0 | [link](https://github.com/cezaraugusto/chromium-edge-launcher) |
| `detect-libc` | 2.1.2 | [link](https://github.com/lovell/detect-libc) |
| `exponential-backoff` | 3.1.3 | [link](https://github.com/coveooss/exponential-backoff) |
| `fb-watchman` | 2.0.2 | [link](https://github.com/facebook/watchman) |
| `lighthouse-logger` | 1.4.2 | [link](https://www.npmjs.com/package/lighthouse-logger) |
| `marky` | 1.3.0 | [link](https://github.com/nolanlawson/marky) |
| `rc` | 1.2.8 | [link](https://github.com/dominictarr/rc) |
| `ts-interface-checker` | 0.1.13 | [link](https://github.com/gristlabs/ts-interface-checker) |
| `typescript` | 5.9.3 | [link](https://github.com/microsoft/TypeScript) |
| `walker` | 1.0.8 | [link](https://github.com/daaku/nodejs-walker) |
| `xcode` | 3.0.1 | [link](https://github.com/apache/cordova-node-xcode) |

### BSD-2-Clause (9)

| Package | Version | Repository |
|---|---|---|
| `dotenv-expand` | 11.0.7 | [link](https://github.com/motdotla/dotenv-expand) |
| `dotenv` | 16.4.7 | [link](https://github.com/motdotla/dotenv) |
| `entities` | 4.5.0 | [link](https://github.com/fb55/entities) |
| `esprima` | 4.0.1 | [link](https://github.com/jquery/esprima) |
| `fontfaceobserver` | 2.3.0 | [link](https://github.com/bramstein/fontfaceobserver) |
| `regjsparser` | 0.13.1 | [link](https://github.com/jviereck/regjsparser) |
| `terser` | 5.46.1 | [link](https://github.com/terser/terser) |
| `webidl-conversions` | 3.0.1 | [link](https://github.com/jsdom/webidl-conversions) |
| `webidl-conversions` | 5.0.0 | [link](https://github.com/jsdom/webidl-conversions) |

### BSD-3-Clause (15)

| Package | Version | Repository |
|---|---|---|
| `@expo/xcpretty` | 4.4.3 | [link](https://github.com/expo/expo-cli) |
| `@react-native/debugger-frontend` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@sinonjs/commons` | 3.0.1 | [link](https://github.com/sinonjs/commons) |
| `@sinonjs/fake-timers` | 10.3.0 | [link](https://github.com/sinonjs/fake-timers) |
| `babel-plugin-istanbul` | 6.1.1 | [link](https://github.com/istanbuljs/babel-plugin-istanbul) |
| `hyphenate-style-name` | 1.1.0 | [link](https://github.com/rexxars/hyphenate-style-name) |
| `ieee754` | 1.2.1 | [link](https://github.com/feross/ieee754) |
| `istanbul-lib-coverage` | 3.2.2 | [link](https://github.com/istanbuljs/istanbuljs) |
| `istanbul-lib-instrument` | 5.2.1 | [link](https://github.com/istanbuljs/istanbuljs) |
| `makeerror` | 1.0.12 | [link](https://github.com/daaku/nodejs-makeerror) |
| `source-map-js` | 1.2.1 | [link](https://github.com/7rulnik/source-map-js) |
| `source-map` | 0.5.7 | [link](https://github.com/mozilla/source-map) |
| `source-map` | 0.6.1 | [link](https://github.com/mozilla/source-map) |
| `sprintf-js` | 1.0.3 | [link](https://github.com/alexei/sprintf.js) |
| `tmpl` | 1.0.5 | [link](https://github.com/daaku/nodejs-tmpl) |

### BlueOak-1.0.0 (9)

| Package | Version | Repository |
|---|---|---|
| `chownr` | 3.0.0 | [link](https://github.com/isaacs/chownr) |
| `glob` | 13.0.6 | [link](https://github.com/isaacs/node-glob) |
| `lru-cache` | 11.3.5 | [link](https://github.com/isaacs/node-lru-cache) |
| `minimatch` | 10.2.5 | [link](https://github.com/isaacs/minimatch) |
| `minipass` | 7.1.3 | [link](https://github.com/isaacs/minipass) |
| `path-scurry` | 2.0.2 | [link](https://github.com/isaacs/path-scurry) |
| `sax` | 1.6.0 | [link](https://github.com/isaacs/sax-js) |
| `tar` | 7.5.13 | [link](https://github.com/isaacs/node-tar) |
| `yallist` | 5.0.0 | [link](https://github.com/isaacs/yallist) |

### ISC (39)

| Package | Version | Repository |
|---|---|---|
| `@isaacs/fs-minipass` | 4.0.1 | [link](https://github.com/npm/fs-minipass) |
| `@isaacs/ttlcache` | 1.4.1 | [link](https://github.com/isaacs/ttlcache) |
| `@istanbuljs/load-nyc-config` | 1.1.0 | [link](https://github.com/istanbuljs/load-nyc-config) |
| `@ungap/structured-clone` | 1.3.0 | [link](https://github.com/ungap/structured-clone) |
| `anymatch` | 3.1.3 | [link](https://github.com/micromatch/anymatch) |
| `cliui` | 8.0.1 | [link](https://github.com/yargs/cliui) |
| `css-color-keywords` | 1.0.0 | [link](https://github.com/sonicdoe/css-color-keywords) |
| `electron-to-chromium` | 1.5.343 | [link](https://github.com/Kilian/electron-to-chromium) |
| `fs.realpath` | 1.0.0 | [link](https://github.com/isaacs/fs.realpath) |
| `get-caller-file` | 2.0.5 | [link](https://github.com/stefanpenner/get-caller-file) |
| `glob` | 7.2.3 | [link](https://github.com/isaacs/node-glob) |
| `graceful-fs` | 4.2.11 | [link](https://github.com/isaacs/node-graceful-fs) |
| `hosted-git-info` | 7.0.2 | [link](https://github.com/npm/hosted-git-info) |
| `inflight` | 1.0.6 | [link](https://github.com/npm/inflight) |
| `inherits` | 2.0.4 | [link](https://github.com/isaacs/inherits) |
| `ini` | 1.3.8 | [link](https://github.com/isaacs/ini) |
| `isexe` | 2.0.0 | [link](https://github.com/isaacs/isexe) |
| `lru-cache` | 10.4.3 | [link](https://github.com/isaacs/node-lru-cache) |
| `lru-cache` | 5.1.1 | [link](https://github.com/isaacs/node-lru-cache) |
| `minimatch` | 3.1.5 | [link](https://github.com/isaacs/minimatch) |
| `minimatch` | 9.0.9 | [link](https://github.com/isaacs/minimatch) |
| `npm-package-arg` | 11.0.3 | [link](https://github.com/npm/npm-package-arg) |
| `once` | 1.4.0 | [link](https://github.com/isaacs/once) |
| `picocolors` | 1.1.1 | [link](https://github.com/alexeyraspopov/picocolors) |
| `proc-log` | 4.2.0 | [link](https://github.com/npm/proc-log) |
| `rimraf` | 3.0.2 | [link](https://github.com/isaacs/rimraf) |
| `semver` | 6.3.1 | [link](https://github.com/npm/node-semver) |
| `semver` | 7.7.4 | [link](https://github.com/npm/node-semver) |
| `setprototypeof` | 1.2.0 | [link](https://github.com/wesleytodd/setprototypeof) |
| `signal-exit` | 3.0.7 | [link](https://github.com/tapjs/signal-exit) |
| `test-exclude` | 6.0.0 | [link](https://github.com/istanbuljs/test-exclude) |
| `validate-npm-package-name` | 5.0.1 | [link](https://github.com/npm/validate-npm-package-name) |
| `which` | 2.0.2 | [link](https://github.com/isaacs/node-which) |
| `wrappy` | 1.0.2 | [link](https://github.com/npm/wrappy) |
| `write-file-atomic` | 4.0.2 | [link](https://github.com/npm/write-file-atomic) |
| `y18n` | 5.0.8 | [link](https://github.com/yargs/y18n) |
| `yallist` | 3.1.1 | [link](https://github.com/isaacs/yallist) |
| `yaml` | 2.8.3 | [link](https://github.com/eemeli/yaml) |
| `yargs-parser` | 21.1.1 | [link](https://github.com/yargs/yargs-parser) |

### MIT AND OFL-1.1 (4)

| Package | Version | Repository |
|---|---|---|
| `@expo-google-fonts/fraunces` | 0.4.1 | [link](https://github.com/expo/google-fonts) |
| `@expo-google-fonts/inter` | 0.4.2 | [link](https://github.com/expo/google-fonts) |
| `@expo-google-fonts/jetbrains-mono` | 0.4.1 | [link](https://github.com/expo/google-fonts) |
| `@expo-google-fonts/source-serif-4` | 0.4.1 | [link](https://github.com/expo/google-fonts) |

### MPL-2.0 (2)

| Package | Version | Repository |
|---|---|---|
| `lightningcss-darwin-arm64` | 1.32.0 | [link](https://github.com/parcel-bundler/lightningcss) |
| `lightningcss` | 1.32.0 | [link](https://github.com/parcel-bundler/lightningcss) |

### Unlicense (2)

| Package | Version | Repository |
|---|---|---|
| `big-integer` | 1.6.52 | [link](https://github.com/peterolson/BigInteger.js) |
| `stream-buffers` | 2.2.0 | [link](https://github.com/samcday/node-stream-buffer) |

### 0BSD (2)

| Package | Version | Repository |
|---|---|---|
| `jsc-safe-url` | 0.2.4 | [link](https://github.com/robhogan/jsc-safe-url) |
| `tslib` | 2.8.1 | [link](https://github.com/Microsoft/tslib) |

### (MIT OR CC0-1.0) (2)

Intently elects MIT.

| Package | Version | Repository |
|---|---|---|
| `type-fest` | 0.21.3 | [link](https://github.com/sindresorhus/type-fest) |
| `type-fest` | 0.7.1 | [link](https://github.com/sindresorhus/type-fest) |

### (BSD-2-Clause OR MIT OR Apache-2.0) (1)

Intently elects MIT.

| Package | Version | Repository |
|---|---|---|
| `qrcode-terminal` | 0.11.0 | [link](https://github.com/gtanner/qrcode-terminal) |

### (BSD-3-Clause OR GPL-2.0) (1)

Intently elects BSD-3-Clause.

| Package | Version | Repository |
|---|---|---|
| `node-forge` | 1.4.0 | [link](https://github.com/digitalbazaar/forge) |

### Python-2.0 (1)

| Package | Version | Repository |
|---|---|---|
| `argparse` | 2.0.1 | [link](https://github.com/nodeca/argparse) |

### CC-BY-4.0 (1)

| Package | Version | Repository |
|---|---|---|
| `caniuse-lite` | 1.0.30001790 | [link](https://github.com/browserslist/caniuse-lite) |

### Beerware (1)

Transitive dependency of the markdown renderer; permissive.

| Package | Version | Repository |
|---|---|---|
| `react-native-fit-image` | 1.5.5 | [link](https://github.com/huiseoul/react-native-fit-image) |

### MIT (507)

<details>
<summary>Expand MIT-licensed package list (507 packages)</summary>

| Package | Version | Repository |
|---|---|---|
| `@0no-co/graphql.web` | 1.2.0 | [link](https://github.com/0no-co/graphql.web) |
| `@anthropic-ai/sdk` | 0.90.0 | [link](https://github.com/anthropics/anthropic-sdk-typescript) |
| `@babel/code-frame` | 7.10.4 | [link](https://github.com/babel/babel) |
| `@babel/code-frame` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/compat-data` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/core` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/generator` | 7.29.1 | [link](https://github.com/babel/babel) |
| `@babel/helper-annotate-as-pure` | 7.27.3 | [link](https://github.com/babel/babel) |
| `@babel/helper-compilation-targets` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/helper-create-class-features-plugin` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/helper-create-regexp-features-plugin` | 7.28.5 | [link](https://github.com/babel/babel) |
| `@babel/helper-define-polyfill-provider` | 0.6.8 | [link](https://github.com/babel/babel-polyfills) |
| `@babel/helper-globals` | 7.28.0 | [link](https://github.com/babel/babel) |
| `@babel/helper-member-expression-to-functions` | 7.28.5 | [link](https://github.com/babel/babel) |
| `@babel/helper-module-imports` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/helper-module-transforms` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/helper-optimise-call-expression` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/helper-plugin-utils` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/helper-remap-async-to-generator` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/helper-replace-supers` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/helper-skip-transparent-expression-wrappers` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/helper-string-parser` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/helper-validator-identifier` | 7.28.5 | [link](https://github.com/babel/babel) |
| `@babel/helper-validator-option` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/helper-wrap-function` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/helpers` | 7.29.2 | [link](https://github.com/babel/babel) |
| `@babel/highlight` | 7.25.9 | [link](https://github.com/babel/babel) |
| `@babel/parser` | 7.29.2 | [link](https://github.com/babel/babel) |
| `@babel/plugin-proposal-decorators` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/plugin-proposal-export-default-from` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-async-generators` | 7.8.4 | [link](https://github.com/babel/babel/tree/master/packages/babel-plugin-syntax-async-generators) |
| `@babel/plugin-syntax-bigint` | 7.8.3 | [link](https://github.com/babel/babel/tree/master/packages/babel-plugin-syntax-bigint) |
| `@babel/plugin-syntax-class-properties` | 7.12.13 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-class-static-block` | 7.14.5 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-decorators` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-dynamic-import` | 7.8.3 | [link](https://github.com/babel/babel/tree/master/packages/babel-plugin-syntax-dynamic-import) |
| `@babel/plugin-syntax-export-default-from` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-flow` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-import-attributes` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-import-meta` | 7.10.4 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-json-strings` | 7.8.3 | [link](https://github.com/babel/babel/tree/master/packages/babel-plugin-syntax-json-strings) |
| `@babel/plugin-syntax-jsx` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-logical-assignment-operators` | 7.10.4 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-nullish-coalescing-operator` | 7.8.3 | [link](https://github.com/babel/babel/tree/master/packages/babel-plugin-syntax-nullish-coalescing-operator) |
| `@babel/plugin-syntax-numeric-separator` | 7.10.4 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-object-rest-spread` | 7.8.3 | [link](https://github.com/babel/babel/tree/master/packages/babel-plugin-syntax-object-rest-spread) |
| `@babel/plugin-syntax-optional-catch-binding` | 7.8.3 | [link](https://github.com/babel/babel/tree/master/packages/babel-plugin-syntax-optional-catch-binding) |
| `@babel/plugin-syntax-optional-chaining` | 7.8.3 | [link](https://github.com/babel/babel/tree/master/packages/babel-plugin-syntax-optional-chaining) |
| `@babel/plugin-syntax-private-property-in-object` | 7.14.5 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-top-level-await` | 7.14.5 | [link](https://github.com/babel/babel) |
| `@babel/plugin-syntax-typescript` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-arrow-functions` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-async-generator-functions` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-async-to-generator` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-block-scoping` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-class-properties` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-class-static-block` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-classes` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-computed-properties` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-destructuring` | 7.28.5 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-export-namespace-from` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-flow-strip-types` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-for-of` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-function-name` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-literals` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-logical-assignment-operators` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-modules-commonjs` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-named-capturing-groups-regex` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-nullish-coalescing-operator` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-numeric-separator` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-object-rest-spread` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-optional-catch-binding` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-optional-chaining` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-parameters` | 7.27.7 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-private-methods` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-private-property-in-object` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-react-display-name` | 7.28.0 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-react-jsx-development` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-react-jsx-self` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-react-jsx-source` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-react-jsx` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-react-pure-annotations` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-regenerator` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-runtime` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-shorthand-properties` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-spread` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-sticky-regex` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-typescript` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/plugin-transform-unicode-regex` | 7.27.1 | [link](https://github.com/babel/babel) |
| `@babel/preset-react` | 7.28.5 | [link](https://github.com/babel/babel) |
| `@babel/preset-typescript` | 7.28.5 | [link](https://github.com/babel/babel) |
| `@babel/runtime` | 7.29.2 | [link](https://github.com/babel/babel) |
| `@babel/template` | 7.28.6 | [link](https://github.com/babel/babel) |
| `@babel/traverse` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@babel/types` | 7.29.0 | [link](https://github.com/babel/babel) |
| `@expo/cli` | 54.0.23 | [link](https://github.com/expo/expo) |
| `@expo/code-signing-certificates` | 0.0.6 | [link](https://github.com/expo/code-signing-certificates) |
| `@expo/config-plugins` | 54.0.4 | [link](https://github.com/expo/expo) |
| `@expo/config-types` | 54.0.10 | [link](https://github.com/expo/expo) |
| `@expo/config` | 12.0.13 | [link](https://github.com/expo/expo) |
| `@expo/devcert` | 1.2.1 | [link](https://github.com/expo/devcert) |
| `@expo/devtools` | 0.1.8 | [link](https://github.com/expo/expo) |
| `@expo/env` | 2.0.11 | [link](https://github.com/expo/expo) |
| `@expo/fingerprint` | 0.15.4 | [link](https://github.com/expo/expo) |
| `@expo/image-utils` | 0.8.13 | [link](https://github.com/expo/expo) |
| `@expo/json-file` | 10.0.13 | [link](https://github.com/expo/expo) |
| `@expo/metro-config` | 54.0.14 | [link](https://github.com/expo/expo) |
| `@expo/metro-runtime` | 6.1.2 | [link](https://github.com/expo/expo) |
| `@expo/metro` | 54.2.0 | [link](https://github.com/expo/expo-metro) |
| `@expo/osascript` | 2.4.2 | [link](https://github.com/expo/expo) |
| `@expo/package-manager` | 1.10.4 | [link](https://github.com/expo/expo) |
| `@expo/plist` | 0.4.8 | [link](https://github.com/expo/expo) |
| `@expo/prebuild-config` | 54.0.8 | [link](https://github.com/expo/expo) |
| `@expo/require-utils` | 55.0.4 | [link](https://github.com/expo/expo) |
| `@expo/schema-utils` | 0.1.8 | [link](https://github.com/expo/expo) |
| `@expo/sdk-runtime-versions` | 1.0.0 | [link](https://www.npmjs.com/package/@expo/sdk-runtime-versions) |
| `@expo/spawn-async` | 1.7.2 | [link](https://github.com/expo/spawn-async) |
| `@expo/sudo-prompt` | 9.3.2 | [link](https://github.com/expo/sudo-prompt) |
| `@expo/vector-icons` | 15.1.1 | [link](https://github.com/expo/vector-icons) |
| `@expo/ws-tunnel` | 1.0.6 | [link](https://www.npmjs.com/package/@expo/ws-tunnel) |
| `@istanbuljs/schema` | 0.1.6 | [link](https://github.com/istanbuljs/schema) |
| `@jest/create-cache-key-function` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `@jest/environment` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `@jest/fake-timers` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `@jest/schemas` | 29.6.3 | [link](https://github.com/jestjs/jest) |
| `@jest/transform` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `@jest/types` | 29.6.3 | [link](https://github.com/jestjs/jest) |
| `@jridgewell/gen-mapping` | 0.3.13 | [link](https://github.com/jridgewell/sourcemaps) |
| `@jridgewell/remapping` | 2.3.5 | [link](https://github.com/jridgewell/sourcemaps) |
| `@jridgewell/resolve-uri` | 3.1.2 | [link](https://github.com/jridgewell/resolve-uri) |
| `@jridgewell/source-map` | 0.3.11 | [link](https://github.com/jridgewell/sourcemaps) |
| `@jridgewell/sourcemap-codec` | 1.5.5 | [link](https://github.com/jridgewell/sourcemaps) |
| `@jridgewell/trace-mapping` | 0.3.31 | [link](https://github.com/jridgewell/sourcemaps) |
| `@react-native/assets-registry` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/babel-plugin-codegen` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/babel-preset` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/codegen` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/community-cli-plugin` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/dev-middleware` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/gradle-plugin` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/js-polyfills` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/normalize-colors` | 0.74.89 | [link](https://github.com/facebook/react-native) |
| `@react-native/normalize-colors` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@react-native/virtualized-lists` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `@ronradtke/react-native-markdown-display` | 8.1.0 | [link](https://github.com/RonRadtke/react-native-markdown-display) |
| `@sinclair/typebox` | 0.27.10 | [link](https://github.com/sinclairzx81/typebox-legacy) |
| `@supabase/auth-js` | 2.104.0 | [link](https://github.com/supabase/supabase-js) |
| `@supabase/functions-js` | 2.104.0 | [link](https://github.com/supabase/supabase-js) |
| `@supabase/phoenix` | 0.4.0 | [link](https://github.com/supabase/phoenix) |
| `@supabase/postgrest-js` | 2.104.0 | [link](https://github.com/supabase/supabase-js) |
| `@supabase/realtime-js` | 2.104.0 | [link](https://github.com/supabase/supabase-js) |
| `@supabase/storage-js` | 2.104.0 | [link](https://github.com/supabase/supabase-js) |
| `@supabase/supabase-js` | 2.104.0 | [link](https://github.com/supabase/supabase-js) |
| `@types/babel__core` | 7.20.5 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/babel__generator` | 7.27.0 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/babel__template` | 7.4.4 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/babel__traverse` | 7.28.0 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/graceful-fs` | 4.1.9 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/istanbul-lib-coverage` | 2.0.6 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/istanbul-lib-report` | 3.0.3 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/istanbul-reports` | 3.0.4 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/node` | 25.6.0 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/react` | 19.1.17 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/stack-utils` | 2.0.3 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/ws` | 8.18.1 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/yargs-parser` | 21.0.3 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@types/yargs` | 17.0.35 | [link](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| `@urql/core` | 5.2.0 | [link](https://github.com/urql-graphql/urql) |
| `@urql/exchange-retry` | 1.3.2 | [link](https://github.com/urql-graphql/urql) |
| `@xmldom/xmldom` | 0.8.13 | [link](https://github.com/xmldom/xmldom) |
| `abort-controller` | 3.0.0 | [link](https://github.com/mysticatea/abort-controller) |
| `accepts` | 1.3.8 | [link](https://github.com/jshttp/accepts) |
| `acorn` | 8.16.0 | [link](https://github.com/acornjs/acorn) |
| `agent-base` | 7.1.4 | [link](https://github.com/TooTallNate/proxy-agents) |
| `anser` | 1.4.10 | [link](https://github.com/IonicaBizau/anser) |
| `ansi-escapes` | 4.3.2 | [link](https://github.com/sindresorhus/ansi-escapes) |
| `ansi-regex` | 4.1.1 | [link](https://github.com/chalk/ansi-regex) |
| `ansi-regex` | 5.0.1 | [link](https://github.com/chalk/ansi-regex) |
| `ansi-styles` | 3.2.1 | [link](https://github.com/chalk/ansi-styles) |
| `ansi-styles` | 4.3.0 | [link](https://github.com/chalk/ansi-styles) |
| `ansi-styles` | 5.2.0 | [link](https://github.com/chalk/ansi-styles) |
| `any-promise` | 1.3.0 | [link](https://github.com/kevinbeaty/any-promise) |
| `arg` | 5.0.2 | [link](https://github.com/vercel/arg) |
| `argparse` | 1.0.10 | [link](https://github.com/nodeca/argparse) |
| `asap` | 2.0.6 | [link](https://github.com/kriskowal/asap) |
| `async-limiter` | 1.0.1 | [link](https://github.com/strml/async-limiter) |
| `babel-jest` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `babel-plugin-jest-hoist` | 29.6.3 | [link](https://github.com/jestjs/jest) |
| `babel-plugin-polyfill-corejs2` | 0.4.17 | [link](https://github.com/babel/babel-polyfills) |
| `babel-plugin-polyfill-corejs3` | 0.13.0 | [link](https://github.com/babel/babel-polyfills) |
| `babel-plugin-polyfill-regenerator` | 0.6.8 | [link](https://github.com/babel/babel-polyfills) |
| `babel-plugin-react-compiler` | 1.0.0 | [link](https://github.com/facebook/react) |
| `babel-plugin-react-native-web` | 0.21.2 | [link](https://github.com/necolas/react-native-web) |
| `babel-plugin-syntax-hermes-parser` | 0.29.1 | [link](https://github.com/facebook/hermes) |
| `babel-plugin-transform-flow-enums` | 0.0.2 | [link](https://github.com/facebook/flow) |
| `babel-preset-current-node-syntax` | 1.2.0 | [link](https://github.com/nicolo-ribaudo/babel-preset-current-node-syntax) |
| `babel-preset-expo` | 54.0.10 | [link](https://github.com/expo/expo) |
| `babel-preset-jest` | 29.6.3 | [link](https://github.com/jestjs/jest) |
| `balanced-match` | 1.0.2 | [link](https://github.com/juliangruber/balanced-match) |
| `balanced-match` | 4.0.4 | [link](https://github.com/juliangruber/balanced-match) |
| `base64-js` | 1.5.1 | [link](https://github.com/beatgammit/base64-js) |
| `better-opn` | 3.0.2 | [link](https://github.com/ExiaSR/better-opn) |
| `bplist-creator` | 0.1.0 | [link](https://github.com/nearinfinity/node-bplist-creator) |
| `bplist-parser` | 0.3.1 | [link](https://github.com/nearinfinity/node-bplist-parser) |
| `brace-expansion` | 1.1.14 | [link](https://github.com/juliangruber/brace-expansion) |
| `brace-expansion` | 2.1.0 | [link](https://github.com/juliangruber/brace-expansion) |
| `brace-expansion` | 5.0.5 | [link](https://github.com/juliangruber/brace-expansion) |
| `braces` | 3.0.3 | [link](https://github.com/micromatch/braces) |
| `browserslist` | 4.28.2 | [link](https://github.com/browserslist/browserslist) |
| `buffer-from` | 1.1.2 | [link](https://github.com/LinusU/buffer-from) |
| `buffer` | 5.7.1 | [link](https://github.com/feross/buffer) |
| `bytes` | 3.1.2 | [link](https://github.com/visionmedia/bytes.js) |
| `camelcase` | 5.3.1 | [link](https://github.com/sindresorhus/camelcase) |
| `camelcase` | 6.3.0 | [link](https://github.com/sindresorhus/camelcase) |
| `camelize` | 1.0.1 | [link](https://github.com/ljharb/camelize) |
| `chalk` | 2.4.2 | [link](https://github.com/chalk/chalk) |
| `chalk` | 4.1.2 | [link](https://github.com/chalk/chalk) |
| `ci-info` | 2.0.0 | [link](https://github.com/watson/ci-info) |
| `ci-info` | 3.9.0 | [link](https://github.com/watson/ci-info) |
| `cli-cursor` | 2.1.0 | [link](https://github.com/sindresorhus/cli-cursor) |
| `cli-spinners` | 2.9.2 | [link](https://github.com/sindresorhus/cli-spinners) |
| `clone` | 1.0.4 | [link](https://github.com/pvorb/node-clone) |
| `color-convert` | 1.9.3 | [link](https://github.com/Qix-/color-convert) |
| `color-convert` | 2.0.1 | [link](https://github.com/Qix-/color-convert) |
| `color-name` | 1.1.3 | [link](https://github.com/dfcreative/color-name) |
| `color-name` | 1.1.4 | [link](https://github.com/colorjs/color-name) |
| `commander` | 12.1.0 | [link](https://github.com/tj/commander.js) |
| `commander` | 2.20.3 | [link](https://github.com/tj/commander.js) |
| `commander` | 4.1.1 | [link](https://github.com/tj/commander.js) |
| `commander` | 7.2.0 | [link](https://github.com/tj/commander.js) |
| `compressible` | 2.0.18 | [link](https://github.com/jshttp/compressible) |
| `compression` | 1.8.1 | [link](https://github.com/expressjs/compression) |
| `concat-map` | 0.0.1 | [link](https://github.com/substack/node-concat-map) |
| `connect` | 3.7.0 | [link](https://github.com/senchalabs/connect) |
| `convert-source-map` | 2.0.0 | [link](https://github.com/thlorenz/convert-source-map) |
| `core-js-compat` | 3.49.0 | [link](https://github.com/zloirock/core-js) |
| `cross-fetch` | 3.2.0 | [link](https://github.com/lquixada/cross-fetch) |
| `cross-spawn` | 7.0.6 | [link](https://github.com/moxystudio/node-cross-spawn) |
| `css-in-js-utils` | 3.1.0 | [link](https://github.com/robinweser/css-in-js-utils) |
| `css-to-react-native` | 3.2.0 | [link](https://github.com/styled-components/css-to-react-native) |
| `csstype` | 3.2.3 | [link](https://github.com/frenic/csstype) |
| `debug` | 2.6.9 | [link](https://github.com/visionmedia/debug) |
| `debug` | 3.2.7 | [link](https://github.com/visionmedia/debug) |
| `debug` | 4.4.3 | [link](https://github.com/debug-js/debug) |
| `deep-extend` | 0.6.0 | [link](https://github.com/unclechu/node-deep-extend) |
| `deepmerge` | 4.3.1 | [link](https://github.com/TehShrike/deepmerge) |
| `defaults` | 1.0.4 | [link](https://github.com/sindresorhus/node-defaults) |
| `define-lazy-prop` | 2.0.0 | [link](https://github.com/sindresorhus/define-lazy-prop) |
| `depd` | 2.0.0 | [link](https://github.com/dougwilson/nodejs-depd) |
| `destroy` | 1.2.0 | [link](https://github.com/stream-utils/destroy) |
| `ee-first` | 1.1.1 | [link](https://github.com/jonathanong/ee-first) |
| `emoji-regex` | 8.0.0 | [link](https://github.com/mathiasbynens/emoji-regex) |
| `encodeurl` | 1.0.2 | [link](https://github.com/pillarjs/encodeurl) |
| `encodeurl` | 2.0.0 | [link](https://github.com/pillarjs/encodeurl) |
| `env-editor` | 0.4.2 | [link](https://github.com/sindresorhus/env-editor) |
| `error-stack-parser` | 2.1.4 | [link](https://github.com/stacktracejs/error-stack-parser) |
| `es-errors` | 1.3.0 | [link](https://github.com/ljharb/es-errors) |
| `escalade` | 3.2.0 | [link](https://github.com/lukeed/escalade) |
| `escape-html` | 1.0.3 | [link](https://github.com/component/escape-html) |
| `escape-string-regexp` | 1.0.5 | [link](https://github.com/sindresorhus/escape-string-regexp) |
| `escape-string-regexp` | 2.0.0 | [link](https://github.com/sindresorhus/escape-string-regexp) |
| `escape-string-regexp` | 4.0.0 | [link](https://github.com/sindresorhus/escape-string-regexp) |
| `etag` | 1.8.1 | [link](https://github.com/jshttp/etag) |
| `event-target-shim` | 5.0.1 | [link](https://github.com/mysticatea/event-target-shim) |
| `expo-asset` | 12.0.12 | [link](https://github.com/expo/expo) |
| `expo-constants` | 18.0.13 | [link](https://github.com/expo/expo) |
| `expo-file-system` | 19.0.21 | [link](https://github.com/expo/expo) |
| `expo-font` | 13.3.2 | [link](https://github.com/expo/expo) |
| `expo-font` | 14.0.11 | [link](https://github.com/expo/expo) |
| `expo-keep-awake` | 15.0.8 | [link](https://github.com/expo/expo) |
| `expo-modules-autolinking` | 3.0.24 | [link](https://github.com/expo/expo) |
| `expo-modules-core` | 3.0.29 | [link](https://github.com/expo/expo) |
| `expo-server` | 1.0.5 | [link](https://github.com/expo/expo) |
| `expo-speech` | 14.0.8 | [link](https://github.com/expo/expo) |
| `expo-status-bar` | 3.0.9 | [link](https://github.com/expo/expo) |
| `expo` | 54.0.33 | [link](https://github.com/expo/expo) |
| `fast-json-stable-stringify` | 2.1.0 | [link](https://github.com/epoberezkin/fast-json-stable-stringify) |
| `fbjs-css-vars` | 1.0.2 | [link](https://github.com/facebook/fbjs) |
| `fbjs` | 3.0.5 | [link](https://github.com/facebook/fbjs) |
| `fdir` | 6.5.0 | [link](https://github.com/thecodrr/fdir) |
| `fill-range` | 7.1.1 | [link](https://github.com/jonschlinkert/fill-range) |
| `finalhandler` | 1.1.2 | [link](https://github.com/pillarjs/finalhandler) |
| `find-up` | 4.1.0 | [link](https://github.com/sindresorhus/find-up) |
| `flow-enums-runtime` | 0.0.6 | [link](https://github.com/facebook/flow) |
| `freeport-async` | 2.0.0 | [link](https://github.com/expo/freeport-async) |
| `fresh` | 0.5.2 | [link](https://github.com/jshttp/fresh) |
| `fsevents` | 2.3.3 | [link](https://github.com/fsevents/fsevents) |
| `function-bind` | 1.1.2 | [link](https://github.com/Raynos/function-bind) |
| `gensync` | 1.0.0-beta.2 | [link](https://github.com/loganfsmyth/gensync) |
| `get-package-type` | 0.1.0 | [link](https://github.com/cfware/get-package-type) |
| `getenv` | 2.0.0 | [link](https://github.com/ctavan/node-getenv) |
| `has-flag` | 3.0.0 | [link](https://github.com/sindresorhus/has-flag) |
| `has-flag` | 4.0.0 | [link](https://github.com/sindresorhus/has-flag) |
| `hasown` | 2.0.3 | [link](https://github.com/inspect-js/hasOwn) |
| `hermes-estree` | 0.29.1 | [link](https://github.com/facebook/hermes) |
| `hermes-estree` | 0.32.0 | [link](https://github.com/facebook/hermes) |
| `hermes-parser` | 0.29.1 | [link](https://github.com/facebook/hermes) |
| `hermes-parser` | 0.32.0 | [link](https://github.com/facebook/hermes) |
| `http-errors` | 2.0.1 | [link](https://github.com/jshttp/http-errors) |
| `https-proxy-agent` | 7.0.6 | [link](https://github.com/TooTallNate/proxy-agents) |
| `iceberg-js` | 0.8.1 | [link](https://github.com/supabase/iceberg-js) |
| `ignore` | 5.3.2 | [link](https://github.com/kaelzhang/node-ignore) |
| `image-size` | 1.2.1 | [link](https://github.com/image-size/image-size) |
| `imurmurhash` | 0.1.4 | [link](https://github.com/jensyt/imurmurhash-js) |
| `inline-style-prefixer` | 7.0.1 | [link](https://github.com/robinweser/inline-style-prefixer) |
| `invariant` | 2.2.4 | [link](https://github.com/zertosh/invariant) |
| `is-core-module` | 2.16.1 | [link](https://github.com/inspect-js/is-core-module) |
| `is-docker` | 2.2.1 | [link](https://github.com/sindresorhus/is-docker) |
| `is-fullwidth-code-point` | 3.0.0 | [link](https://github.com/sindresorhus/is-fullwidth-code-point) |
| `is-number` | 7.0.0 | [link](https://github.com/jonschlinkert/is-number) |
| `is-wsl` | 2.2.0 | [link](https://github.com/sindresorhus/is-wsl) |
| `jest-environment-node` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `jest-get-type` | 29.6.3 | [link](https://github.com/jestjs/jest) |
| `jest-haste-map` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `jest-message-util` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `jest-mock` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `jest-regex-util` | 29.6.3 | [link](https://github.com/jestjs/jest) |
| `jest-util` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `jest-validate` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `jest-worker` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `jimp-compact` | 0.16.1 | [link](https://github.com/nuxt-community/jimp-compact) |
| `js-tokens` | 4.0.0 | [link](https://github.com/lydell/js-tokens) |
| `js-yaml` | 3.14.2 | [link](https://github.com/nodeca/js-yaml) |
| `js-yaml` | 4.1.1 | [link](https://github.com/nodeca/js-yaml) |
| `jsesc` | 3.1.0 | [link](https://github.com/mathiasbynens/jsesc) |
| `json-schema-to-ts` | 3.1.1 | [link](https://github.com/ThomasAribart/json-schema-to-ts) |
| `json5` | 2.2.3 | [link](https://github.com/json5/json5) |
| `kleur` | 3.0.3 | [link](https://github.com/lukeed/kleur) |
| `lan-network` | 0.1.7 | [link](https://github.com/kitten/lan-network) |
| `leven` | 3.1.0 | [link](https://github.com/sindresorhus/leven) |
| `lines-and-columns` | 1.2.4 | [link](https://github.com/eventualbuddha/lines-and-columns) |
| `linkify-it` | 5.0.0 | [link](https://github.com/markdown-it/linkify-it) |
| `locate-path` | 5.0.0 | [link](https://github.com/sindresorhus/locate-path) |
| `lodash.debounce` | 4.0.8 | [link](https://github.com/lodash/lodash) |
| `lodash.throttle` | 4.1.1 | [link](https://github.com/lodash/lodash) |
| `log-symbols` | 2.2.0 | [link](https://github.com/sindresorhus/log-symbols) |
| `loose-envify` | 1.4.0 | [link](https://github.com/zertosh/loose-envify) |
| `markdown-it` | 14.1.1 | [link](https://github.com/markdown-it/markdown-it) |
| `mdurl` | 2.0.0 | [link](https://github.com/markdown-it/mdurl) |
| `memoize-one` | 5.2.1 | [link](https://github.com/alexreardon/memoize-one) |
| `memoize-one` | 6.0.0 | [link](https://github.com/alexreardon/memoize-one) |
| `merge-stream` | 2.0.0 | [link](https://github.com/grncdr/merge-stream) |
| `metro-babel-transformer` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-cache-key` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-cache` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-config` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-core` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-file-map` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-minify-terser` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-resolver` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-runtime` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-source-map` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-symbolicate` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-transform-plugins` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro-transform-worker` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `metro` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `micromatch` | 4.0.8 | [link](https://github.com/micromatch/micromatch) |
| `mime-db` | 1.52.0 | [link](https://github.com/jshttp/mime-db) |
| `mime-types` | 2.1.35 | [link](https://github.com/jshttp/mime-types) |
| `mime` | 1.6.0 | [link](https://github.com/broofa/node-mime) |
| `mimic-fn` | 1.2.0 | [link](https://github.com/sindresorhus/mimic-fn) |
| `minimist` | 1.2.8 | [link](https://github.com/minimistjs/minimist) |
| `minizlib` | 3.1.0 | [link](https://github.com/isaacs/minizlib) |
| `mkdirp` | 1.0.4 | [link](https://github.com/isaacs/node-mkdirp) |
| `ms` | 2.0.0 | [link](https://github.com/zeit/ms) |
| `ms` | 2.1.3 | [link](https://github.com/vercel/ms) |
| `mz` | 2.7.0 | [link](https://github.com/normalize/mz) |
| `nanoid` | 3.3.11 | [link](https://github.com/ai/nanoid) |
| `negotiator` | 0.6.3 | [link](https://github.com/jshttp/negotiator) |
| `negotiator` | 0.6.4 | [link](https://github.com/jshttp/negotiator) |
| `nested-error-stacks` | 2.0.1 | [link](https://github.com/mdlavin/nested-error-stacks) |
| `node-fetch` | 2.7.0 | [link](https://github.com/bitinn/node-fetch) |
| `node-int64` | 0.4.0 | [link](https://github.com/broofa/node-int64) |
| `node-releases` | 2.0.38 | [link](https://github.com/chicoxyzzy/node-releases) |
| `normalize-path` | 3.0.0 | [link](https://github.com/jonschlinkert/normalize-path) |
| `nullthrows` | 1.1.1 | [link](https://github.com/zertosh/nullthrows) |
| `ob1` | 0.83.3 | [link](https://github.com/facebook/metro) |
| `object-assign` | 4.1.1 | [link](https://github.com/sindresorhus/object-assign) |
| `on-finished` | 2.3.0 | [link](https://github.com/jshttp/on-finished) |
| `on-finished` | 2.4.1 | [link](https://github.com/jshttp/on-finished) |
| `on-headers` | 1.1.0 | [link](https://github.com/jshttp/on-headers) |
| `onetime` | 2.0.1 | [link](https://github.com/sindresorhus/onetime) |
| `open` | 7.4.2 | [link](https://github.com/sindresorhus/open) |
| `open` | 8.4.2 | [link](https://github.com/sindresorhus/open) |
| `ora` | 3.4.0 | [link](https://github.com/sindresorhus/ora) |
| `p-limit` | 2.3.0 | [link](https://github.com/sindresorhus/p-limit) |
| `p-limit` | 3.1.0 | [link](https://github.com/sindresorhus/p-limit) |
| `p-locate` | 4.1.0 | [link](https://github.com/sindresorhus/p-locate) |
| `p-try` | 2.2.0 | [link](https://github.com/sindresorhus/p-try) |
| `parse-png` | 2.1.0 | [link](https://github.com/kevva/parse-png) |
| `parseurl` | 1.3.3 | [link](https://github.com/pillarjs/parseurl) |
| `path-exists` | 4.0.0 | [link](https://github.com/sindresorhus/path-exists) |
| `path-is-absolute` | 1.0.1 | [link](https://github.com/sindresorhus/path-is-absolute) |
| `path-key` | 3.1.1 | [link](https://github.com/sindresorhus/path-key) |
| `path-parse` | 1.0.7 | [link](https://github.com/jbgutierrez/path-parse) |
| `picomatch` | 2.3.2 | [link](https://github.com/micromatch/picomatch) |
| `picomatch` | 3.0.2 | [link](https://github.com/micromatch/picomatch) |
| `picomatch` | 4.0.4 | [link](https://github.com/micromatch/picomatch) |
| `pirates` | 4.0.7 | [link](https://github.com/danez/pirates) |
| `plist` | 3.1.0 | [link](https://github.com/TooTallNate/node-plist) |
| `pngjs` | 3.4.0 | [link](https://github.com/lukeapage/pngjs2) |
| `postcss-value-parser` | 4.2.0 | [link](https://github.com/TrySound/postcss-value-parser) |
| `postcss` | 8.4.49 | [link](https://github.com/postcss/postcss) |
| `pretty-bytes` | 5.6.0 | [link](https://github.com/sindresorhus/pretty-bytes) |
| `pretty-format` | 29.7.0 | [link](https://github.com/jestjs/jest) |
| `progress` | 2.0.3 | [link](https://github.com/visionmedia/node-progress) |
| `promise` | 7.3.1 | [link](https://github.com/then/promise) |
| `promise` | 8.3.0 | [link](https://github.com/then/promise) |
| `prompts` | 2.4.2 | [link](https://github.com/terkelg/prompts) |
| `prop-types` | 15.8.1 | [link](https://github.com/facebook/prop-types) |
| `punycode.js` | 2.3.1 | [link](https://github.com/mathiasbynens/punycode.js) |
| `punycode` | 2.3.1 | [link](https://github.com/mathiasbynens/punycode.js) |
| `queue` | 6.0.2 | [link](https://github.com/jessetane/queue) |
| `range-parser` | 1.2.1 | [link](https://github.com/jshttp/range-parser) |
| `react-devtools-core` | 6.1.5 | [link](https://github.com/facebook/react) |
| `react-dom` | 19.1.0 | [link](https://github.com/facebook/react) |
| `react-is` | 16.13.1 | [link](https://github.com/facebook/react) |
| `react-is` | 18.3.1 | [link](https://github.com/facebook/react) |
| `react-native-is-edge-to-edge` | 1.3.1 | [link](https://github.com/zoontek/react-native-edge-to-edge) |
| `react-native-pager-view` | 6.9.1 | [link](https://github.com/callstack/react-native-pager-view) |
| `react-native-web` | 0.21.2 | [link](https://github.com/necolas/react-native-web) |
| `react-native` | 0.81.5 | [link](https://github.com/facebook/react-native) |
| `react-refresh` | 0.14.2 | [link](https://github.com/facebook/react) |
| `react` | 19.1.0 | [link](https://github.com/facebook/react) |
| `regenerate-unicode-properties` | 10.2.2 | [link](https://github.com/mathiasbynens/regenerate-unicode-properties) |
| `regenerate` | 1.4.2 | [link](https://github.com/mathiasbynens/regenerate) |
| `regenerator-runtime` | 0.13.11 | [link](https://github.com/facebook/regenerator/tree/main/packages/runtime) |
| `regexpu-core` | 6.4.0 | [link](https://github.com/mathiasbynens/regexpu-core) |
| `regjsgen` | 0.8.0 | [link](https://github.com/bnjmnt4n/regjsgen) |
| `require-directory` | 2.1.1 | [link](https://github.com/troygoode/node-require-directory) |
| `require-from-string` | 2.0.2 | [link](https://github.com/floatdrop/require-from-string) |
| `requireg` | 0.2.2 | [link](https://github.com/h2non/requireg) |
| `resolve-from` | 5.0.0 | [link](https://github.com/sindresorhus/resolve-from) |
| `resolve-workspace-root` | 2.0.1 | [link](https://github.com/byCedric/resolve-workspace-root) |
| `resolve.exports` | 2.0.3 | [link](https://github.com/lukeed/resolve.exports) |
| `resolve` | 1.22.12 | [link](https://github.com/browserify/resolve) |
| `resolve` | 1.7.1 | [link](https://github.com/browserify/resolve) |
| `restore-cursor` | 2.0.0 | [link](https://github.com/sindresorhus/restore-cursor) |
| `safe-buffer` | 5.2.1 | [link](https://github.com/feross/safe-buffer) |
| `scheduler` | 0.26.0 | [link](https://github.com/facebook/react) |
| `send` | 0.19.2 | [link](https://github.com/pillarjs/send) |
| `serialize-error` | 2.1.0 | [link](https://github.com/sindresorhus/serialize-error) |
| `serve-static` | 1.16.3 | [link](https://github.com/expressjs/serve-static) |
| `setimmediate` | 1.0.5 | [link](https://github.com/YuzuJS/setImmediate) |
| `shebang-command` | 2.0.0 | [link](https://github.com/kevva/shebang-command) |
| `shebang-regex` | 3.0.0 | [link](https://github.com/sindresorhus/shebang-regex) |
| `shell-quote` | 1.8.3 | [link](https://github.com/ljharb/shell-quote) |
| `simple-plist` | 1.3.1 | [link](https://github.com/wollardj/simple-plist) |
| `sisteransi` | 1.0.5 | [link](https://github.com/terkelg/sisteransi) |
| `slash` | 3.0.0 | [link](https://github.com/sindresorhus/slash) |
| `slugify` | 1.6.9 | [link](https://github.com/simov/slugify) |
| `source-map-support` | 0.5.21 | [link](https://github.com/evanw/node-source-map-support) |
| `stack-utils` | 2.0.6 | [link](https://github.com/tapjs/stack-utils) |
| `stackframe` | 1.3.4 | [link](https://github.com/stacktracejs/stackframe) |
| `stacktrace-parser` | 0.1.11 | [link](https://github.com/errwischt/stacktrace-parser) |
| `statuses` | 1.5.0 | [link](https://github.com/jshttp/statuses) |
| `statuses` | 2.0.2 | [link](https://github.com/jshttp/statuses) |
| `string-width` | 4.2.3 | [link](https://github.com/sindresorhus/string-width) |
| `strip-ansi` | 5.2.0 | [link](https://github.com/chalk/strip-ansi) |
| `strip-ansi` | 6.0.1 | [link](https://github.com/chalk/strip-ansi) |
| `strip-json-comments` | 2.0.1 | [link](https://github.com/sindresorhus/strip-json-comments) |
| `structured-headers` | 0.4.1 | [link](https://github.com/evert/structured-header) |
| `styleq` | 0.1.3 | [link](https://github.com/necolas/styleq) |
| `sucrase` | 3.35.1 | [link](https://github.com/alangpierce/sucrase) |
| `supports-color` | 5.5.0 | [link](https://github.com/chalk/supports-color) |
| `supports-color` | 7.2.0 | [link](https://github.com/chalk/supports-color) |
| `supports-color` | 8.1.1 | [link](https://github.com/chalk/supports-color) |
| `supports-hyperlinks` | 2.3.0 | [link](https://github.com/jamestalmage/supports-hyperlinks) |
| `supports-preserve-symlinks-flag` | 1.0.0 | [link](https://github.com/inspect-js/node-supports-preserve-symlinks-flag) |
| `terminal-link` | 2.1.1 | [link](https://github.com/sindresorhus/terminal-link) |
| `thenify-all` | 1.6.0 | [link](https://github.com/thenables/thenify-all) |
| `thenify` | 3.3.1 | [link](https://github.com/thenables/thenify) |
| `throat` | 5.0.0 | [link](https://github.com/ForbesLindesay/throat) |
| `tinyglobby` | 0.2.16 | [link](https://github.com/SuperchupuDev/tinyglobby) |
| `to-regex-range` | 5.0.1 | [link](https://github.com/micromatch/to-regex-range) |
| `toidentifier` | 1.0.1 | [link](https://github.com/component/toidentifier) |
| `tr46` | 0.0.3 | [link](https://github.com/Sebmaster/tr46.js) |
| `ts-algebra` | 2.0.0 | [link](https://github.com/ThomasAribart/ts-algebra) |
| `type-detect` | 4.0.8 | [link](https://github.com/chaijs/type-detect) |
| `ua-parser-js` | 1.0.41 | [link](https://github.com/faisalman/ua-parser-js) |
| `uc.micro` | 2.1.0 | [link](https://github.com/markdown-it/uc.micro) |
| `undici-types` | 7.19.2 | [link](https://github.com/nodejs/undici) |
| `undici` | 6.25.0 | [link](https://github.com/nodejs/undici) |
| `unicode-canonical-property-names-ecmascript` | 2.0.1 | [link](https://github.com/mathiasbynens/unicode-canonical-property-names-ecmascript) |
| `unicode-match-property-ecmascript` | 2.0.0 | [link](https://github.com/mathiasbynens/unicode-match-property-ecmascript) |
| `unicode-match-property-value-ecmascript` | 2.2.1 | [link](https://github.com/mathiasbynens/unicode-match-property-value-ecmascript) |
| `unicode-property-aliases-ecmascript` | 2.2.0 | [link](https://github.com/mathiasbynens/unicode-property-aliases-ecmascript) |
| `unpipe` | 1.0.0 | [link](https://github.com/stream-utils/unpipe) |
| `update-browserslist-db` | 1.2.3 | [link](https://github.com/browserslist/update-db) |
| `utils-merge` | 1.0.1 | [link](https://github.com/jaredhanson/utils-merge) |
| `uuid` | 7.0.3 | [link](https://github.com/uuidjs/uuid) |
| `vary` | 1.1.2 | [link](https://github.com/jshttp/vary) |
| `vlq` | 1.0.1 | [link](https://github.com/Rich-Harris/vlq) |
| `wcwidth` | 1.0.1 | [link](https://github.com/timoxley/wcwidth) |
| `whatwg-fetch` | 3.6.20 | [link](https://github.com/github/fetch) |
| `whatwg-url-without-unicode` | 8.0.0-3 | [link](https://github.com/charpeni/whatwg-url) |
| `whatwg-url` | 5.0.0 | [link](https://github.com/jsdom/whatwg-url) |
| `wonka` | 6.3.6 | [link](https://github.com/0no-co/wonka) |
| `wrap-ansi` | 7.0.0 | [link](https://github.com/chalk/wrap-ansi) |
| `ws` | 6.2.3 | [link](https://github.com/websockets/ws) |
| `ws` | 7.5.10 | [link](https://github.com/websockets/ws) |
| `ws` | 8.20.0 | [link](https://github.com/websockets/ws) |
| `xml2js` | 0.6.0 | [link](https://github.com/Leonidas-from-XIV/node-xml2js) |
| `xmlbuilder` | 11.0.1 | [link](https://github.com/oozcitak/xmlbuilder-js) |
| `xmlbuilder` | 15.1.1 | [link](https://github.com/oozcitak/xmlbuilder-js) |
| `yargs` | 17.7.2 | [link](https://github.com/yargs/yargs) |
| `yocto-queue` | 0.1.0 | [link](https://github.com/sindresorhus/yocto-queue) |

</details>

---

## Regenerating this file

From a clone with `app/node_modules` installed:

```bash
cd app
npx --yes license-checker --production --csv > /tmp/third-party.csv
```

Then reformat to Markdown. Counts above exclude the `app@1.0.0` package itself (Intently's own code, covered by [`LICENSE`](./LICENSE)).
