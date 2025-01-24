# Required implementations

All extensions must return ProviderScopes. These scopes determine which events are sent to your extension.

Lets consider the `search` scope for this example. Adding the search scope would cause the main app to request search results from your extension.

{{#tabs }}
{{#tab name="Rust" }}
  ```rust
  impl Provider for SampleExtension {
    fn get_provider_scopes(&self) -> Result<Vec<ExtensionProviderScope>> {
        Ok(vec![ExtensionProviderScope::Search])
    }

    fn search(&self, term: String) -> MoosyncResult<SearchResult> {
        SearchResult {
            songs: vec![],
            artists: vec![],
            playlists: vec![],
            albums: vec![],
            genres: vec![]
        }
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
        return ["search"]

     def get_search(self, term: str) -> SearchReturnType:
        return SearchReturnType(songs=[], artists=[], playlists=[], albums=[], genres=[])
  ```
{{#endtab }}
{{#tab name="Javascript" }}
```javascript
export function entry() {
  api.on('getProviderScopes', () => {
    return ['search']
  });

  api.on('getSearch', async (term) => {
    return {
      songs: [],
      artists: [],
      albums: [],
      playlists: [],
      genres: []
    }
  })

  console.log('Initialized ext');
}
```
{{#endtab }}
{{#endtabs }}
