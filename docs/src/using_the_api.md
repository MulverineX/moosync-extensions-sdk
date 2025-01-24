# Using the API

The extension development kit provides APIs to fetch data from the main app.

For this example lets consider the `getCurrentSong` API.
`getCurrentSong` returns the actively playling song.
{{#tabs }}
{{#tab name="Rust" }}
  ```rust
  impl Provider for SampleExtension {
    fn get_provider_scopes(&self) -> Result<Vec<ExtensionProviderScope>> {
        Ok(vec![ExtensionProviderScope::Scrobble])
    }

    fn scrobble(&self, song: Song) -> Result<()> {
        let song: Option<Song> = moosync_edk::api::extension_api::get_current_song()?;
        Ok(())
    }
  }
  ```

{{#endtab }}
{{#tab name="Python" }}
  ```python
  class SampleExtension(Extension):
    def __init__(self):
        super().__init__()

    def get_provider_scopes(self) -> List[ProviderScopes]:
        return ["scrobble"]

    def scrobble(self, song: Song):
        song: Optional[Song] = self.api.get_current_song()
        return
  ```
{{#endtab }}
{{#tab name="Javascript" }}
```javascript
import { api } from '@moosync/edk'

export function entry() {
  api.on('getProviderScopes', () => {
    return ['scrobble']
  });

  api.on('onScrobble', async (term) => {
    const song = await api.getCurrentSong();
    return
  })
}
```
{{#endtab }}
{{#endtabs }}
