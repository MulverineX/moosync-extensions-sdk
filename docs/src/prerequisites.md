# Prerequisites

{{#tabs }}
{{#tab name="Rust" }}
  #### Create a new project

  ```bash
  cargo new --lib my_extension
  ```

  #### Add moosync-edk dependency
  ```bash
  cargo add --git https://github.com/Moosync/wasm-extension-runner.git
  ```
{{#endtab }}
{{#tab name="Python" }}
  #### Create a virtual environment

  ```bash
  python3 -m venv .venv
  ```

  #### Activate the virtual environment

  ```bash
  source .venv/bin/activate
  ```

  #### Install moosync-edk package
  ```bash
  pip install git+https://github.com/Moosync/wasm-extension-runner/#subdirectory=wasm-extension-py
  ```
{{#endtab }}
{{#tab name="Javascript" }}
  #### Create a new project

  ```bash
  yarn init
  ```

  #### Add moosync-edk package
  ```bash
  yarn add -D @moosync/edk
  ```

  #### Add esbuild
  ```bash
  yarn add -D esbuild
  ```

  #### Create esbuild configuration file `esbuild.js`

  ```javascript
  const esbuild = require('esbuild')
  // include this if you need some node support:
  // npm i @esbuild-plugins/node-modules-polyfill --save-dev
  const { NodeModulesPolyfillPlugin } = require('@esbuild-plugins/node-modules-polyfill')

  esbuild.build({
    // supports other types like js or ts
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
    bundle: true,
    sourcemap: true,
    plugins: [
      // NodeModulesPolyfillPlugin({
      //   url: true
      // })
    ], // include this if you need some node support
    minify: false, // might want to use true for production build
    format: 'cjs', // needs to be CJS for now
    target: ['es2020'] // don't go over es2020 because quickjs doesn't support it
  })
  ```

  #### Install [extism-js](https://github.com/extism/js-pdk)
{{#endtab }}
{{#endtabs }}
