declare module "main" {
  export function entry(): I32;

  export function get_provider_scopes_wrapper(): I32;
  export function get_playlists_wrapper(): I32;
  export function get_playlist_content_wrapper(): I32;
  export function get_playlist_from_url_wrapper(): I32;
  export function get_playback_details_wrapper(): I32;
  export function search_wrapper(): I32;
  export function get_recommendations_wrapper(): I32;
  export function get_song_from_url_wrapper(): I32;
  export function handle_custom_request_wrapper(): I32;
  export function get_artist_songs_wrapper(): I32;
  export function get_album_songs_wrapper(): I32;
  export function get_song_from_id_wrapper(): I32;
  export function on_queue_changed_wrapper(): I32;
  export function on_volume_changed_wrapper(): I32;
  export function on_player_state_changed_wrapper(): I32;
  export function on_song_changed_wrapper(): I32;
  export function on_seeked_wrapper(): I32;
  export function on_preferences_changed_wrapper(): I32;
  export function on_song_added_wrapper(): I32;
  export function on_song_removed_wrapper(): I32;
  export function on_playlist_added_wrapper(): I32;
  export function on_playlist_removed_wrapper(): I32;
  export function get_accounts_wrapper(): I32;
  export function perform_account_login_wrapper(): I32;
  export function scrobble_wrapper(): I32;
  export function oauth_callback_wrapper(): I32;
}

declare module "extism:host" {
  interface user {
    send_main_command(ptr: I64): I64;
    system_time(): I64;
    open_clientfd(path: I64): I64;
    write_sock(sock_id: I64, buf: I64): I64;
    read_sock(sock_id: I64, read_len: I64): I64;
  }
}
