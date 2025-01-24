# Writing your first extension

{{#tabs }}
{{#tab name="Rust" }}
  Extensions are represented by the `Extension` trait.

  ```rust
  use moosync_edk::{
      api::{
          Accounts, ContextMenu, DatabaseEvents, Extension, PlayerEvents, PreferenceEvents, Provider,
      },
      handler::register_extension, info
  };

  struct SampleExtension {}

  impl SampleExtension {
      pub fn new() -> Self {
          Self {}
      }
  }

  impl PlayerEvents for SampleExtension {}
  impl Provider for SampleExtension {}
  impl DatabaseEvents for SampleExtension {}
  impl PreferenceEvents for SampleExtension {}
  impl ContextMenu for SampleExtension {}
  impl Accounts for SampleExtension {}
  impl Extension for SampleExtension {}
  ```

  You need to register your extension through the init function.
  ```rust
  #[no_mangle]
  pub extern "C" fn init() {
      info!("Initializing SampleExtension");

      let extension = SampleExtension::new();
      register_extension(Box::new(extension)).unwrap();

      info!("Initialized SampleExtension");
  }
  ```
{{#endtab }}
{{#tab name="Python" }}
  All extensions must start in a module called `extension`.
  The simplest way to do this is to create a file called `extension.py` in the root of your project.

  Extensions are represented by the `Extension` class.

  ```python
  from moosync_edk import Extension

  class SampleExtension(Extension):
      def __init__(self):
          super().__init__()
  ```

  You need to register your extension through the init function.
  ```python
  from moosync_edk import register_extension

  def init():
      print("Initializing SampleExtension")

      extension = SampleExtension()
      register_extension(extension)

      print("Initialized SampleExtension")
  ```
{{#endtab }}
{{#tab name="Javascript" }}
You need to re-export all methods provided by `@moosync/edk` package.

```javascript
module.exports = {
  ...module.exports,
  ...require('@moosync/edk').Exports
}
```

The entrypoint of your extension is a function called `entry`
  ```javascript
  export function entry() {
    console.log('Initialized ext')
  }
  ```
{{#endtab }}
{{#endtabs }}
