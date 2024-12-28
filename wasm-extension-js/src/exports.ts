import { callListener } from "./api";

export namespace Exports {
  async function handleWrapper(event: string) {
    const input = Host.inputString();
    let params = undefined;
    if (input) {
      params = JSON.parse(input);
    }
    let resp = await callListener(event, params);
    if (resp) {
      Host.outputString(JSON.stringify(resp));
    } else {
      Host.outputString(JSON.stringify(null));
    }
  }

  export function get_provider_scopes_wrapper() {
    handleWrapper("getProviderScopes");
  }
  export function get_playlists_wrapper() {
    handleWrapper("getPlaylists");
  }
  export function get_playlist_content_wrapper() {
    handleWrapper("getPlaylistContent");
  }
  export function get_playlist_from_url_wrapper() {
    handleWrapper("getPlaylistFromUrl");
  }
  export function get_playback_details_wrapper() {
    handleWrapper("getPlaybackDetails");
  }
  export function search_wrapper() {
    handleWrapper("getSearch");
  }
  export function get_recommendations_wrapper() {
    handleWrapper("getRecommendations");
  }
  export function get_song_from_url_wrapper() {
    handleWrapper("getSongFromUrl");
  }
  export function handle_custom_request_wrapper() {
    handleWrapper("handleCustomRequest");
  }
  export function get_artist_songs_wrapper() {
    handleWrapper("getArtistSongs");
  }
  export function get_album_songs_wrapper() {
    handleWrapper("getAlbumSongs");
  }
  export function get_song_from_id_wrapper() {
    handleWrapper("getSongFromId");
  }
  export function on_queue_changed_wrapper() {
    handleWrapper("onQueueChanged");
  }
  export function on_volume_changed_wrapper() {
    handleWrapper("onVolumeChanged");
  }
  export function on_player_state_changed_wrapper() {
    handleWrapper("onPlayerStateChanged");
  }
  export function on_song_changed_wrapper() {
    handleWrapper("onSongChanged");
  }
  export function on_seeked_wrapper() {
    handleWrapper("onSeeked");
  }
  export function on_preferences_changed_wrapper() {
    handleWrapper("onPreferencesChanged");
  }
  export function on_song_added_wrapper() {
    handleWrapper("onSongAdded");
  }
  export function on_song_removed_wrapper() {
    handleWrapper("onSongRemoved");
  }
  export function on_playlist_added_wrapper() {
    handleWrapper("onPlaylistAdded");
  }
  export function on_playlist_removed_wrapper() {
    handleWrapper("onPlaylistRemoved");
  }
  export function get_accounts_wrapper() {
    handleWrapper("getAccounts");
  }
  export function perform_account_login_wrapper() {
    handleWrapper("performAccountLogin");
  }
  export function scrobble_wrapper() {
    handleWrapper("onScrobble");
  }
  export function oauth_callback_wrapper() {
    handleWrapper("oauthCallback");
  }
}
