package api

import (
	"encoding/json"

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

func RegisterExtension(newExtension Extension) {
	if extension != nil {
		pdk.Log(pdk.LogError, "Extension cannot be re-registered")
		panic("Extension cannot be re-registered")
	}
	extension = newExtension
}

func sendMainCommand[T any](command string, args ...any) (t T, err error) {
	data := make(map[string]any)

	if len(args) == 1 {
		data[command] = args[0]
	} else if len(args) == 0 {
		data[command] = [...]any{}
	} else {
		data[command] = args
	}

	jsonString, err := json.Marshal(data)
	pdk.Log(pdk.LogInfo, string(jsonString))

	if err != nil {
		return
	}

	pdk.Log(pdk.LogInfo, "Got json "+string(jsonString))

	mem := pdk.AllocateBytes(jsonString)
	defer mem.Free()

	rPtr := send_main_command(mem.Offset())
	rMem := pdk.FindMemory(rPtr)
	resp := rMem.ReadBytes()

	err = json.Unmarshal(resp, &t)
	if err != nil {
		return
	}

	return
}

func sendMainCommandOptional(command string, args ...any) (err error) {
	data := make(map[string]any)
	if len(args) == 1 {
		data[command] = args[0]
	} else if len(args) == 0 {
		data[command] = [...]any{}
	} else {
		data[command] = args
	}

	jsonString, err := json.Marshal(data)
	if err != nil {
		return
	}
	mem := pdk.AllocateBytes(jsonString)
	defer mem.Free()

	send_main_command(mem.Offset())
	return
}

// GetSong returns a list of songs based on options.
func GetSong(options types.GetSongOptions) ([]types.Song, error) {
	resp, err := sendMainCommand[[]types.Song]("GetSong", options)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// GetCurrentSong returns the current playing song.
func GetCurrentSong() (*types.Song, error) {
	resp, err := sendMainCommand[*types.Song]("GetCurrentSong")
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// GetPlayerState returns the current player state.
func GetPlayerState() (types.PlayerState, error) {
	resp, err := sendMainCommand[types.PlayerState]("GetPlayerState")
	if err != nil {
		return types.PlayerStateStopped, err
	}
	return resp, nil
}

// GetVolume returns the current volume level.
func GetVolume() (float64, error) {
	resp, err := sendMainCommand[float64]("GetVolume")
	if err != nil {
		return 0, err
	}
	return resp, nil
}

// GetTime returns the current playback time.
func GetTime() (float64, error) {
	resp, err := sendMainCommand[float64]("GetTime")
	if err != nil {
		return 0, err
	}
	return resp, nil
}

// GetQueue returns the current queue of songs.
func GetQueue() (any, error) {
	resp, err := sendMainCommand[any]("GetQueue")
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// GetPreference retrieves a preference based on the provided data.
func GetPreference(data types.PreferenceData) (any, error) {
	// We assume sendMainCommand returns a JSON string.
	resp, err := sendMainCommand[string]("GetPreference", data)
	if err != nil {
		return nil, err
	}
	var result any
	if err := json.Unmarshal([]byte(resp), &result); err != nil {
		return nil, err
	}
	return result, nil
}

// GetSecure retrieves encrypted preference data.
func GetSecure(data types.PreferenceData) (any, error) {
	resp, err := sendMainCommand[string]("GetSecure", data)
	if err != nil {
		return nil, err
	}
	var result any
	if err := json.Unmarshal([]byte(resp), &result); err != nil {
		return nil, err
	}
	return result, nil
}

// SetPreference sets a preference using the provided data.
func SetPreference(data types.PreferenceData) error {
	err := sendMainCommandOptional("SetPreference", data)
	return err
}

// SetSecure sets encrypted preference data.
func SetSecure(data types.PreferenceData) error {
	err := sendMainCommandOptional("SetSecure", data)
	return err
}

// AddSongs adds a list of songs to the library.
func AddSongs(songs []types.Song) error {
	err := sendMainCommandOptional("AddSongs", songs)
	return err
}

// RemoveSong removes a song from the library.
func RemoveSong(song types.Song) error {
	err := sendMainCommandOptional("RemoveSong", song)
	return err
}

// UpdateSong updates a song in the library.
func UpdateSong(song types.Song) error {
	err := sendMainCommandOptional("UpdateSong", song)
	return err
}

// AddPlaylist adds a playlist to the library and returns its ID.
func AddPlaylist(playlist types.QueryablePlaylist) (string, error) {
	resp, err := sendMainCommand[string]("AddPlaylist", playlist)
	if err != nil {
		return "", err
	}
	return resp, nil
}

// AddToPlaylist adds songs to a playlist.
func AddToPlaylist(req types.AddToPlaylistRequest) error {
	err := sendMainCommandOptional("AddToPlaylist", req)
	return err
}

// RegisterOAuth registers an OAuth callback using the given token.
func RegisterOAuth(token string) error {
	err := sendMainCommandOptional("RegisterOAuth", token)
	return err
}

// OpenExternalUrl opens a URL in the default browser.
func OpenExternalUrl(url string) error {
	err := sendMainCommandOptional("OpenExternalUrl", url)
	return err
}

// UpdateAccounts updates the accounts status.
func UpdateAccounts(packageName string) error {
	err := sendMainCommandOptional("UpdateAccounts", packageName)
	return err
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
