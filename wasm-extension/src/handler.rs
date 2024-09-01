use std::cell::RefCell;

use extism_pdk::FnResult;
use serde_json::Value;
use types::{
    entities::{QueryableAlbum, QueryableArtist, QueryablePlaylist, SearchResult},
    errors::Result,
    extensions::{
        CustomRequestReturnType, ExtensionProviderScope, PlaybackDetailsReturnType, PreferenceArgs,
    },
    songs::Song,
};

use crate::api::Extension;

macro_rules! generate_extension_methods {
    ($(
        $fn_name:ident (
            $( $arg_name:ident : $arg_type:ty ),*
        ) -> $ret_type:ty
    );* $(;)?) => {
        $(
            pub(crate) fn $fn_name($( $arg_name: $arg_type ),*) -> $ret_type {
                EXTENSION.with(|ext| {
                    if let Some(ext) = ext.borrow().as_ref() {
                        ext.$fn_name($( $arg_name ),*)
                    } else {
                        panic!("No extension registered");
                    }
                })
            }
        )*
    };
}

thread_local!(
    static EXTENSION: RefCell<Option<&'static dyn Extension>> = RefCell::new(None);
);

pub fn register_extension(extension: &'static impl Extension) -> FnResult<()> {
    EXTENSION.with(|ext| {
        *ext.borrow_mut() = Some(extension);
    });
    Ok(())
}

generate_extension_methods!(
    // Provider trait methods
    get_provider_scopes() -> Result<Vec<ExtensionProviderScope>>;
    get_playlists() -> Result<Vec<QueryablePlaylist>>;
    get_playlist_content(id: String) -> Result<Vec<Song>>;
    get_playlist_from_url() -> Result<QueryablePlaylist>;
    get_playback_details(song: Song) -> Result<PlaybackDetailsReturnType>;
    search(term: String) -> Result<SearchResult>;
    get_recommendations() -> Result<Vec<Song>>;
    get_song_from_url(url: String) -> Result<Song>;
    handle_custom_request(url: String) -> Result<CustomRequestReturnType>;
    get_artist_songs(artist: QueryableArtist) -> Result<Vec<Song>>;
    get_album_songs(album: QueryableAlbum) -> Result<Vec<Song>>;
    get_song_from_id(id: String) -> Result<Song>;

    // PlayerEvents trait methods
    on_queue_changed(queue: Value) -> Result<()>;
    on_volume_changed() -> Result<()>;
    on_player_state_changed() -> Result<()>;
    on_song_changed() -> Result<()>;
    on_seeked(time: f64) -> Result<()>;

    // PreferenceEvents trait methods
    on_preferences_changed(args: PreferenceArgs) -> Result<()>;

    // DatabaseEvents trait methods
    on_song_added(song: Song) -> Result<()>;
    on_song_removed(song: Song) -> Result<()>;
    on_playlist_added(playlist: QueryablePlaylist) -> Result<()>;
    on_playlist_removed(playlist: QueryablePlaylist) -> Result<()>;
);
