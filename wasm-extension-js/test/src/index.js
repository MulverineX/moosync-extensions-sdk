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

import { api } from "@moosync/edk/api";

export function entry() {
  api.on("getAccounts", () => {
    console.log("Inside get accounts");
    return [
      {
        id: "string",
        packageName: "string",
        name: "string",
        bgColor: "string",
        icon: "string",
        loggedIn: false,
        username: undefined,
      },
    ];
  });

  api.on("oauthCallback", (code) => {
    console.log("got code", code);
  });

  api.on("onScrobble", (song) => {
    console.log("got song", song);
  });

  api.on("onPlaylistRemoved", (playlist) => {
    console.log("got playlist", playlist);
  });

  api.on("onPlaylistAdded", (playlist) => {
    console.log("got playlist", playlist);
  });

  api.on("onSongAdded", (song) => {
    console.log("got song", song);
  });

  api.on("onSongRemoved", (song) => {
    console.log("got song", song);
  });

  api.on("onSongChanged", (song) => {
    console.log("got song", song);
  });

  api.on("onPreferencesChanged", (prefs) => {
    console.log("got preference args", prefs);
  });

  api.on("onSeeked", (time) => {
    console.log("got seeked time", time);
  });

  api.on("onPlayerStateChanged", (playerState) => {
    console.log("got player state changed", playerState);
  });

  api.on("onQueueChanged", (queue) => {
    console.log("got queue changed", queue);
  });

  api.on("onVolumeChanged", (volume) => {
    console.log("got volume changed", volume);
  });

  api.on("getProviderScopes", () => [
    "albumSongs",
    "recommendations",
    "scrobbles",
  ]);

  api.on("getPlaylists", async () => {
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
          extension: "string",
        },
      ],
    };
  });

  api.on("getPlaylistContent", async (id) => {
    return {
      songs: [
        {
          _id: id,
          title: "hello world",
          duration: 69,
          type: "LOCAL",
        },
      ],
    };
  });

  api.on("getPlaylistFromUrl", async (url) => {
    return {
      playlist: {
        playlist_id: "string",
        playlist_name: "string",
        playlist_desc: "string",
        playlist_coverPath: "string",
        playlist_song_count: 0,
        playlist_path: "string",
        icon: "string",
        extension: "string",
      },
    };
  });

  api.on("getPlaybackDetails", async (song) => {
    return {
      duration: 69,
      url: "hello world",
    };
  });

  api.on("getSearch", async (term) => {
    return {
      songs: [],
      playlists: [],
      artists: [],
      albums: [],
      genres: [],
    };
  });

  api.on("getRecommendations", async () => {
    return { songs: [] };
  });

  api.on("getSongFromUrl", async (url) => {
    return {};
  });

  api.on("handleCustomRequest", async (url) => {
    return {};
  });

  api.on("getArtistSongs", async (artist) => {
    return { songs: [] };
  });

  api.on("getAlbumSongs", async (album) => {
    return { songs: [] };
  });

  api.on("getSongFromId", async (id) => {
    return {
      song: {
        _id: id,
        title: "hello world",
        duration: 69,
        type: "LOCAL",
      },
    };
  });

  console.log("inside entry here");
  console.log(
    api.getSong({
      song: {
        title: "hello",
      },
    }),
  );

  console.log(api.getCurrentSong());
  console.log(api.getPlayerState());
  console.log(api.getVolume());
  console.log(api.getTime());
  console.log(api.getQueue());
  console.log(
    api.getPreference({
      key: "hello",
      defaultValue: "bye",
    }),
  );
  console.log(
    api.getSecure({
      key: "hello",
      defaultValue: "bye",
    }),
  );

  console.log(
    api.setSecure({
      key: "hello",
      value: "bye",
    }),
  );

  console.log(
    api.setPreference({
      key: "hello",
      value: "bye",
    }),
  );

  api.addSongs([
    {
      _id: "new id",
      title: "hello world",
      duration: 69,
      type: "LOCAL",
    },
  ]);

  api.removeSong({
    _id: "new id",
    title: "hello world",
    duration: 69,
    type: "LOCAL",
  });

  api.updateSong({
    _id: "new id",
    title: "hello world",
    duration: 69,
    type: "LOCAL",
  });

  api.addPlaylist({
    playlist_id: "new id",
    playlist_name: "hello",
  });

  api.addToPlaylist({
    playlistID: "new id",
    songs: [],
  });

  api.registerOAuth("oauth token");
  api.openExternalUrl("new url");
  api.updateAccounts();

  console.log("got songs");
}

export * from "@moosync/edk";
