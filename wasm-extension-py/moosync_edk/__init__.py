import extism
from typing import cast, Optional, List, Union, Any
from moosync_edk.custom_types import *
import json
import sys
import dataclasses

class EnhancedJSONEncoder(json.JSONEncoder):
        def default(self, o):
            if dataclasses.is_dataclass(o):
                return dataclasses.asdict(o)
            return super().default(o)

class CustomPrint():
    buf = ""

    def write(self, text):
        sys.__stdout__.write(text)
        self.buf += text

    def flush(self):
        # self.old_stdout.write(self.buf)
        sys.__stdout__.flush()
        # extism.log(extism.LogLevel.Debug, self.buf)
        # self.buf = ""

def http_request(url: str, method: str = "GET", body: Optional[Union[bytes, str]] = None, headers: Optional[dict] = None) -> Any:
    return extism.Http.request(url, method, body, headers)

# sys.stdout = CustomPrint()

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


# API class to send requests to Moosync
class Api:
    def get_song(self, options: SongAPIOptions) -> List[Song]:
        """
        Get songs by options.

        Args:
            options (SongAPIOptions): The options to filter songs.

        Returns:
            List[Song]: A list of songs matching the options.
        """
        data = {
            "GetSong": [options]
        }
        return parse_main_command_list(json.dumps(data, cls=EnhancedJSONEncoder), Song)

    def get_current_song(self) -> Optional[Song]:
        """
        Get the current playing song.

        Returns:
            Optional[Song]: The current playing song, or None if no song is playing.
        """
        data = {
            "GetCurrentSong": []
        }
        return parse_main_command_optional(json.dumps(data, cls=EnhancedJSONEncoder), Song)

    def get_player_state(self) -> PlayerState:
        """
        Get the current player state.

        Returns:
            PlayerState: The current state of the player.
        """
        data = {
            "GetPlayerState": []
        }
        return cast(PlayerState, send_main_command(json.dumps(data, cls=EnhancedJSONEncoder)))

    def get_volume(self) -> float:
        """
        Get the current volume.

        Returns:
            float: The current volume level.
        """
        data = {
            "GetVolume": []
        }
        return float(send_main_command(json.dumps(data, cls=EnhancedJSONEncoder)))

    def get_time(self) -> float:
        """
        Get the current duration of the playing song.

        Returns:
            float: The current playback time of the song.
        """
        data = {
            "GetTime": []
        }
        return float(send_main_command(json.dumps(data, cls=EnhancedJSONEncoder)))

    def get_queue(self) -> List[Song]:
        """
        Get the queue of songs.

        Returns:
            List[Song]: The current queue of songs.
        """
        data = {
            "GetQueue": []
        }
        return parse_main_command_list(json.dumps(data, cls=EnhancedJSONEncoder), Song)

    def get_preference(self, data: PreferenceData) -> Any:
        """
        Get preference for this extension.

        Args:
            data (PreferenceData): The preference data to retrieve.

        Returns:
            Any: The retrieved preference data.
        """
        request = {
            "GetPreference": [data]
        }
        return json.loads(send_main_command(json.dumps(request, cls=EnhancedJSONEncoder)))

    def get_secure(self, data: PreferenceData) -> Any:
        """
        Get encrypted preference for this extension.

        Args:
            data (PreferenceData): The encrypted preference data to retrieve.

        Returns:
            Any: The retrieved encrypted preference data.
        """
        request = {
            "GetSecure": [data]
        }
        return json.loads(send_main_command(json.dumps(request, cls=EnhancedJSONEncoder)))

    def set_preference(self, data: PreferenceData) -> None:
        """
        Set preference for this extension.

        Args:
            data (PreferenceData): The preference data to set.
        """
        request = {
            "SetPreference": [data]
        }
        send_main_command(json.dumps(request, cls=EnhancedJSONEncoder))

    def set_secure(self, data: PreferenceData) -> None:
        """
        Set encrypted preference for this extension.

        Args:
            data (PreferenceData): The encrypted preference data to set.
        """
        request = {
            "SetSecure": [data]
        }
        send_main_command(json.dumps(request, cls=EnhancedJSONEncoder))

    def add_songs(self, songs: List[Song]) -> None:
        """
        Add songs to the library.

        Args:
            songs (List[Song]): The list of songs to add.
        """
        data = {
            "AddSongs": [songs]
        }
        send_main_command(json.dumps(data, cls=EnhancedJSONEncoder))

    def remove_song(self, song: Song) -> None:
        """
        Remove a song from the library.

        Args:
            song (Song): The song to remove.
        """
        data = {
            "RemoveSong": [song]
        }
        send_main_command(json.dumps(data, cls=EnhancedJSONEncoder))

    def update_song(self, song: Song) -> None:
        """
        Update a song in the library. The song with matching _id field is updated.

        Args:
            song (Song): The song to update.
        """
        data = {
            "UpdateSong": [song]
        }
        send_main_command(json.dumps(data, cls=EnhancedJSONEncoder))

    def add_playlist(self, playlist: Playlist) -> str:
        """
        Add a playlist to the library.

        Args:
            playlist (Playlist): The playlist to add.

        Returns:
            str: The ID of the added playlist.
        """
        data = {
            "AddPlaylist": [playlist]
        }
        return send_main_command(json.dumps(data, cls=EnhancedJSONEncoder))

    def add_to_playlist(self, req: AddToPlaylistRequest) -> None:
        """
        Add songs to a playlist.

        Args:
            req (AddToPlaylistRequest): The request containing playlist ID and songs to add.
        """
        data = {
            "AddToPlaylist": [req]
        }
        send_main_command(json.dumps(data, cls=EnhancedJSONEncoder))

    def register_oauth(self, token: str) -> None:
        """
        Register OAuth callback.

        Args:
            token (str): The OAuth token.
        """
        data = {
            "RegisterOAuth": [token]
        }
        send_main_command(json.dumps(data, cls=EnhancedJSONEncoder))

    def open_external_url(self, url: str) -> None:
        """
        Open a URL in the default browser.

        Args:
            url (str): The URL to open.
        """
        data = {
            "OpenExternalUrl": [url]
        }
        send_main_command(json.dumps(data, cls=EnhancedJSONEncoder))

    def update_accounts(self) -> None:
        """
        Update accounts status.
        """
        data = {
            "UpdateAccounts": []
        }
        send_main_command(json.dumps(data, cls=EnhancedJSONEncoder))


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
    extism.output_str(json.dumps(instance.get_provider_scopes(), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_playlists_wrapper():
    instance = ensure_extension_instance()
    extism.output_str(json.dumps(instance.get_playlists(), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_playlist_content_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    playlist_id = str(data[0])
    token = str(data[1]) if len(data) > 1 and data[1] is not None else None
    extism.output_str(json.dumps(instance.get_playlist_content(playlist_id, token), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_playlist_from_url_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    url = str(data)
    extism.output_str(json.dumps(instance.get_playlist_from_url(url), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_playback_details_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data)
    extism.output_str(json.dumps(instance.get_playback_details(song), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_search_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    term = str(data)
    extism.output_str(json.dumps(instance.get_search(term), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_recommendations_wrapper():
    instance = ensure_extension_instance()
    extism.output_str(json.dumps(instance.get_recommendations(), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_song_from_url_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    url = str(data)
    extism.output_str(json.dumps(instance.get_song_from_url(url), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def handle_custom_request_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    url = str(data)
    extism.output_str(json.dumps(instance.handle_custom_request(url), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_artist_songs_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    artist = build_object(Artist, data[0])
    token = str(data[1]) if len(data) > 1 and data[1] is not None else None
    extism.output_str(json.dumps(instance.get_artist_songs(artist, token), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_album_songs_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    album = build_object(Album, data[0])
    token = str(data[1]) if len(data) > 1 and data[1] is not None else None
    extism.output_str(json.dumps(instance.get_album_songs(album, token), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_song_from_id_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song_id = str(data)
    extism.output_str(json.dumps(instance.get_song_from_id(song_id), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_queue_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    queue = data
    extism.output_str(json.dumps(instance.on_queue_changed(queue), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_volume_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    volume = float(data)
    extism.output_str(json.dumps(instance.on_volume_changed(volume), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_player_state_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    state = cast(PlayerState, str(data))
    extism.output_str(json.dumps(instance.on_player_state_changed(state), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_song_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data[0]) if data[0] is not None else None
    extism.output_str(json.dumps(instance.on_song_changed(song), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_seeked_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    time = float(data)
    extism.output_str(json.dumps(instance.on_seeked(time), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_preferences_changed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    args = build_object(PreferenceArgs, data)
    extism.output_str(json.dumps(instance.on_preferences_changed(args), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_song_added_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data)
    extism.output_str(json.dumps(instance.on_song_added(song), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_song_removed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data)
    extism.output_str(json.dumps(instance.on_song_removed(song), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_playlist_added_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    playlist = build_object(Playlist, data)
    extism.output_str(json.dumps(instance.on_playlist_added(playlist), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_playlist_removed_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    playlist = build_object(Playlist, data)
    extism.output_str(json.dumps(instance.on_playlist_removed(playlist), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_accounts_wrapper():
    instance = ensure_extension_instance()
    extism.output_str(json.dumps(instance.get_accounts(), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def perform_account_login_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    args = build_object(AccountLoginArgs, data)
    extism.output_str(json.dumps(instance.perform_account_login(args), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def scrobble_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data)
    extism.output_str(json.dumps(instance.scrobble(song), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def oauth_callback_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    args = str(data)
    extism.output_str(json.dumps(instance.oauth_callback(args), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_song_context_menu_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = [Song.from_dict(item) for item in data]
    extism.output_str(json.dumps(instance.get_song_context_menu(song), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_playlist_context_menu_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    playlist = build_object(Playlist, data)
    extism.output_str(json.dumps(instance.get_playlist_context_menu(playlist), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def on_context_menu_action_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    code = str(data)
    extism.output_str(json.dumps(instance.on_context_menu_action(code), cls=EnhancedJSONEncoder))

@extism.plugin_fn
def get_lyrics_wrapper():
    instance = ensure_extension_instance()
    data = extism.input_json()
    song = build_object(Song, data)
    extism.output_str(json.dumps(instance.get_lyrics(song), cls=EnhancedJSONEncoder))

# from extension import init
# @extism.plugin_fn
# def entry():
#     init()
