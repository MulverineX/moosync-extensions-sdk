var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  api: () => api,
  get_accounts_wrapper: () => get_accounts_wrapper,
  get_album_songs_wrapper: () => get_album_songs_wrapper,
  get_artist_songs_wrapper: () => get_artist_songs_wrapper,
  get_playback_details_wrapper: () => get_playback_details_wrapper,
  get_playlist_content_wrapper: () => get_playlist_content_wrapper,
  get_playlist_from_url_wrapper: () => get_playlist_from_url_wrapper,
  get_playlists_wrapper: () => get_playlists_wrapper,
  get_provider_scopes_wrapper: () => get_provider_scopes_wrapper,
  get_recommendations_wrapper: () => get_recommendations_wrapper,
  get_song_from_id_wrapper: () => get_song_from_id_wrapper,
  get_song_from_url_wrapper: () => get_song_from_url_wrapper,
  handle_custom_request_wrapper: () => handle_custom_request_wrapper,
  oauth_callback_wrapper: () => oauth_callback_wrapper,
  on_player_state_changed_wrapper: () => on_player_state_changed_wrapper,
  on_playlist_added_wrapper: () => on_playlist_added_wrapper,
  on_playlist_removed_wrapper: () => on_playlist_removed_wrapper,
  on_preferences_changed_wrapper: () => on_preferences_changed_wrapper,
  on_queue_changed_wrapper: () => on_queue_changed_wrapper,
  on_seeked_wrapper: () => on_seeked_wrapper,
  on_song_added_wrapper: () => on_song_added_wrapper,
  on_song_changed_wrapper: () => on_song_changed_wrapper,
  on_song_removed_wrapper: () => on_song_removed_wrapper,
  on_volume_changed_wrapper: () => on_volume_changed_wrapper,
  perform_account_login_wrapper: () => perform_account_login_wrapper,
  scrobble_wrapper: () => scrobble_wrapper,
  search_wrapper: () => search_wrapper
});
module.exports = __toCommonJS(src_exports);

// src/extensionHandler.ts
var LISTENERS = {};
function camelToPascal(camelCaseStr) {
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
}
var api = new Proxy({}, {
  get: (_target, prop, _receiver) => {
    if (prop === "on") {
      return (eventName, callback) => {
        LISTENERS[eventName] = callback;
      };
    }
    if (typeof prop === "string") {
      return (arg) => {
        const { send_main_command } = Host.getFunctions();
        let msg;
        msg = JSON.stringify({ [camelToPascal(prop)]: arg ?? [] });
        console.log("parsed ext command msg", msg, prop, arg);
        const mem = Memory.fromString(msg);
        const offset = send_main_command(mem.offset);
        const response = Memory.find(offset).readString();
        return JSON.parse(response);
      };
    }
    return void 0;
  }
});
function callListener(event, ...args) {
  if (LISTENERS[event]) {
    return Promise.resolve(LISTENERS[event](...args));
  }
  throw new Error("Not implemented");
}

// src/index.ts
async function handleWrapper(event) {
  const input = Host.inputString();
  let params = void 0;
  if (input) {
    params = JSON.parse(input);
  }
  let resp = await callListener(event, params);
  if (resp) {
    Host.outputString(JSON.stringify(resp));
  }
}
function get_provider_scopes_wrapper() {
  handleWrapper("getProviderScopes");
}
function get_playlists_wrapper() {
  handleWrapper("getPlaylists");
}
function get_playlist_content_wrapper() {
  handleWrapper("getPlaylistContent");
}
function get_playlist_from_url_wrapper() {
  handleWrapper("getPlaylistFromUrl");
}
function get_playback_details_wrapper() {
  handleWrapper("getPlaybackDetails");
}
function search_wrapper() {
  handleWrapper("getSearch");
}
function get_recommendations_wrapper() {
  handleWrapper("getRecommendations");
}
function get_song_from_url_wrapper() {
  handleWrapper("getSongFromUrl");
}
function handle_custom_request_wrapper() {
  handleWrapper("handleCustomRequest");
}
function get_artist_songs_wrapper() {
  handleWrapper("getArtistSongs");
}
function get_album_songs_wrapper() {
  handleWrapper("getAlbumSongs");
}
function get_song_from_id_wrapper() {
  handleWrapper("getSongFromId");
}
function on_queue_changed_wrapper() {
  handleWrapper("onQueueChanged");
}
function on_volume_changed_wrapper() {
  handleWrapper("onVolumeChanged");
}
function on_player_state_changed_wrapper() {
  handleWrapper("onPlayerStateChanged");
}
function on_song_changed_wrapper() {
  handleWrapper("onSongChanged");
}
function on_seeked_wrapper() {
  handleWrapper("onSeeked");
}
function on_preferences_changed_wrapper() {
  handleWrapper("onPreferencesChanged");
}
function on_song_added_wrapper() {
  handleWrapper("onSongAdded");
}
function on_song_removed_wrapper() {
  handleWrapper("onSongRemoved");
}
function on_playlist_added_wrapper() {
  handleWrapper("onPlaylistAdded");
}
function on_playlist_removed_wrapper() {
  handleWrapper("onPlaylistRemoved");
}
function get_accounts_wrapper() {
  handleWrapper("getAccounts");
}
function perform_account_login_wrapper() {
  handleWrapper("performAccountLogin");
}
function scrobble_wrapper() {
  handleWrapper("onScrobble");
}
function oauth_callback_wrapper() {
  handleWrapper("oauthCallback");
}
//# sourceMappingURL=index.js.map
