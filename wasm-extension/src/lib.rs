pub use common_types::*;
use extism_pdk::{host_fn, plugin_fn, FnResult, Json};
use handler::{
    get_album_songs, get_artist_songs, get_playback_details, get_playlist_content,
    get_playlist_from_url, get_playlists, get_provider_scopes, get_recommendations,
    get_song_from_id, get_song_from_url, handle_custom_request, on_player_state_changed,
    on_playlist_added, on_playlist_removed, on_preferences_changed, on_queue_changed, on_seeked,
    on_song_added, on_song_changed, on_song_removed, on_volume_changed, search,
};
use serde_json::Value;

pub mod api;
pub mod handler;

extern "C" {
    fn init();
}

#[plugin_fn]
pub fn entry() -> FnResult<()> {
    unsafe {
        init();
    }
    Ok(())
}

#[host_fn]
extern "ExtismHost" {
    fn ext_reply(channel: String, input: String);
}

#[plugin_fn]
pub fn get_provider_scopes_wrapper() -> FnResult<Json<Vec<ExtensionProviderScope>>> {
    let ret = get_provider_scopes()?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_playlists_wrapper() -> FnResult<Json<Vec<QueryablePlaylist>>> {
    let ret = get_playlists()?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_playlist_content_wrapper(id: String) -> FnResult<Json<Vec<Song>>> {
    let ret = get_playlist_content(id)?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_playlist_from_url_wrapper() -> FnResult<Json<QueryablePlaylist>> {
    let ret = get_playlist_from_url()?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_playback_details_wrapper(
    Json(song): Json<Song>,
) -> FnResult<Json<PlaybackDetailsReturnType>> {
    let ret = get_playback_details(song)?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn search_wrapper(term: String) -> FnResult<Json<SearchResult>> {
    let ret = search(term)?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_recommendations_wrapper() -> FnResult<Json<Vec<Song>>> {
    let ret = get_recommendations()?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_song_from_url_wrapper(url: String) -> FnResult<Json<Song>> {
    let ret = get_song_from_url(url)?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn handle_custom_request_wrapper(url: String) -> FnResult<Json<CustomRequestReturnType>> {
    let ret = handle_custom_request(url)?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_artist_songs_wrapper(Json(artist): Json<QueryableArtist>) -> FnResult<Json<Vec<Song>>> {
    let ret = get_artist_songs(artist)?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_album_songs_wrapper(Json(album): Json<QueryableAlbum>) -> FnResult<Json<Vec<Song>>> {
    let ret = get_album_songs(album)?;
    Ok(Json(ret))
}

#[plugin_fn]
pub fn get_song_from_id_wrapper(id: String) -> FnResult<Json<Song>> {
    let ret = get_song_from_id(id)?;
    Ok(Json(ret))
}

// PlayerEvents trait wrappers
#[plugin_fn]
pub fn on_queue_changed_wrapper(Json(queue): Json<Value>) -> FnResult<Json<()>> {
    on_queue_changed(queue)?;
    Ok(Json(()))
}

#[plugin_fn]
pub fn on_volume_changed_wrapper() -> FnResult<Json<()>> {
    on_volume_changed()?;
    Ok(Json(()))
}

#[plugin_fn]
pub fn on_player_state_changed_wrapper() -> FnResult<Json<()>> {
    on_player_state_changed()?;
    Ok(Json(()))
}

#[plugin_fn]
pub fn on_song_changed_wrapper() -> FnResult<Json<()>> {
    on_song_changed()?;
    Ok(Json(()))
}

#[plugin_fn]
pub fn on_seeked_wrapper(time: f64) -> FnResult<Json<()>> {
    on_seeked(time)?;
    Ok(Json(()))
}

// PreferenceEvents trait wrapper
#[plugin_fn]
pub fn on_preferences_changed_wrapper(Json(args): Json<PreferenceArgs>) -> FnResult<Json<()>> {
    on_preferences_changed(args)?;
    Ok(Json(()))
}

// DatabaseEvents trait wrappers
#[plugin_fn]
pub fn on_song_added_wrapper(Json(song): Json<Song>) -> FnResult<Json<()>> {
    on_song_added(song)?;
    Ok(Json(()))
}

#[plugin_fn]
pub fn on_song_removed_wrapper(Json(song): Json<Song>) -> FnResult<Json<()>> {
    on_song_removed(song)?;
    Ok(Json(()))
}

#[plugin_fn]
pub fn on_playlist_added_wrapper(Json(playlist): Json<QueryablePlaylist>) -> FnResult<Json<()>> {
    on_playlist_added(playlist)?;
    Ok(Json(()))
}

#[plugin_fn]
pub fn on_playlist_removed_wrapper(Json(playlist): Json<QueryablePlaylist>) -> FnResult<Json<()>> {
    on_playlist_removed(playlist)?;
    Ok(Json(()))
}
