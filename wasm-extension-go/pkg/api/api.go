package api

import (
	"github.com/Moosync/extensions-sdk/wasm-extension-go/pkg/types"
	"github.com/extism/go-pdk"
)

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

var extension Extension

func get_params(input any) int32 {
	if err := pdk.InputJSON(input); err != nil {
		pdk.SetError(err)
		return 1
	}
	return 0
}

func runWrapper(input any, callback func() (any, error)) int32 {
	if input != nil {
		if get_params(input) != 0 {
			return 1
		}
	}
	result, err := callback()
	if err != nil {
		pdk.SetError(err)
		return 1
	}
	if result != nil {
		pdk.OutputJSON(result)
	}
	return 0
}

//go:wasmexport get_provider_scopes_wrapper
func get_provider_scopes_wrapper() int32 {
	return runWrapper(nil, func() (any, error) {
		return extension.GetProviderScopes()
	})
}

//go:wasmexport get_playlists_wrapper
func get_playlists_wrapper() int32 {
	return runWrapper(nil, func() (any, error) {
		playlists, err := extension.GetPlaylists()
		if err != nil {
			return nil, err
		}
		return types.PlaylistReturnType{Playlists: playlists}, nil
	})
}

//go:wasmexport get_playlist_content_wrapper
func get_playlist_content_wrapper() int32 {
	var id string
	var token string
	in := [...]any{&id, &token}
	return runWrapper(&in, func() (any, error) {
		songs, err := extension.GetPlaylistContent(id, token)
		if err != nil {
			return nil, err
		}
		return types.SongsWithPageTokenReturnType{
			Songs:         songs,
			NextPageToken: nil,
		}, nil
	})
}

//go:wasmexport get_playlist_from_url_wrapper
func get_playlist_from_url_wrapper() int32 {
	var url string
	in := [...]any{&url}
	return runWrapper(&in, func() (any, error) {
		playlist, err := extension.GetPlaylistFromURL(url)
		if err != nil {
			return nil, err
		}
		return types.PlaylistAndSongsReturnType{
			Playlist: playlist,
			Songs:    nil,
		}, nil
	})
}

//go:wasmexport get_playback_details_wrapper
func get_playback_details_wrapper() int32 {
	var song types.Song
	in := [...]any{&song}
	return runWrapper(&in, func() (any, error) {
		return extension.GetPlaybackDetails(song)
	})
}

//go:wasmexport search_wrapper
func search_wrapper() int32 {
	var term string
	in := [...]any{&term}
	return runWrapper(&in, func() (any, error) {
		result, err := extension.Search(term)
		if err != nil {
			return nil, err
		}
		return types.SearchReturnType{
			Songs:     result.Songs,
			Playlists: result.Playlists,
			Artists:   result.Artists,
			Albums:    result.Albums,
		}, nil
	})
}

//go:wasmexport get_recommendations_wrapper
func get_recommendations_wrapper() int32 {
	return runWrapper(nil, func() (any, error) {
		songs, err := extension.GetRecommendations()
		if err != nil {
			return nil, err
		}
		return types.RecommendationsReturnType{Songs: songs}, nil
	})
}

//go:wasmexport get_song_from_url_wrapper
func get_song_from_url_wrapper() int32 {
	var url string
	in := [...]any{&url}
	return runWrapper(&in, func() (any, error) {
		song, err := extension.GetSongFromURL(url)
		if err != nil {
			return nil, err
		}
		return types.SongReturnType{Song: song}, nil
	})
}

//go:wasmexport handle_custom_request_wrapper
func handle_custom_request_wrapper() int32 {
	var url string
	in := [...]any{&url}
	return runWrapper(&in, func() (any, error) {
		res, err := extension.HandleCustomRequest(url)
		if err != nil {
			return nil, err
		}
		return res, nil
	})
}

//go:wasmexport get_artist_songs_wrapper
func get_artist_songs_wrapper() int32 {
	var artist types.QueryableArtist
	var token string
	in := [...]any{&artist, &token}
	return runWrapper(&in, func() (any, error) {
		songs, err := extension.GetArtistSongs(artist, token)
		if err != nil {
			return nil, err
		}
		return types.SongsWithPageTokenReturnType{
			Songs:         songs,
			NextPageToken: nil,
		}, nil
	})
}

//go:wasmexport get_album_songs_wrapper
func get_album_songs_wrapper() int32 {
	var album types.QueryableAlbum
	var token string
	in := [...]any{&album, &token}
	return runWrapper(&in, func() (any, error) {
		songs, err := extension.GetAlbumSongs(album, token)
		if err != nil {
			return nil, err
		}
		return types.SongsWithPageTokenReturnType{
			Songs:         songs,
			NextPageToken: nil,
		}, nil
	})
}

//go:wasmexport get_song_from_id_wrapper
func get_song_from_id_wrapper() int32 {
	var id string
	in := [...]any{&id}
	return runWrapper(&in, func() (any, error) {
		song, err := extension.GetSongFromID(id)
		if err != nil {
			return nil, err
		}
		return types.SongReturnType{Song: song}, nil
	})
}

