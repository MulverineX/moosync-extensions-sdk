export interface Album {
  album_id?: string;
  album_name?: string;
  album_coverPath_high?: string;
  album_coverPath_low?: string;
  album_song_count?: number;
  album_artist?: string;
  album_extra_info?: string;
  year?: number;
}

export interface Artist {
  artist_id: string;
  artist_name?: string;
  artist_mbid?: string;
  artist_coverPath?: string;
  artist_song_count?: number;
  artist_extra_info?: {
    youtube?: {
      channel_id?: string;
    };
    spotify?: {
      artist_id?: string;
    };
    extensions?: Record<string, Record<string, string | undefined> | undefined>;
  };
}

export interface Genre {
  genre_id: string;
  genre_name: string;
  genre_song_count: number;
}

export interface Playlist {
  playlist_id: string;
  playlist_name: string;
  playlist_desc?: string;
  playlist_coverPath?: string | undefined;
  playlist_song_count?: number;
  playlist_path?: string;
  icon?: string;
  extension?: string;
}

export type PlayerTypes =
  | "LOCAL"
  | "YOUTUBE"
  | "SPOTIFY"
  | "URL"
  | "DASH"
  | "HLS";

export interface Song {
  _id: string;
  path?: string;
  size?: number;
  title: string;
  song_coverPath_low?: string;
  song_coverPath_high?: string;
  album?: Album;
  artists?: Artist[];
  date?: string;
  year?: number | string;

  genre?: string[];
  lyrics?: string;
  releaseType?: string[];
  bitrate?: number;
  codec?: string;
  container?: string;
  duration: number;
  sampleRate?: number;
  hash?: string;
  inode?: string;
  deviceno?: string;
  url?: string;
  playbackUrl?: string;
  date_added?: number;
  providerExtension?: string;
  icon?: string;
  type: PlayerTypes;
  playCount?: number;
  showInLibrary?: boolean;
  track_no?: number;
}

export interface SearchableSong {
  _id?: string;
  path?: string;
  title?: string;
  url?: string;
  playbackUrl?: string;

  // MD5 hash
  hash?: string;

  size?: number;
  inode?: string;
  deviceno?: string;

  type?: PlayerTypes;

  // Will return all songs provided by this extension
  extension?: boolean | string;

  showInLibrary?: boolean;
}

type PlayerState = "PLAYING" | "PAUSED" | "STOPPED" | "LOADING";

/**
 * Sort by key in Song.
 * If asc is true then results will be sorted in ascending otherwise descending
 */
type SongSortOptions = { type: keyof Song; asc: boolean };

/**
 * Options for searching songs from Database
 * To search for all tracks with a specific term, surround the term with %.
 * Eg. if the term is 'aaa', to get all songs containing 'aaa' in the title,
 * put the term as '%aaa%' in 'song.title'.
 */
export interface SongAPIOptions {
  /**
   * To search tracks by properties in song, specify this property.
   */
  song?: SearchableSong;

  /**
   * To search tracks by properties in album, specify this property.
   */
  album?: Partial<Album>;

  /**
   * To search tracks by properties in artists, specify this property.
   */
  artist?: Partial<Artist>;

  /**
   * To search tracks by properties in genre, specify this property.
   */
  genre?: Partial<Genre>;

  /**
   * To search tracks by properties in playlist, specify this property.
   */
  playlist?: Partial<Playlist>;

  /**
   * To sort the results, specify this property
   */
  sortBy?: SongSortOptions | SongSortOptions[];

  /**
   * If false, then the exact match of all options will be provided.
   * If true, then even if a track matches one of the options, it will be returned.
   * In terms of SQL, true will add 'AND' between where queries and false will add 'OR'.
   *
   * Eg. If song.title is 'aaa' and album.album_name is 'bbb'
   *
   * In this scenario if inclusive is true, then all tracks having title as 'aaa'
   * AND album_name as 'bbb' will be returned
   *
   * If inclusive is false then songs having title as 'aaa' OR album_name as 'bbb' will be returned
   *
   * False by default
   */
  inclusive?: boolean;

  /**
   * If true, then inverts the query. It will return all records which don't match the search criteria
   * If false, then it will return all records which match the search criteria
   *
   * false by default
   */
  invert?: boolean;
}

/**
 * Options for searching entities like Albums, Artists, Playlists or Genre
 *
 */
export type EntityApiOptions<T extends Artist | Album | Genre | Playlist> = {
  /**
   * If false, then the exact match of all options will be provided.
   * If true, then even if an entity matches one of the options, it will be returned.
   * In terms of SQL, true will add 'AND' between where queries and false will add 'OR'.
   *
   * Eg. If album.album_name is 'aaa' and album.album_id is 'bbb'
   *
   * In this scenario if inclusive is false, then all albums having album_name as 'aaa'
   * AND album_id as 'bbb' will be returned
   *
   * If inclusive is false then albums having album_name as 'aaa' OR album_id as 'bbb' will be returned
   */
  inclusive?: boolean;

  /**
   * If true, then inverts the query. It will return all records which don't match the search criteria
   * If false, then it will return all records which match the search criteria
   *
   * false by default
   */
  invert?: boolean;
} & (T extends Artist
  ? {
      artist: Partial<Artist> | boolean;
    }
  : T extends Album
    ? {
        album: Partial<Album> | boolean;
      }
    : T extends Genre
      ? {
          genre: Partial<Genre> | boolean;
        }
      : T extends Playlist
        ? {
            playlist: Partial<Playlist> | boolean;
          }
        : Record<string, never>);

