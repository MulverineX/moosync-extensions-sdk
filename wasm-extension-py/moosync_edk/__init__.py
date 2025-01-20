import extism
from typing import cast, Optional, TypeVar, List, Callable
from moosync_edk.custom_types import *
import json
import sys

class CustomPrint():
    def __init__(self):
        self.old_stdout=sys.stdout

    def write(self, text):
        extism.log(extism.LogLevel.Debug, text)

def http_request(url: str, method: str = "GET", body: Optional[Union[bytes, str]] = None, headers: Optional[dict] = None) -> Any:
    return extism.Http.request(url, method, body, headers)

sys.stdout = CustomPrint()

extension_instance = None
def register_extension(extension: "Extension"):
    global extension_instance
    extension_instance = extension


@extism.import_fn("extism:host/user", "open_clientfd")
def open_sock(path: str) -> int: ...

@extism.import_fn("extism:host/user", "write_sock")
def write_sock(sock_id:int, buf: str) -> int: ...

@extism.import_fn("extism:host/user", "read_sock")
def read_sock(sock_id: int, buf: str) -> str: ...


@extism.import_fn("extism:host/user", "send_main_command")
def send_main_command(data: str) -> str: ...

def parse_main_command(data: str, parse_as):
    res = send_main_command(data)
    return parse_as(json.loads(res))

def parse_main_command_list(data: str, parse_as):
    res = send_main_command(data)
    arr = json.loads(res)
    return [parse_as.from_dict(data) for data in arr]

def parse_main_command_optional(data: str, parse_as):
    res = send_main_command(data)
    arr = json.loads(res)
    if arr is not None:
        return parse_as.from_dict(arr)
    return None


class Api:
    def get_song(self, options: SongAPIOptions) -> List[Song]:
        data = {
            "GetSong": [options]
        }
        return parse_main_command_list(json.dumps(data), Song)


    def get_current_song(self) -> Optional[Song]:
        data = {
            "GetCurrentSong": []
        }
        return parse_main_command_optional(json.dumps(data), Song)


    def get_player_state(self) -> PlayerState:
        data = {
            "GetPlayerState": []
        }
        return cast(PlayerState, send_main_command(json.dumps(data)))


    def get_volume(self) -> float:
        data = {
            "GetVolume": []
        }
        return float(send_main_command(json.dumps(data)))


    def get_time(self) -> float:
        data = {
            "GetTime": []
        }
        return float(send_main_command(json.dumps(data)))


    def get_queue(self) -> List[Song]:
        data = {
            "GetQueue": []
        }
        return parse_main_command_list(json.dumps(data), Song)


    def get_preference(self, data: PreferenceData) -> Any:
        request = {
            "GetPreference": [data]
        }
        return json.loads(send_main_command(json.dumps(request)))


    def get_secure(self, data: PreferenceData) -> Any:
        request = {
            "GetSecure": [data]
        }
        return json.loads(send_main_command(json.dumps(request)))


    def set_preference(self, data: PreferenceData) -> None:
        request = {
            "SetPreference": [data]
        }
        send_main_command(json.dumps(request))


    def set_secure(self, data: PreferenceData) -> None:
        request = {
            "SetSecure": [data]
        }
        send_main_command(json.dumps(request))


    def add_songs(self, songs: List[Song]) -> None:
        data = {
            "AddSongs": [songs]
        }
        send_main_command(json.dumps(data))


    def remove_song(self, song: Song) -> None:
        data = {
            "RemoveSong": [song]
        }
        send_main_command(json.dumps(data))


    def update_song(self, song: Song) -> None:
        data = {
            "UpdateSong": [song]
        }
        send_main_command(json.dumps(data))


    def add_playlist(self, playlist: Playlist) -> str:
        data = {
            "AddPlaylist": [playlist]
        }
        return send_main_command(json.dumps(data))


    def add_to_playlist(self, req: AddToPlaylistRequest) -> None:
        data = {
            "AddToPlaylist": [req]
        }
        send_main_command(json.dumps(data))


    def register_oauth(self, token: str) -> None:
        data = {
            "RegisterOAuth": [token]
        }
        send_main_command(json.dumps(data))


    def open_external_url(self, url: str) -> None:
        data = {
            "OpenExternalUrl": [url]
        }
        send_main_command(json.dumps(data))


    def update_accounts(self) -> None:
        data = {
            "UpdateAccounts": []
        }
        send_main_command(json.dumps(data))


