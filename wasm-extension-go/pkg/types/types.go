package types

import (
	"encoding/json"
)

type Value any
type EntityInfo any

type QueryablePlaylist struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}

type AccountLoginArgs struct {
	PackageName string `json:"packageName"`
	AccountID   string `json:"accountId"`
	LoginStatus bool   `json:"loginStatus"`
}

type ExtensionDetail struct {
	PackageName string `json:"packageName"`
}

type ExtensionAccountDetail struct {
	ID          string `json:"id"`
	PackageName string `json:"packageName"`
	Name        string `json:"name"`
	BgColor     string `json:"bgColor"`
	Icon        string `json:"icon"`
	LoggedIn    bool   `json:"loggedIn"`
	Username    string `json:"username,omitempty"`
}

type PreferenceArgs struct {
	Key   string `json:"key"`
	Value any    `json:"value"`
}

type PlaylistReturnType struct {
	Playlists []QueryablePlaylist `json:"playlists"`
}

type SongsReturnType struct {
	Songs []Song `json:"songs"`
}

type SongsWithPageTokenReturnType struct {
	Songs         []Song          `json:"songs"`
	NextPageToken json.RawMessage `json:"nextPageToken,omitempty"`
}

type SearchReturnType struct {
	Songs     []Song              `json:"songs"`
	Playlists []QueryablePlaylist `json:"playlists"`
	Artists   []QueryableArtist   `json:"artists"`
	Albums    []QueryableAlbum    `json:"albums"`
}

type PlaybackDetailsReturnType struct {
	Duration uint32 `json:"duration"`
	URL      string `json:"url"`
}

type CustomRequestReturnType struct {
	MimeType    string `json:"mimeType,omitempty"`
	Data        []byte `json:"data,omitempty"`
	RedirectURL string `json:"redirectUrl,omitempty"`
}

type SongReturnType struct {
	Song Song `json:"song,omitempty"`
}

type PlaylistAndSongsReturnType struct {
	Playlist QueryablePlaylist `json:"playlist,omitempty"`
	Songs    []Song            `json:"songs,omitempty"`
}

type RecommendationsReturnType struct {
	Songs []Song `json:"songs"`
}

type AddToPlaylistRequest struct {
	PlaylistID string `json:"playlistID"`
	Songs      []Song `json:"songs"`
}

type PreferenceData struct {
	Key          string `json:"key"`
	Value        any    `json:"value,omitempty"`
	DefaultValue any    `json:"defaultValue,omitempty"`
}

type SearchableSong struct {
	ID                string   `json:"_id,omitempty"`
	Path              string   `json:"path,omitempty"`
	Title             string   `json:"title,omitempty"`
	SampleRate        float64  `json:"sample_rate,omitempty"`
	Hash              string   `json:"hash,omitempty"`
	Type              SongType `json:"type_,omitempty"`
	URL               string   `json:"url,omitempty"`
	PlaybackURL       string   `json:"playback_url,omitempty"`
	ProviderExtension string   `json:"provider_extension,omitempty"`
	ShowInLibrary     bool     `json:"show_in_library,omitempty"`
}

type PackageNameArgs struct {
	PackageName string `json:"packageName"`
}

type ContextMenuReturnType struct {
	Name     string `json:"name"`
	Icon     string `json:"icon"`
	ActionID string `json:"actionId"`
}

type ExtensionProviderScope string

const (
	ScopeSearch              ExtensionProviderScope = "search"
	ScopePlaylists           ExtensionProviderScope = "playlists"
	ScopePlaylistSongs       ExtensionProviderScope = "playlistSongs"
	ScopeArtistSongs         ExtensionProviderScope = "artistSongs"
	ScopeAlbumSongs          ExtensionProviderScope = "albumSongs"
	ScopeRecommendations     ExtensionProviderScope = "recommendations"
	ScopeScrobbles           ExtensionProviderScope = "scrobbles"
	ScopePlaylistFromUrl     ExtensionProviderScope = "playlistFromUrl"
	ScopeSongFromUrl         ExtensionProviderScope = "songFromUrl"
	ScopeSearchAlbum         ExtensionProviderScope = "searchAlbum"
	ScopeSearchArtist        ExtensionProviderScope = "searchArtist"
	ScopePlaybackDetails     ExtensionProviderScope = "playbackDetails"
	ScopeLyrics              ExtensionProviderScope = "lyrics"
	ScopeSongContextMenu     ExtensionProviderScope = "songContextMenu"
	ScopePlaylistContextMenu ExtensionProviderScope = "playlistContextMenu"
	ScopeAccounts            ExtensionProviderScope = "accounts"
)