export type AccountDetails = {
  id: string;
  packageName: string;
  name: string;
  bgColor: string;
  icon: string;
  loggedIn: boolean;
  username?: string;
};

export interface AccountLoginArgs {
  packageName: string;
  accountId: string;
  loginStatus: boolean;
}

export interface PreferenceArgs {
  key: string;
  value: any;
}

export type ProviderScope =
  | "search"
  | "playlists"
  | "playlistSongs"
  | "artistSongs"
  | "albumSongs"
  | "recommendations"
  | "scrobbles"
  | "playlistFromUrl"
  | "songFromUrl"
  | "searchAlbum"
  | "searchArtist"
  | "playbackDetails";

export interface SearchReturnType {
  songs: Song[];
  artists: Artist[];
  playlists: Playlist[];
  albums: Album[];
  genres: Genre[];
}

export interface RecommendationsReturnType {
  songs: Song[];
}

export interface PlaylistsReturnType {
  playlists: Playlist[];
}

export interface SongsWithPageTokenReturnType {
  songs: Song[];
  nextPageToken?: unknown;
}

export interface PlaybackDetailsReturnType {
  duration: number;
  url: string;
}

export interface CustomRequestReturnType {
  mimeType?: string;
  data?: unknown;
  redirectUrl?: string;
}

export interface SongReturnType {
  song?: Song;
}

export interface PlaylistAndSongsReturnType {
  playlist?: Playlist;
  songs?: Song[];
}

export interface PreferenceData<T = unknown> {
  key: string;
  value?: T;
  defaultValue?: T;
}

export interface AddToPlaylistRequest {
  playlistID: string;
  songs: Song[];
}

export interface ExtensionAPI {
  on(event: "getAccounts", cb: () => AccountDetails[]): void;
  on(event: "performAccountLogin", cb: (args: AccountLoginArgs) => void): void;
  on(event: "oauthCallback", cb: (code: string) => void): void;
  on(event: "onScrobble", cb: (song: Song) => void): void;
  on(event: "onPlaylistRemoved", cb: (playlist: Playlist) => void): void;
  on(event: "onPlaylistAdded", cb: (playlist: Playlist) => void): void;
  on(event: "onSongRemoved", cb: (song: Song) => void): void;
  on(event: "onSongAdded", cb: (song: Song) => void): void;
  on(event: "onPreferencesChanged", cb: (args: PreferenceArgs) => void): void;
  on(event: "onSeeked", cb: (time: number) => void): void;
  on(event: "onSongChanged", cb: (song: Song | undefined) => void): void;
  on(event: "onPlayerStateChanged", cb: (state: PlayerState) => void): void;
  on(event: "onQueueChanged", cb: (queue: unknown) => void): void;
  on(event: "onVolumeChanged", cb: (volume: number) => void): void;

  on(event: "getProviderScopes", cb: () => ProviderScope[]): void;
  on(event: "getPlaylists", cb: () => Promise<PlaylistsReturnType>): void;
  on(
    event: "getPlaylistContent",
    cb: (id: string, token?: string) => Promise<SongsWithPageTokenReturnType>,
  ): void;
  on(
    event: "getPlaylistFromUrl",
    cb: (url: string) => Promise<PlaylistAndSongsReturnType>,
  ): void;
  on(
    event: "getPlaybackDetails",
    cb: (song: Song) => Promise<PlaybackDetailsReturnType>,
  ): void;
  on(event: "getSearch", cb: (term: string) => Promise<SearchReturnType>): void;
  on(
    event: "getRecommendations",
    cb: () => Promise<RecommendationsReturnType>,
  ): void;
  on(
    event: "getSongFromUrl",
    cb: (url: string) => Promise<SongReturnType>,
  ): void;
  on(
    event: "handleCustomRequest",
    cb: (url: string) => Promise<CustomRequestReturnType>,
  ): void;
  on(
    event: "getArtistSongs",
    cb: (
      artist: Artist,
      token?: string,
    ) => Promise<SongsWithPageTokenReturnType>,
  ): void;
  on(
    event: "getAlbumSongs",
    cb: (album: Album, token?: string) => Promise<SongsWithPageTokenReturnType>,
  ): void;
  on(event: "getSongFromId", cb: (id: string) => Promise<SongReturnType>): void;

  getSong(options: SongAPIOptions): Song[];
  getCurrentSong(): Song | undefined;
  getPlayerState(): PlayerState;
  getVolume(): number;
  getTime(): number;
  getQueue(): Song[];
  getPreference<T>(data: PreferenceData<T>): T;
  getSecure<T>(data: PreferenceData<T>): T;

  setPreference<T>(data: PreferenceData<T>): void;
  setSecure<T>(data: PreferenceData<T>): void;
  addSongs(songs: Song[]): void;
  removeSong(song: Song): void;
  updateSong(song: Song): void;
  addPlaylist(playlist: Playlist): string;
  addToPlaylist(req: AddToPlaylistRequest): void;
  registerOAuth(token: string): void;
  openExternalUrl(url: string): void;
  updateAccounts(): void;
}

declare type module = Object;
