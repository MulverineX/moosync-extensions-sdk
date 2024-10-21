var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/moosync-edk/lib/index.js
var require_lib = __commonJS({
  "node_modules/moosync-edk/lib/index.js"(exports2, module2) {
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
    var src_exports = {};
    __export2(src_exports, {
      api: () => api2,
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
    module2.exports = __toCommonJS2(src_exports);
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

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  entry: () => entry
});
function entry() {
  import_moosync_edk.api.on("getAccounts", () => {
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
  import_moosync_edk.api.on("oauthCallback", (code) => {
    console.log("got code", code);
  });
  import_moosync_edk.api.on("onScrobble", (song) => {
    console.log("got song", song);
  });
  import_moosync_edk.api.on("onPlaylistRemoved", (playlist) => {
    console.log("got playlist", playlist);
  });
  import_moosync_edk.api.on("onPlaylistAdded", (playlist) => {
    console.log("got playlist", playlist);
  });
  import_moosync_edk.api.on("onSongAdded", (song) => {
    console.log("got song", song);
  });
  import_moosync_edk.api.on("onSongRemoved", (song) => {
    console.log("got song", song);
  });
  import_moosync_edk.api.on("onSongChanged", (song) => {
    console.log("got song", song);
  });
  import_moosync_edk.api.on("onPreferencesChanged", (prefs) => {
    console.log("got preference args", prefs);
  });
  import_moosync_edk.api.on("onSeeked", (time) => {
    console.log("got seeked time", time);
  });
  import_moosync_edk.api.on("onPlayerStateChanged", (playerState) => {
    console.log("got player state changed", playerState);
  });
  import_moosync_edk.api.on("onQueueChanged", (queue) => {
    console.log("got queue changed", queue);
  });
  import_moosync_edk.api.on("onVolumeChanged", (volume) => {
    console.log("got volume changed", volume);
  });
  import_moosync_edk.api.on("getProviderScopes", () => [
    "albumSongs",
    "recommendations",
    "scrobbles"
  ]);
  import_moosync_edk.api.on("getPlaylists", async () => {
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
  import_moosync_edk.api.on("getPlaylistContent", async (id) => {
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
  import_moosync_edk.api.on("getPlaylistFromUrl", async (url) => {
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
  import_moosync_edk.api.on("getPlaybackDetails", async (song) => {
    return {
      duration: 69,
      url: "hello world"
    };
  });
  import_moosync_edk.api.on("getSearch", async (term) => {
    return {
      songs: [],
      playlists: [],
      artists: [],
      albums: [],
      genres: []
    };
  });
  import_moosync_edk.api.on("getRecommendations", async () => {
    return { songs: [] };
  });
  import_moosync_edk.api.on("getSongFromUrl", async (url) => {
    return {};
  });
  import_moosync_edk.api.on("handleCustomRequest", async (url) => {
    return {};
  });
  import_moosync_edk.api.on("getArtistSongs", async (artist) => {
    return { songs: [] };
  });
  import_moosync_edk.api.on("getAlbumSongs", async (album) => {
    return { songs: [] };
  });
  import_moosync_edk.api.on("getSongFromId", async (id) => {
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
    import_moosync_edk.api.getSong({
      song: {
        title: "hello"
      }
    })
  );
  console.log(import_moosync_edk.api.getCurrentSong());
  console.log(import_moosync_edk.api.getPlayerState());
  console.log(import_moosync_edk.api.getVolume());
  console.log(import_moosync_edk.api.getTime());
  console.log(import_moosync_edk.api.getQueue());
  console.log(
    import_moosync_edk.api.getPreference({
      key: "hello",
      defaultValue: "bye"
    })
  );
  console.log(
    import_moosync_edk.api.getSecure({
      key: "hello",
      defaultValue: "bye"
    })
  );
  console.log(
    import_moosync_edk.api.setSecure({
      key: "hello",
      value: "bye"
    })
  );
  console.log(
    import_moosync_edk.api.setPreference({
      key: "hello",
      value: "bye"
    })
  );
  import_moosync_edk.api.addSongs([
    {
      _id: "new id",
      title: "hello world",
      duration: 69,
      type: "LOCAL"
    }
  ]);
  import_moosync_edk.api.removeSong({
    _id: "new id",
    title: "hello world",
    duration: 69,
    type: "LOCAL"
  });
  import_moosync_edk.api.updateSong({
    _id: "new id",
    title: "hello world",
    duration: 69,
    type: "LOCAL"
  });
  import_moosync_edk.api.addPlaylist({
    playlist_id: "new id",
    playlist_name: "hello"
  });
  import_moosync_edk.api.addToPlaylist({
    playlistID: "new id",
    songs: []
  });
  import_moosync_edk.api.registerOAuth("oauth token");
  import_moosync_edk.api.openExternalUrl("new url");
  import_moosync_edk.api.updateAccounts();
  console.log("got songs");
}
var import_moosync_edk;
var init_extension = __esm({
  "src/extension.ts"() {
    import_moosync_edk = __toESM(require_lib());
  }
});

// src/index.js
var { entry: entry2 } = (init_extension(), __toCommonJS(extension_exports));
var moosync_edk = require_lib();
module.exports = {
  entry: entry2
};
Object.keys(moosync_edk).forEach((key) => {
  if (key === "api") return;
  module.exports[key] = moosync_edk[key];
});
//# sourceMappingURL=index.js.map