class Extension:
    api = Api()

    def get_provider_scopes(self) -> List[ProviderScopes]:
        return []

    def get_playlists(self) -> List[Playlist]:
        raise NotImplementedError("get_playlists method is not implemented")

    def get_playlist_content(self, id: str, token: Optional[str] = None) -> SongsWithPageTokenReturnType:
        raise NotImplementedError("get_playlist_content method is not implemented")

    def get_playlist_from_url(self, url: str) -> PlaylistAndSongsReturnType:
        raise NotImplementedError("get_playlist_from_url method is not implemented")

    def get_playback_details(self, song: Song) -> PlaybackDetailsReturnType:
        raise NotImplementedError("get_playback_details method is not implemented")

    def get_search(self, term: str) -> SearchReturnType:
        raise NotImplementedError("get_search method is not implemented")

    def get_recommendations(self) -> RecommendationsReturnType:
        raise NotImplementedError("get_recommendations method is not implemented")

    def get_song_from_url(self, url: str) -> SongReturnType:
        raise NotImplementedError("get_song_from_url method is not implemented")

    def handle_custom_request(self, url: str) -> CustomRequestReturnType:
        raise NotImplementedError("handle_custom_request method is not implemented")

    def get_artist_songs(self, artist: Artist, token: Optional[str] = None) -> SongsWithPageTokenReturnType:
        raise NotImplementedError("get_artist_songs method is not implemented")

    def get_album_songs(self, album: Album, token: Optional[str] = None) -> SongsWithPageTokenReturnType:
        raise NotImplementedError("get_album_songs method is not implemented")

    def get_song_from_id(self, id: str) -> SongReturnType:
        raise NotImplementedError("get_song_from_id method is not implemented")

    def on_queue_changed(self, queue: Any):
        raise NotImplementedError("on_queue_changed method is not implemented")

    def on_volume_changed(self, volume: float):
        raise NotImplementedError("on_volume_changed method is not implemented")

    def on_player_state_changed(self, state: PlayerState):
        raise NotImplementedError("on_player_state_changed method is not implemented")

    def on_song_changed(self, song: Optional[Song]):
        raise NotImplementedError("on_song_changed method is not implemented")

    def on_seeked(self, time: float):
        raise NotImplementedError("on_seeked method is not implemented")

    def on_preferences_changed(self, args: PreferenceArgs):
        raise NotImplementedError("on_preferences_changed method is not implemented")

    def on_song_added(self, song: Song):
        raise NotImplementedError("on_song_added method is not implemented")

    def on_song_removed(self, song: Song):
        raise NotImplementedError("on_song_removed method is not implemented")

    def on_playlist_added(self, playlist: Playlist):
        raise NotImplementedError("on_playlist_added method is not implemented")

    def on_playlist_removed(self, playlist: Playlist):
        raise NotImplementedError("on_playlist_removed method is not implemented")

    def get_accounts(self) -> List[AccountDetails]:
        return []

    def perform_account_login(self, args: AccountLoginArgs):
        raise NotImplementedError("perform_account_login method is not implemented")

    def scrobble(self, song: Song):
        raise NotImplementedError("scrobble method is not implemented")

    def oauth_callback(self, code: str):
        raise NotImplementedError("oauth_callback method is not implemented")

    def get_song_context_menu(self, songs: List[Song]) -> List[ContextMenuReturnType]:
        raise NotImplementedError("get_song_context_menu method is not implemented")

    def get_playlist_context_menu(self, playlist: Playlist) -> List[ContextMenuReturnType]:
        raise NotImplementedError("get_playlist_context_menu method is not implemented")

    def on_context_menu_action(self, action: str):
        raise NotImplementedError("on_context_menu_action method is not implemented")

    def get_lyrics(self, song: Song) -> str:
        raise NotImplementedError("get_lyrics method is not implemented")


def ensure_extension_instance() -> "Extension":
    if extension_instance is None:
        # entry()
        raise Exception("Extension instance is not initialized")
    return extension_instance


def build_object(cls, data: dict):
    """
    Build an object of the given class `cls` using the dictionary `data`.
    Only passes keys to the constructor that match the class's attributes.
    """
    return cls(**{k: v for k, v in data.items() if hasattr(cls, k)})


@extism.plugin_fn
def get_provider_scopes_wrapper():
    instance = ensure_extension_instance()
    extism.output_str(json.dumps(instance.get_provider_scopes()))

@extism.plugin_fn
def get_playlists_wrapper():
    instance = ensure_extension_instance()
    extism.output_str(json.dumps(instance.get_playlists()))

