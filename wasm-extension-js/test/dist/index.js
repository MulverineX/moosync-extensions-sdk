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

// Moosync
// Copyright (C) 2025 Moosync
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
// along with this program. If not, see <http://www.gnu.org/licenses/>.

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/@moosync/edk/lib/api.js
var require_api = __commonJS({
  "node_modules/@moosync/edk/lib/api.js"(exports, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var api_exports = {};
    __export2(api_exports, {
      api: () => api2,
      callListener: () => callListener
    });
    module2.exports = __toCommonJS2(api_exports);
    var LISTENERS = {};
    function camelToPascal(camelCaseStr) {
      return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
    }
    var api2 = new Proxy({}, {
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
  }
});

// node_modules/@moosync/edk/lib/index.js
var require_lib = __commonJS({
  "node_modules/@moosync/edk/lib/index.js"(exports, module2) {
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS2 = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports2 = {};
    __export2(src_exports2, {
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
    module2.exports = __toCommonJS2(src_exports2);
    var LISTENERS = {};
    function camelToPascal(camelCaseStr) {
      return camelCaseStr.charAt(0).toUpperCase() + camelCaseStr.slice(1);
    }
    var api2 = new Proxy({}, {
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
  }
});

// src/index.js
var src_exports = {};
__export(src_exports, {
  entry: () => entry
});
module.exports = __toCommonJS(src_exports);
var import_api = __toESM(require_api());
__reExport(src_exports, __toESM(require_lib()), module.exports);
function entry() {
  import_api.api.on("getAccounts", () => {
    console.log("Inside get accounts");
    return [
      {
        id: "string",
        packageName: "string",
        name: "string",
        bgColor: "string",
        icon: "string",
        loggedIn: false,
        username: void 0
      }
    ];
  });
  import_api.api.on("oauthCallback", (code) => {
    console.log("got code", code);
  });
  import_api.api.on("onScrobble", (song) => {
    console.log("got song", song);
  });
  import_api.api.on("onPlaylistRemoved", (playlist) => {
    console.log("got playlist", playlist);
  });
  import_api.api.on("onPlaylistAdded", (playlist) => {
    console.log("got playlist", playlist);
  });
  import_api.api.on("onSongAdded", (song) => {
    console.log("got song", song);
  });
  import_api.api.on("onSongRemoved", (song) => {
    console.log("got song", song);
  });
  import_api.api.on("onSongChanged", (song) => {
    console.log("got song", song);
  });
  import_api.api.on("onPreferencesChanged", (prefs) => {
    console.log("got preference args", prefs);
  });
  import_api.api.on("onSeeked", (time) => {
    console.log("got seeked time", time);
  });
  import_api.api.on("onPlayerStateChanged", (playerState) => {
    console.log("got player state changed", playerState);
  });
  import_api.api.on("onQueueChanged", (queue) => {
    console.log("got queue changed", queue);
  });
  import_api.api.on("onVolumeChanged", (volume) => {
    console.log("got volume changed", volume);
  });
  import_api.api.on("getProviderScopes", () => [
    "albumSongs",
    "recommendations",
    "scrobbles"
  ]);
  import_api.api.on("getPlaylists", async () => {
    return {
      playlists: [
        {
          playlist_id: "string",
          playlist_name: "string",
          playlist_desc: "string",
          playlist_coverPath: "string",
          playlist_song_count: 0,
          playlist_path: "string",
          icon: "string",
          extension: "string"
        }
      ]
    };
  });
  import_api.api.on("getPlaylistContent", async (id) => {
    return {
      songs: [
        {
          _id: id,
          title: "hello world",
          duration: 69,
          type: "LOCAL"
        }
      ]
    };
  });
  import_api.api.on("getPlaylistFromUrl", async (url) => {
    return {
      playlist: {
        playlist_id: "string",
        playlist_name: "string",
        playlist_desc: "string",
        playlist_coverPath: "string",
        playlist_song_count: 0,
        playlist_path: "string",
        icon: "string",
        extension: "string"
      }
    };
  });
  import_api.api.on("getPlaybackDetails", async (song) => {
    return {
      duration: 69,
      url: "hello world"
    };
  });
  import_api.api.on("getSearch", async (term) => {
    return {
      songs: [],
      playlists: [],
      artists: [],
      albums: [],
      genres: []
    };
  });
  import_api.api.on("getRecommendations", async () => {
    return { songs: [] };
  });
  import_api.api.on("getSongFromUrl", async (url) => {
    return {};
  });
  import_api.api.on("handleCustomRequest", async (url) => {
    return {};
  });
  import_api.api.on("getArtistSongs", async (artist) => {
    return { songs: [] };
  });
  import_api.api.on("getAlbumSongs", async (album) => {
    return { songs: [] };
  });
  import_api.api.on("getSongFromId", async (id) => {
    return {
      song: {
        _id: id,
        title: "hello world",
        duration: 69,
        type: "LOCAL"
      }
    };
  });
  console.log("inside entry here");
  console.log(
    import_api.api.getSong({
      song: {
        title: "hello"
      }
    })
  );
  console.log(import_api.api.getCurrentSong());
  console.log(import_api.api.getPlayerState());
  console.log(import_api.api.getVolume());
  console.log(import_api.api.getTime());
  console.log(import_api.api.getQueue());
  console.log(
    import_api.api.getPreference({
      key: "hello",
      defaultValue: "bye"
    })
  );
  console.log(
    import_api.api.getSecure({
      key: "hello",
      defaultValue: "bye"
    })
  );
  console.log(
    import_api.api.setSecure({
      key: "hello",
      value: "bye"
    })
  );
  console.log(
    import_api.api.setPreference({
      key: "hello",
      value: "bye"
    })
  );
  import_api.api.addSongs([
    {
      _id: "new id",
      title: "hello world",
      duration: 69,
      type: "LOCAL"
    }
  ]);
  import_api.api.removeSong({
    _id: "new id",
    title: "hello world",
    duration: 69,
    type: "LOCAL"
  });
  import_api.api.updateSong({
    _id: "new id",
    title: "hello world",
    duration: 69,
    type: "LOCAL"
  });
  import_api.api.addPlaylist({
    playlist_id: "new id",
    playlist_name: "hello"
  });
  import_api.api.addToPlaylist({
    playlistID: "new id",
    songs: []
  });
  import_api.api.registerOAuth("oauth token");
  import_api.api.openExternalUrl("new url");
  import_api.api.updateAccounts();
  console.log("got songs");
}
//# sourceMappingURL=index.js.map
