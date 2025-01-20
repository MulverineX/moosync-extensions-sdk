from dataclasses import dataclass, field
from typing import Optional, List, Dict, Union, Any, Literal

ProviderScopes = Literal[
    "search",
    "playlists",
    "playlistSongs",
    "artistSongs",
    "albumSongs",
    "recommendations",
    "scrobbles",
    "playlistFromUrl",
    "songFromUrl",
    "searchAlbum",
    "searchArtist",
    "playbackDetails",
]

@dataclass
class Album:
    album_id: Optional[str] = None
    album_name: Optional[str] = None
    album_coverPath_high: Optional[str] = None
    album_coverPath_low: Optional[str] = None
    album_song_count: Optional[int] = None
    album_artist: Optional[str] = None
    album_extra_info: Optional[str] = None
    year: Optional[int] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'Album':
        return cls(**data)

@dataclass
class ArtistExtraInfo:
    youtube: Optional[Dict[str, Optional[str]]] = field(default_factory=dict)
    spotify: Optional[Dict[str, Optional[str]]] = field(default_factory=dict)
    extensions: Optional[Dict[str, Dict[str, Optional[str]]]] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict) -> 'ArtistExtraInfo':
        return cls(**data)

@dataclass
class Artist:
    artist_id: str
    artist_name: Optional[str] = None
    artist_mbid: Optional[str] = None
    artist_coverPath: Optional[str] = None
    artist_song_count: Optional[int] = None
    artist_extra_info: Optional[ArtistExtraInfo] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'Artist':
        return cls(**data)

@dataclass
class Genre:
    genre_id: str
    genre_name: str
    genre_song_count: int

    @classmethod
    def from_dict(cls, data: dict) -> 'Genre':
        return cls(**data)

@dataclass
class Playlist:
    playlist_id: str
    playlist_name: str
    playlist_desc: Optional[str] = None
    playlist_coverPath: Optional[str] = None
    playlist_song_count: Optional[int] = None
    playlist_path: Optional[str] = None
    icon: Optional[str] = None
    extension: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'Playlist':
        return cls(**data)

PlayerTypes = Literal["LOCAL", "YOUTUBE", "SPOTIFY", "URL", "DASH", "HLS"]

@dataclass
class Song:
    _id: str
    path: Optional[str] = None
    size: Optional[int] = None
    title: str = ""
    song_coverPath_low: Optional[str] = None
    song_coverPath_high: Optional[str] = None
    album: Optional[Album] = None
    artists: List[Artist] = field(default_factory=list)
    date: Optional[str] = None
    year: Optional[Union[int, str]] = None
    genre: List[str] = field(default_factory=list)
    lyrics: Optional[str] = None
    releaseType: List[str] = field(default_factory=list)
    bitrate: Optional[int] = None
    codec: Optional[str] = None
    container: Optional[str] = None
    duration: int = 0
    sampleRate: Optional[int] = None
    hash: Optional[str] = None
    inode: Optional[str] = None
    deviceno: Optional[str] = None
    url: Optional[str] = None
    playbackUrl: Optional[str] = None
    date_added: Optional[int] = None
    providerExtension: Optional[str] = None
    icon: Optional[str] = None
    type: PlayerTypes = "LOCAL"
    playCount: Optional[int] = None
    showInLibrary: Optional[bool] = None
    track_no: Optional[int] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'Song':
        return cls(**data)

@dataclass
class SearchableSong:
    _id: Optional[str] = None
    path: Optional[str] = None
    title: Optional[str] = None
    url: Optional[str] = None
    playbackUrl: Optional[str] = None
    hash: Optional[str] = None
    size: Optional[int] = None
    inode: Optional[str] = None
    deviceno: Optional[str] = None
    type: Optional[PlayerTypes] = None
    extension: Optional[Union[bool, str]] = None
    showInLibrary: Optional[bool] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'SearchableSong':
        return cls(**data)

PlayerState = Literal["PLAYING", "PAUSED", "STOPPED", "LOADING"]

@dataclass
class SongSortOptions:
    type: str  # Should be a key in Song
    asc: bool = True

    @classmethod
    def from_dict(cls, data: dict) -> 'SongSortOptions':
        return cls(**data)

@dataclass
class SongAPIOptions:
    song: Optional[SearchableSong] = None
    album: Optional[Album] = None
    artist: Optional[Artist] = None
    genre: Optional[Genre] = None
    playlist: Optional[Playlist] = None
    sortBy: Optional[Union[SongSortOptions, List[SongSortOptions]]] = None
    inclusive: bool = False
    invert: bool = False

    @classmethod
    def from_dict(cls, data: dict) -> 'SongAPIOptions':
        return cls(**data)

@dataclass
class EntityApiOptions:
    inclusive: bool = False
    invert: bool = False
    artist: Optional[Union[Artist, bool]] = None
    album: Optional[Union[Album, bool]] = None
    genre: Optional[Union[Genre, bool]] = None
    playlist: Optional[Union[Playlist, bool]] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'EntityApiOptions':
        return cls(**data)

@dataclass
class AccountDetails:
    id: str
    packageName: str
    name: str
    bgColor: str
    icon: str
    loggedIn: bool
    username: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'AccountDetails':
        return cls(**data)

@dataclass
class AccountLoginArgs:
    packageName: str
    accountId: str
    loginStatus: bool

    @classmethod
    def from_dict(cls, data: dict) -> 'AccountLoginArgs':
        return cls(**data)

@dataclass
class PreferenceArgs:
    key: str
    value: Any

    @classmethod
    def from_dict(cls, data: dict) -> 'PreferenceArgs':
        return cls(**data)

@dataclass
class SearchReturnType:
    songs: List[Song]
    artists: List[Artist]
    playlists: List[Playlist]
    albums: List[Album]
    genres: List[Genre]

    @classmethod
    def from_dict(cls, data: dict) -> 'SearchReturnType':
        return cls(**data)

@dataclass
class RecommendationsReturnType:
    songs: List[Song]

    @classmethod
    def from_dict(cls, data: dict) -> 'RecommendationsReturnType':
        return cls(**data)

@dataclass
class PlaylistsReturnType:
    playlists: List[Playlist]

    @classmethod
    def from_dict(cls, data: dict) -> 'PlaylistsReturnType':
        return cls(**data)

@dataclass
class SongsWithPageTokenReturnType:
    songs: List[Song]
    nextPageToken: Optional[Any] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'SongsWithPageTokenReturnType':
        return cls(**data)

@dataclass
class PlaybackDetailsReturnType:
    duration: int
    url: str

    @classmethod
    def from_dict(cls, data: dict) -> 'PlaybackDetailsReturnType':
        return cls(**data)

@dataclass
class CustomRequestReturnType:
    mimeType: Optional[str] = None
    data: Optional[Any] = None
    redirectUrl: Optional[str] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'CustomRequestReturnType':
        return cls(**data)

@dataclass
class SongReturnType:
    song: Optional[Song] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'SongReturnType':
        return cls(**data)

@dataclass
class PlaylistAndSongsReturnType:
    playlist: Optional[Playlist] = None
    songs: Optional[List[Song]] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'PlaylistAndSongsReturnType':
        return cls(**data)

@dataclass
class PreferenceData:
    key: str
    value: Optional[Any] = None
    defaultValue: Optional[Any] = None

    @classmethod
    def from_dict(cls, data: dict) -> 'PreferenceData':
        return cls(**data)

@dataclass
class AddToPlaylistRequest:
    playlistID: str
    songs: List[Song]

    @classmethod
    def from_dict(cls, data: dict) -> 'AddToPlaylistRequest':
        return cls(**data)