@extism.plugin_fn
def get_playlist_content_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    playlist_id = str(data[0])
    token = str(data[1]) if len(data) > 1 and data[1] is not None else None
    extism.output_str(json.dumps(instance.get_playlist_content(playlist_id, token)))

@extism.plugin_fn
def get_playlist_from_url_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    url = str(data[0])
    extism.output_str(json.dumps(instance.get_playlist_from_url(url)))

@extism.plugin_fn
def get_playback_details_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data[0])
    extism.output_str(json.dumps(instance.get_playback_details(song)))

@extism.plugin_fn
def get_search_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    term = str(data[0])
    extism.output_str(json.dumps(instance.get_search(term)))

@extism.plugin_fn
def get_recommendations_wrapper():
    instance = ensure_extension_instance()
    extism.output_str(json.dumps(instance.get_recommendations()))

@extism.plugin_fn
def get_song_from_url_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    url = str(data[0])
    extism.output_str(json.dumps(instance.get_song_from_url(url)))

@extism.plugin_fn
def handle_custom_request_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    url = str(data[0])
    extism.output_str(json.dumps(instance.handle_custom_request(url)))

@extism.plugin_fn
def get_artist_songs_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    artist = build_object(Artist, data[0])
    token = str(data[1]) if len(data) > 1 and data[1] is not None else None
    extism.output_str(json.dumps(instance.get_artist_songs(artist, token)))

@extism.plugin_fn
def get_album_songs_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    album = build_object(Album, data[0])
    token = str(data[1]) if len(data) > 1 and data[1] is not None else None
    extism.output_str(json.dumps(instance.get_album_songs(album, token)))

@extism.plugin_fn
def get_song_from_id_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song_id = str(data[0])
    extism.output_str(json.dumps(instance.get_song_from_id(song_id)))

@extism.plugin_fn
def on_queue_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    queue = data[0]
    extism.output_str(json.dumps(instance.on_queue_changed(queue)))

@extism.plugin_fn
def on_volume_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    volume = float(data[0])
    extism.output_str(json.dumps(instance.on_volume_changed(volume)))

@extism.plugin_fn
def on_player_state_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    print('got data', data)
    state = cast(PlayerState, data[0])
    extism.output_str(json.dumps(instance.on_player_state_changed(state)))

@extism.plugin_fn
def on_song_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data[0]) if data[0] is not None else None
    extism.output_str(json.dumps(instance.on_song_changed(song)))

@extism.plugin_fn
def on_seeked_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    time = float(data[0])
    extism.output_str(json.dumps(instance.on_seeked(time)))

@extism.plugin_fn
def on_preferences_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    args = build_object(PreferenceArgs, data[0])
    extism.output_str(json.dumps(instance.on_preferences_changed(args)))

@extism.plugin_fn
def on_song_added_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data[0])
    extism.output_str(json.dumps(instance.on_song_added(song)))

@extism.plugin_fn
def on_song_removed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data[0])
    extism.output_str(json.dumps(instance.on_song_removed(song)))

@extism.plugin_fn
def on_playlist_added_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    playlist = build_object(Playlist, data[0])
    extism.output_str(json.dumps(instance.on_playlist_added(playlist)))

@extism.plugin_fn
def on_playlist_removed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    playlist = build_object(Playlist, data[0])
    extism.output_str(json.dumps(instance.on_playlist_removed(playlist)))

@extism.plugin_fn
def get_accounts_wrapper():
    instance = ensure_extension_instance()
    extism.output_str(json.dumps(instance.get_accounts()))

@extism.plugin_fn
def perform_account_login_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    args = build_object(AccountLoginArgs, data[0])
    extism.output_str(json.dumps(instance.perform_account_login(args)))

@extism.plugin_fn
def scrobble_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data[0])
    extism.output_str(json.dumps(instance.scrobble(song)))

@extism.plugin_fn
def get_song_context_menu_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = [Song.from_dict(item) for item in data]
    extism.output_str(json.dumps(instance.get_song_context_menu(song)))

@extism.plugin_fn
def get_playlist_context_menu_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    playlist = build_object(Playlist, data[0])
    extism.output_str(json.dumps(instance.get_playlist_context_menu(playlist)))

@extism.plugin_fn
def on_context_menu_action_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    code = str(data[0])
    extism.output_str(json.dumps(instance.on_context_menu_action(code)))

@extism.plugin_fn
def get_lyrics_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data[0])
    extism.output_str(json.dumps(instance.get_lyrics(song)))

from extension import init
@extism.plugin_fn
def entry():
    init()
