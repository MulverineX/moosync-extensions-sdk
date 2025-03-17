package api

import "moosync-edk/pkg/types"

type Extension interface {
	GetAccounts() ([]types.ExtensionAccountDetail, error)
	PerformAccountLogin(args types.AccountLoginArgs) (string, error)
	OauthCallback(code string) error
	OnSongAdded(song types.Song) error
	OnSongRemoved(song types.Song) error
	OnPlaylistAdded(playlist types.QueryablePlaylist) error
	OnPlaylistRemoved(playlist types.QueryablePlaylist) error
	OnPreferencesChanged(args types.PreferenceArgs) error
	OnQueueChanged(queue types.Value) error
	OnVolumeChanged() error
	OnPlayerStateChanged() error
	OnSongChanged() error
	OnSeeked(time float64) error
	GetProviderScopes() ([]types.ExtensionProviderScope, error)
	GetPlaylists() ([]types.QueryablePlaylist, error)
	GetPlaylistContent(id string, nextPageToken string) ([]types.Song, error)
	GetPlaylistFromURL(url string) (types.QueryablePlaylist, error)
	GetPlaybackDetails(song types.Song) (types.PlaybackDetailsReturnType, error)
	Search(term string) (types.SearchResult, error)
	GetRecommendations() ([]types.Song, error)
	GetSongFromURL(url string) (types.Song, error)
	HandleCustomRequest(url string) (types.CustomRequestReturnType, error)
	GetArtistSongs(artist types.QueryableArtist, nextPageToken string) ([]types.Song, error)
	GetAlbumSongs(album types.QueryableAlbum, nextPageToken string) ([]types.Song, error)
	GetSongFromID(id string) (types.Song, error)
	Scrobble(song types.Song) error
	GetLyrics(song types.Song) (string, error)
	GetSongContextMenu(songs []types.Song) ([]types.ContextMenuReturnType, error)
	GetPlaylistContextMenu(playlist types.QueryablePlaylist) ([]types.ContextMenuReturnType, error)
	OnContextMenuAction(action string) error
}