//go:wasmexport on_queue_changed_wrapper
func on_queue_changed_wrapper() int32 {
	var queue types.Value
	in := [...]any{&queue}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OnQueueChanged(queue)
	})
}

//go:wasmexport on_volume_changed_wrapper
func on_volume_changed_wrapper() int32 {
	return runWrapper(nil, func() (any, error) {
		return nil, extension.OnVolumeChanged()
	})
}

//go:wasmexport on_player_state_changed_wrapper
func on_player_state_changed_wrapper() int32 {
	return runWrapper(nil, func() (any, error) {
		return nil, extension.OnPlayerStateChanged()
	})
}

//go:wasmexport on_song_changed_wrapper
func on_song_changed_wrapper() int32 {
	return runWrapper(nil, func() (any, error) {
		return nil, extension.OnSongChanged()
	})
}

//go:wasmexport on_seeked_wrapper
func on_seeked_wrapper() int32 {
	var t float64
	in := [...]any{&t}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OnSeeked(t)
	})
}

//go:wasmexport on_preferences_changed_wrapper
func on_preferences_changed_wrapper() int32 {
	var args types.PreferenceArgs
	in := [...]any{&args}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OnPreferencesChanged(args)
	})
}

//go:wasmexport on_song_added_wrapper
func on_song_added_wrapper() int32 {
	var song types.Song
	in := [...]any{&song}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OnSongAdded(song)
	})
}

//go:wasmexport on_song_removed_wrapper
func on_song_removed_wrapper() int32 {
	var song types.Song
	in := [...]any{&song}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OnSongRemoved(song)
	})
}

//go:wasmexport on_playlist_added_wrapper
func on_playlist_added_wrapper() int32 {
	var playlist types.QueryablePlaylist
	in := [...]any{&playlist}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OnPlaylistAdded(playlist)
	})
}

//go:wasmexport on_playlist_removed_wrapper
func on_playlist_removed_wrapper() int32 {
	var playlist types.QueryablePlaylist
	in := [...]any{&playlist}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OnPlaylistRemoved(playlist)
	})
}

//go:wasmexport get_accounts_wrapper
func get_accounts_wrapper() int32 {
	return runWrapper(nil, func() (any, error) {
		accounts, err := extension.GetAccounts()
		if err != nil {
			return nil, err
		}
		return accounts, nil
	})
}

//go:wasmexport perform_account_login_wrapper
func perform_account_login_wrapper() int32 {
	var args types.AccountLoginArgs
	in := [...]any{&args}
	return runWrapper(&in, func() (any, error) {
		res, err := extension.PerformAccountLogin(args)
		if err != nil {
			return nil, err
		}
		return res, nil
	})
}

//go:wasmexport scrobble_wrapper
func scrobble_wrapper() int32 {
	var song types.Song
	in := [...]any{&song}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.Scrobble(song)
	})
}

//go:wasmexport oauth_callback_wrapper
func oauth_callback_wrapper() int32 {
	var code string
	in := [...]any{&code}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OauthCallback(code)
	})
}

//go:wasmexport get_song_context_menu_wrapper
func get_song_context_menu_wrapper() int32 {
	var songs []types.Song
	in := [...]any{&songs}
	return runWrapper(&in, func() (any, error) {
		menu, err := extension.GetSongContextMenu(songs)
		if err != nil {
			return nil, err
		}
		return menu, nil
	})
}

//go:wasmexport get_playlist_context_menu_wrapper
func get_playlist_context_menu_wrapper() int32 {
	var playlist types.QueryablePlaylist
	in := [...]any{&playlist}
	return runWrapper(&in, func() (any, error) {
		menu, err := extension.GetPlaylistContextMenu(playlist)
		if err != nil {
			return nil, err
		}
		return menu, nil
	})
}

//go:wasmexport on_context_menu_action_wrapper
func on_context_menu_action_wrapper() int32 {
	var action string
	in := [...]any{&action}
	return runWrapper(&in, func() (any, error) {
		return nil, extension.OnContextMenuAction(action)
	})
}

//go:wasmexport get_lyrics_wrapper
func get_lyrics_wrapper() int32 {
	var song types.Song
	in := [...]any{&song}
	return runWrapper(&in, func() (any, error) {
		lyrics, err := extension.GetLyrics(song)
		if err != nil {
			return nil, err
		}
		return lyrics, nil
	})
}

func RegisterExtension(newExtension Extension) {
	if extension != nil {
		pdk.Log(pdk.LogError, "Extension cannot be re-registered")
		panic("Extension cannot be re-registered")
	}
	extension = newExtension
}

//go:wasmimport extism:host/user send_main_command
func send_main_command(uint64) uint64

//go:wasmimport extism:host/user system_time
func system_time() uint64

//go:wasmimport extism:host/user open_clientfd
func open_clientfd(uint64) int64

//go:wasmimport extism:host/user write_sock
func write_sock(int64, uint64) int64

//go:wasmimport extism:host/user read_sock
func read_sock(int64, uint64) uint64

//go:wasmimport extism:host/user hash
func hash(uint64, uint64) uint64
