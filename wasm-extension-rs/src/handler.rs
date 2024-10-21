use std::{cell::RefCell, rc::Rc};

use common_types::{
    AccountLoginArgs, CustomRequestReturnType, ExtensionAccountDetail, ExtensionProviderScope,
    MoosyncResult, PlaybackDetailsReturnType, PreferenceArgs, QueryableAlbum, QueryableArtist,
    QueryablePlaylist, SearchResult, Song,
};
use extism_pdk::FnResult;
use serde_json::Value;

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
    static EXTENSION: RefCell<Option<Rc<Box<dyn Extension>>>> = RefCell::new(None);
);

#[tracing::instrument(level = "trace", skip(extension))]
pub fn register_extension(extension: Box<dyn Extension>) -> FnResult<()> {
    EXTENSION.with(|ext| {
        ext.borrow_mut().replace(Rc::new(extension));
    });
    Ok(())
}

generate_extension_methods!(
    // Provider trait methods
    get_provider_scopes() -> MoosyncResult<Vec<ExtensionProviderScope>>;
    get_playlists() -> MoosyncResult<Vec<QueryablePlaylist>>;
    get_playlist_content(id: String) -> MoosyncResult<Vec<Song>>;
    get_playlist_from_url(url: String) -> MoosyncResult<Option<QueryablePlaylist>>;
    get_playback_details(song: Song) -> MoosyncResult<PlaybackDetailsReturnType>;
    search(term: String) -> MoosyncResult<SearchResult>;
    get_recommendations() -> MoosyncResult<Vec<Song>>;
    get_song_from_url(url: String) -> MoosyncResult<Option<Song>>;
    handle_custom_request(url: String) -> MoosyncResult<CustomRequestReturnType>;
    get_artist_songs(artist: QueryableArtist) -> MoosyncResult<Vec<Song>>;
    get_album_songs(album: QueryableAlbum) -> MoosyncResult<Vec<Song>>;
    get_song_from_id(id: String) -> MoosyncResult<Option<Song>>;
    scrobble(song: Song) -> MoosyncResult<()>;
    oauth_callback(code: String) -> MoosyncResult<()>;

    // PlayerEvents trait methods
    on_queue_changed(queue: Value) -> MoosyncResult<()>;
    on_volume_changed() -> MoosyncResult<()>;
    on_player_state_changed() -> MoosyncResult<()>;
    on_song_changed() -> MoosyncResult<()>;
    on_seeked(time: f64) -> MoosyncResult<()>;

    // PreferenceEvents trait methods
    on_preferences_changed(args: PreferenceArgs) -> MoosyncResult<()>;

    // DatabaseEvents trait methods
    on_song_added(song: Song) -> MoosyncResult<()>;
    on_song_removed(song: Song) -> MoosyncResult<()>;
    on_playlist_added(playlist: QueryablePlaylist) -> MoosyncResult<()>;
    on_playlist_removed(playlist: QueryablePlaylist) -> MoosyncResult<()>;

    // Account trait methods
    get_accounts() -> MoosyncResult<Vec<ExtensionAccountDetail>>;
    perform_account_login(args: AccountLoginArgs) -> MoosyncResult<()>;
);
