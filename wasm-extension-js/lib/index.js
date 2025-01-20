// Moosync
// Copyright (C) 2024, 2025  Moosync <support@moosync.app>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
  Exports: () => Exports,
  api: () => api,
  callListener: () => callListener,
  open_sock: () => open_sock,
  read_sock: () => read_sock,
  write_sock: () => write_sock
});
module.exports = __toCommonJS(src_exports);

// src/api.ts
var LISTENERS;
function camelToPascal(camelCaseStr) {
  return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
}
var api = new Proxy({}, {
  get: (_target, prop, _receiver) => {
    if (prop === "on") {
      return (eventName, callback) => {
        if (!LISTENERS) {
          LISTENERS = {};
        }
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
  if (LISTENERS && LISTENERS[event]) {
    return Promise.resolve(LISTENERS[event](...args));
  }
}
function open_sock(path) {
  const { open_clientfd } = Host.getFunctions();
  const msg = Memory.fromString(path);
  const offset = open_clientfd(msg.offset);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}
function write_sock(sock_id, buf) {
  const { write_sock: write_sock2 } = Host.getFunctions();
  const msg = Memory.fromString(buf);
  const offset = write_sock2(sock_id, msg.offset);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}
function read_sock(sock_id, read_len) {
  const { read_sock: read_sock2 } = Host.getFunctions();
  const offset = read_sock2(sock_id, read_len);
  const response = Memory.find(offset).readString();
  return JSON.parse(response);
}

// src/exports.ts
var Exports;
((Exports2) => {
  async function handleWrapper(event) {
    const input = Host.inputString();
    let params = void 0;
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
  function get_provider_scopes_wrapper() {
    handleWrapper("getProviderScopes");
  }
  Exports2.get_provider_scopes_wrapper = get_provider_scopes_wrapper;
  function get_playlists_wrapper() {
    handleWrapper("getPlaylists");
  }
  Exports2.get_playlists_wrapper = get_playlists_wrapper;
  function get_playlist_content_wrapper() {
    handleWrapper("getPlaylistContent");
  }
  Exports2.get_playlist_content_wrapper = get_playlist_content_wrapper;
  function get_playlist_from_url_wrapper() {
    handleWrapper("getPlaylistFromUrl");
  }
  Exports2.get_playlist_from_url_wrapper = get_playlist_from_url_wrapper;
  function get_playback_details_wrapper() {
    handleWrapper("getPlaybackDetails");
  }
  Exports2.get_playback_details_wrapper = get_playback_details_wrapper;
  function search_wrapper() {
    handleWrapper("getSearch");
  }
  Exports2.search_wrapper = search_wrapper;
  function get_recommendations_wrapper() {
    handleWrapper("getRecommendations");
  }
  Exports2.get_recommendations_wrapper = get_recommendations_wrapper;
  function get_song_from_url_wrapper() {
    handleWrapper("getSongFromUrl");
  }
  Exports2.get_song_from_url_wrapper = get_song_from_url_wrapper;
  function handle_custom_request_wrapper() {
    handleWrapper("handleCustomRequest");
  }
  Exports2.handle_custom_request_wrapper = handle_custom_request_wrapper;
  function get_artist_songs_wrapper() {
    handleWrapper("getArtistSongs");
  }
  Exports2.get_artist_songs_wrapper = get_artist_songs_wrapper;
  function get_album_songs_wrapper() {
    handleWrapper("getAlbumSongs");
  }
  Exports2.get_album_songs_wrapper = get_album_songs_wrapper;
  function get_song_from_id_wrapper() {
    handleWrapper("getSongFromId");
  }
  Exports2.get_song_from_id_wrapper = get_song_from_id_wrapper;
  function on_queue_changed_wrapper() {
    handleWrapper("onQueueChanged");
  }
  Exports2.on_queue_changed_wrapper = on_queue_changed_wrapper;
  function on_volume_changed_wrapper() {
    handleWrapper("onVolumeChanged");
  }
  Exports2.on_volume_changed_wrapper = on_volume_changed_wrapper;
  function on_player_state_changed_wrapper() {
    handleWrapper("onPlayerStateChanged");
  }
  Exports2.on_player_state_changed_wrapper = on_player_state_changed_wrapper;
  function on_song_changed_wrapper() {
    handleWrapper("onSongChanged");
  }
  Exports2.on_song_changed_wrapper = on_song_changed_wrapper;
  function on_seeked_wrapper() {
    handleWrapper("onSeeked");
  }
  Exports2.on_seeked_wrapper = on_seeked_wrapper;
  function on_preferences_changed_wrapper() {
    handleWrapper("onPreferencesChanged");
  }
  Exports2.on_preferences_changed_wrapper = on_preferences_changed_wrapper;
  function on_song_added_wrapper() {
    handleWrapper("onSongAdded");
  }
  Exports2.on_song_added_wrapper = on_song_added_wrapper;
  function on_song_removed_wrapper() {
    handleWrapper("onSongRemoved");
  }
  Exports2.on_song_removed_wrapper = on_song_removed_wrapper;
  function on_playlist_added_wrapper() {
    handleWrapper("onPlaylistAdded");
  }
  Exports2.on_playlist_added_wrapper = on_playlist_added_wrapper;
  function on_playlist_removed_wrapper() {
    handleWrapper("onPlaylistRemoved");
  }
  Exports2.on_playlist_removed_wrapper = on_playlist_removed_wrapper;
  function get_accounts_wrapper() {
    handleWrapper("getAccounts");
  }
  Exports2.get_accounts_wrapper = get_accounts_wrapper;
  function perform_account_login_wrapper() {
    handleWrapper("performAccountLogin");
  }
  Exports2.perform_account_login_wrapper = perform_account_login_wrapper;
  function scrobble_wrapper() {
    handleWrapper("onScrobble");
  }
  Exports2.scrobble_wrapper = scrobble_wrapper;
  function oauth_callback_wrapper() {
    handleWrapper("oauthCallback");
  }
  Exports2.oauth_callback_wrapper = oauth_callback_wrapper;
})(Exports || (Exports = {}));
//# sourceMappingURL=index.js.map
