# Getting started

Extensions follow a very specific layout.

## Creating a new extension

### Manifest
Create a new file called `package.json`. This will be the manifest for your extension containing all details and permissions about it.

A sample manifest looks like

```json
{
  "name": "moosync.sample.extension",
  "version": "0.0.1",
  "icon": "assets/icon.svg",
  "extensionEntry": "ext.wasm",
  "moosyncExtension": true,
  "displayName": "My extension",
  "permissions": {
    "hosts": [
      "*.google.com",
      "google.com"
    ],
    "paths": {
      "{ENV_1}": "/",
    }
  }
}
```

#### Fields
- `name`: A unique identifier for your extension.
- `version`: The version of your extension in semver format.
- `icon`: The icon of your extension. The path is relative to `package.json`.
- `extensionEntry`: The path to the compiled WASM file. The path is relative to `package.json`.
- `moosyncExtension`: This must be set to `true` for the extension to be loaded.
- `displayName`: The name of your extension that will be displayed in the UI.
- `permissions`: The permissions that your extension needs to run.
  - `hosts`: The hosts (URLs) that your extension needs to access.
  - `paths`: The paths that your extension needs to access. You can use environment variables in the path. The environment variable must be wrapped in `{}`. For example, `{ENV_1}` will be replaced with the value of `ENV_1` environment variable.

    Keys in the `paths` object is the location in the user's filesystem.
    Values in the `paths` object is where the actual directory will be accessible in the extension.
    Eg.
    ```json
    "paths": {
      "/test": "/"
    }
    ```
    To access `/test/file.txt` in the extension, you can use the path `/file.txt`.