type Song struct {
	QueryableSong
	Album   QueryableAlbum    `json:"album,omitempty"`
	Artists []QueryableArtist `json:"artists,omitempty"`
	Genre   []QueryableGenre  `json:"genre,omitempty"`
}

type QueryableSong struct {
	ID                string   `json:"_id,omitempty"`
	Path              string   `json:"path,omitempty"`
	Size              float64  `json:"size,omitempty"`
	Inode             string   `json:"inode,omitempty"`
	DeviceNo          string   `json:"deviceno,omitempty"`
	Title             string   `json:"title,omitempty"`
	Date              string   `json:"date,omitempty"`
	Year              string   `json:"year,omitempty"`
	Lyrics            string   `json:"lyrics,omitempty"`
	ReleaseType       string   `json:"releaseType,omitempty"`
	Bitrate           float64  `json:"bitrate,omitempty"`
	Codec             string   `json:"codec,omitempty"`
	Container         string   `json:"container,omitempty"`
	Duration          float64  `json:"duration,omitempty"`
	SampleRate        float64  `json:"sampleRate,omitempty"`
	Hash              string   `json:"hash,omitempty"`
	Type              SongType `json:"type"`
	URL               string   `json:"url,omitempty"`
	SongCoverPathHigh string   `json:"song_coverPath_high,omitempty"`
	PlaybackURL       string   `json:"playbackUrl,omitempty"`
	SongCoverPathLow  string   `json:"song_coverPath_low,omitempty"`
	DateAdded         int64    `json:"date_added,omitempty"`
	ProviderExtension string   `json:"provider_extension,omitempty"`
	Icon              string   `json:"icon,omitempty"`
	ShowInLibrary     bool     `json:"show_in_library,omitempty"`
	TrackNo           float64  `json:"track_no,omitempty"`
	LibraryItem       bool     `json:"library_item,omitempty"`
}

type GetSongOptions struct {
	Song      SearchableSong    `json:"song,omitempty"`
	Artist    QueryableArtist   `json:"artist,omitempty"`
	Album     QueryableAlbum    `json:"album,omitempty"`
	Genre     QueryableGenre    `json:"genre,omitempty"`
	Playlist  QueryablePlaylist `json:"playlist,omitempty"`
	Inclusive bool              `json:"inclusive,omitempty"`
}

type QueryableAlbum struct {
	AlbumID            string  `json:"album_id,omitempty"`
	AlbumName          string  `json:"album_name,omitempty"`
	AlbumArtist        string  `json:"album_artist,omitempty"`
	AlbumCoverPathHigh string  `json:"albumCoverPath_high,omitempty"`
	AlbumSongCount     float64 `json:"album_song_count"`
	Year               string  `json:"year,omitempty"`
	AlbumCoverPathLow  string  `json:"albumCoverPath_low,omitempty"`
	AlbumExtraInfo     any     `json:"album_extra_info,omitempty"`
}

type AlbumBridge struct {
	ID    int    `json:"id,omitempty"`
	Song  string `json:"song,omitempty"`
	Album string `json:"album,omitempty"`
}

type QueryableArtist struct {
	ArtistID            string     `json:"artist_id,omitempty"`
	ArtistMBID          string     `json:"artist_mbid,omitempty"`
	ArtistName          string     `json:"artist_name,omitempty"`
	ArtistCoverPath     string     `json:"artist_coverPath,omitempty"`
	ArtistSongCount     float64    `json:"artist_song_count"`
	ArtistExtraInfo     EntityInfo `json:"artist_extra_info,omitempty"`
	SanitizedArtistName string     `json:"sanitized_artist_name,omitempty"`
}

type ArtistBridge struct {
	ID     int    `json:"id,omitempty"`
	Song   string `json:"song,omitempty"`
	Artist string `json:"artist,omitempty"`
}

type QueryableGenre struct {
	GenreID        string  `json:"genre_id,omitempty"`
	GenreName      string  `json:"genre_name,omitempty"`
	GenreSongCount float64 `json:"genre_song_count"`
}

type SearchResult struct {
	Songs     []Song              `json:"songs"`
	Artists   []QueryableArtist   `json:"artists"`
	Playlists []QueryablePlaylist `json:"playlists"`
	Albums    []QueryableAlbum    `json:"albums"`
	Genres    []QueryableGenre    `json:"genres"`
}

type SongType string

const (
	SongTypeLocal   SongType = "LOCAL"
	SongTypeURL     SongType = "URL"
	SongTypeYoutube SongType = "YOUTUBE"
	SongTypeSpotify SongType = "SPOTIFY"
	SongTypeDASH    SongType = "DASH"
	SongTypeHLS     SongType = "HLS"
)
