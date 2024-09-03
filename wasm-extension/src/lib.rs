pub use common_types::*;
pub use extism_pdk::{error, info, log, warn};
use extism_pdk::{plugin_fn, FnResult, Json};
use handler::{
    get_accounts, get_album_songs, get_artist_songs, get_playback_details, get_playlist_content,
    get_playlist_from_url, get_playlists, get_provider_scopes, get_recommendations,
    get_song_from_id, get_song_from_url, handle_custom_request, on_player_state_changed,
    on_playlist_added, on_playlist_removed, on_preferences_changed, on_queue_changed, on_seeked,
    on_song_added, on_song_changed, on_song_removed, on_volume_changed, perform_account_login,
    search,
};
use serde_json::Value;

pub mod api;
pub mod handler;

extern "C" {
    fn init();
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn entry() -> FnResult<()> {
    unsafe {
        init();
    }
    Ok(())
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn get_provider_scopes_wrapper() -> FnResult<Json<Vec<ExtensionProviderScope>>> {
    let ret = get_provider_scopes()?;
    Ok(Json(ret))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn get_playlists_wrapper() -> FnResult<Json<PlaylistReturnType>> {
    let ret = get_playlists()?;
    Ok(Json(PlaylistReturnType { playlists: ret }))
}

#[tracing::instrument(level = "trace", skip(id))]
#[plugin_fn]
pub fn get_playlist_content_wrapper(id: String) -> FnResult<Json<SongsWithPageTokenReturnType>> {
    let ret = get_playlist_content(id)?;
    Ok(Json(SongsWithPageTokenReturnType {
        songs: ret,
        next_page_token: None,
    }))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn get_playlist_from_url_wrapper() -> FnResult<Json<PlaylistAndSongsReturnType>> {
    let ret = get_playlist_from_url()?;
    Ok(Json(PlaylistAndSongsReturnType {
        playlist: ret,
        songs: None,
    }))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn get_playback_details_wrapper(
    Json(song): Json<Song>,
) -> FnResult<Json<PlaybackDetailsReturnType>> {
    let ret = get_playback_details(song)?;
    Ok(Json(ret))
}

#[tracing::instrument(level = "trace", skip(term))]
#[plugin_fn]
pub fn search_wrapper(term: String) -> FnResult<Json<SearchReturnType>> {
    let ret = search(term)?;
    Ok(Json(SearchReturnType {
        songs: ret.songs,
        playlists: ret.playlists,
        artists: ret.artists,
        albums: ret.albums,
    }))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn get_recommendations_wrapper() -> FnResult<Json<RecommendationsReturnType>> {
    let ret = get_recommendations()?;
    Ok(Json(RecommendationsReturnType { songs: ret }))
}

#[tracing::instrument(level = "trace", skip(url))]
#[plugin_fn]
pub fn get_song_from_url_wrapper(url: String) -> FnResult<Json<SongReturnType>> {
    let ret = get_song_from_url(url)?;
    Ok(Json(SongReturnType { song: ret }))
}

#[tracing::instrument(level = "trace", skip(url))]
#[plugin_fn]
pub fn handle_custom_request_wrapper(url: String) -> FnResult<Json<CustomRequestReturnType>> {
    let ret = handle_custom_request(url)?;
    Ok(Json(ret))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn get_artist_songs_wrapper(
    Json(artist): Json<QueryableArtist>,
) -> FnResult<Json<SongsWithPageTokenReturnType>> {
    let ret = get_artist_songs(artist)?;
    Ok(Json(SongsWithPageTokenReturnType {
        songs: ret,
        next_page_token: None,
    }))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn get_album_songs_wrapper(
    Json(album): Json<QueryableAlbum>,
) -> FnResult<Json<SongsWithPageTokenReturnType>> {
    let ret = get_album_songs(album)?;
    Ok(Json(SongsWithPageTokenReturnType {
        songs: ret,
        next_page_token: None,
    }))
}

#[tracing::instrument(level = "trace", skip(id))]
#[plugin_fn]
pub fn get_song_from_id_wrapper(id: String) -> FnResult<Json<SongReturnType>> {
    let ret = get_song_from_id(id)?;
    Ok(Json(SongReturnType { song: ret }))
}

// PlayerEvents trait wrappers
#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_queue_changed_wrapper(Json(queue): Json<Value>) -> FnResult<Json<()>> {
    on_queue_changed(queue)?;
    Ok(Json(()))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_volume_changed_wrapper() -> FnResult<Json<()>> {
    on_volume_changed()?;
    Ok(Json(()))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_player_state_changed_wrapper() -> FnResult<Json<()>> {
    on_player_state_changed()?;
    Ok(Json(()))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_song_changed_wrapper() -> FnResult<Json<()>> {
    on_song_changed()?;
    Ok(Json(()))
}

#[tracing::instrument(level = "trace", skip(time))]
#[plugin_fn]
pub fn on_seeked_wrapper(time: f64) -> FnResult<Json<()>> {
    on_seeked(time)?;
    Ok(Json(()))
}

// PreferenceEvents trait wrapper
#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_preferences_changed_wrapper(Json(args): Json<PreferenceArgs>) -> FnResult<Json<()>> {
    on_preferences_changed(args)?;
    Ok(Json(()))
}

// DatabaseEvents trait wrappers
#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_song_added_wrapper(Json(song): Json<Song>) -> FnResult<Json<()>> {
    on_song_added(song)?;
    Ok(Json(()))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_song_removed_wrapper(Json(song): Json<Song>) -> FnResult<Json<()>> {
    on_song_removed(song)?;
    Ok(Json(()))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_playlist_added_wrapper(Json(playlist): Json<QueryablePlaylist>) -> FnResult<Json<()>> {
    on_playlist_added(playlist)?;
    Ok(Json(()))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn on_playlist_removed_wrapper(Json(playlist): Json<QueryablePlaylist>) -> FnResult<Json<()>> {
    on_playlist_removed(playlist)?;
    Ok(Json(()))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn get_accounts_wrapper() -> FnResult<Json<Vec<ExtensionAccountDetail>>> {
    let ret = get_accounts()?;
    Ok(Json(ret))
}

#[tracing::instrument(level = "trace", skip())]
#[plugin_fn]
pub fn perform_account_login_wrapper(Json(args): Json<AccountLoginArgs>) -> FnResult<Json<()>> {
    perform_account_login(args)?;
    Ok(Json(()))
}
