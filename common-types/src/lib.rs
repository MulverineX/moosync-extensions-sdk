use std::collections::HashMap;
use std::path::PathBuf;

use extism_convert::{FromBytes, Json, ToBytes};

use serde::{Deserialize, Serialize, Serializer};
use serde_json::Value;
pub use types::entities::*;
pub use types::extensions::{
    CustomRequestReturnType, ExtensionAccountDetail, ExtensionContextMenuItem, ExtensionDetail,
    ExtensionExtraEventArgs, ExtensionProviderScope, PlaybackDetailsReturnType, PreferenceArgs,
};
pub use types::songs::*;

pub use types::errors::{MoosyncError, Result as MoosyncResult};
pub use types::extensions::{ExtensionExtraEvent, GenericExtensionHostRequest, PackageNameArgs};
#[derive(Debug, Serialize, Deserialize, ToBytes, FromBytes)]
#[encoding(Json)]
pub struct ExtensionDetailsWrapper(pub ExtensionDetail);

#[derive(Debug, Serialize, Deserialize, ToBytes, FromBytes)]
#[encoding(Json)]
pub struct JsonWrapper<T>(pub T);

#[derive(Debug, Deserialize, Serialize, FromBytes)]
#[encoding(Json)]
pub enum ExtensionExtraEventResponse {
    RequestedPlaylists(Vec<QueryablePlaylist>),
    RequestedPlaylistSongs(Vec<Song>),
    OauthCallback,
    SongQueueChanged,
    Seeked,
    VolumeChanged,
    PlayerStateChanged,
    SongChanged,
    PreferenceChanged,
    PlaybackDetailsRequested(PlaybackDetailsReturnType),
    CustomRequest(CustomRequestReturnType),
    RequestedSongFromURL(Song),
    RequestedPlaylistFromURL(QueryablePlaylist),
    RequestedSearchResult(SearchResult),
    RequestedRecommendations(Vec<Song>),
    RequestedLyrics(String),
    RequestedArtistSongs(Vec<Song>),
    RequestedAlbumSongs(Vec<Song>),
    SongAdded,
    SongRemoved,
    PlaylistAdded,
    PlaylistRemoved,
    RequestedSongFromId(Song),
    GetRemoteURL(String),
}

fn serialize_null<S>(field: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    field.serialize_none()
}

#[derive(Debug, Deserialize, Serialize, FromBytes)]
#[serde(untagged)]
#[encoding(Json)]
pub enum ExtensionCommandResponse {
    GetProviderScopes(Vec<ExtensionProviderScope>),
    GetExtensionContextMenu(Vec<ExtensionContextMenuItem>),
    GetAccounts(Vec<ExtensionAccountDetail>),
    PerformAccountLogin,
    ExtraExtensionEvent(Box<ExtensionExtraEventResponse>),

    #[serde(serialize_with = "serialize_null")]
    Empty,
}

#[derive(Debug, Clone)]
pub enum ExtensionCommand {
    GetProviderScopes(PackageNameArgs),
    GetExtensionContextMenu,
    GetAccounts,
    PerformAccountLogin,
    ExtraExtensionEvent(ExtensionExtraEventArgs),
}

impl TryFrom<(&str, &Value)> for ExtensionCommand {
    type Error = MoosyncError;
    fn try_from((r#type, data): (&str, &Value)) -> Result<Self, Self::Error> {
        match r#type {
            "extraExtensionEvents" => {
                let res = serde_json::from_value(data.clone());
                if let Ok(res) = res {
                    return Ok(ExtensionCommand::ExtraExtensionEvent(res));
                }
            }
            "getExtensionProviderScopes" => {
                let res = serde_json::from_value(data.clone());
                if let Ok(res) = res {
                    return Ok(ExtensionCommand::GetProviderScopes(res));
                }
            }
            "getExtensionContextMenu" => return Ok(ExtensionCommand::GetExtensionContextMenu),
            "getAccounts" => return Ok(ExtensionCommand::GetAccounts),
            "performAccountLogin" => return Ok(ExtensionCommand::PerformAccountLogin),
            _ => {}
        }
        Err("Invalid command".into())
    }
}

impl ExtensionCommand {
    pub fn to_plugin_call(&self) -> (String, &'static str, Vec<u8>) {
        match self {
            Self::GetProviderScopes(args) => (
                args.package_name.clone(),
                "get_provider_scopes_wrapper",
                vec![],
            ),
            Self::GetExtensionContextMenu => todo!(),
            Self::GetAccounts => todo!(),
            Self::PerformAccountLogin => todo!(),
            Self::ExtraExtensionEvent(args) => {
                let package_name = args.package_name.clone();
                let res = match &args.data {
                    ExtensionExtraEvent::RequestedPlaylists(_) => ("get_playlists_wrapper", vec![]),
                    ExtensionExtraEvent::RequestedPlaylistSongs(id, _, _) => {
                        ("get_playlist_content_wrapper", Json(id).to_bytes().unwrap())
                    }
                    ExtensionExtraEvent::OauthCallback(_) => todo!(),
                    ExtensionExtraEvent::SongQueueChanged(value) => (
                        "on_queue_changed_wrapper",
                        Json(value[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::Seeked(time) => {
                        ("on_seeked_wrapper", Json(time[0]).to_bytes().unwrap())
                    }
                    ExtensionExtraEvent::VolumeChanged(_) => ("on_volume_changed_wrapper", vec![]),
                    ExtensionExtraEvent::PlayerStateChanged(player_state) => (
                        "on_player_state_changed_wrapper",
                        Json(player_state[0]).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::SongChanged(_) => ("on_song_changed_wrapper", vec![]),
                    ExtensionExtraEvent::PreferenceChanged(preferences) => (
                        "on_preferences_changed_wrapper",
                        Json(preferences[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::PlaybackDetailsRequested(songs) => (
                        "get_playback_details_wrapper",
                        Json(songs[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::CustomRequest(url) => (
                        "handle_custom_request_wrapper",
                        Json(url[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::RequestedSongFromURL(url, _) => {
                        ("get_song_from_url_wrapper", Json(url).to_bytes().unwrap())
                    }
                    ExtensionExtraEvent::RequestedPlaylistFromURL(id, _) => (
                        "get_playlist_from_url_wrapper",
                        Json(id).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::RequestedSearchResult(term) => {
                        ("search_wrapper", Json(term[0].clone()).to_bytes().unwrap())
                    }
                    ExtensionExtraEvent::RequestedRecommendations => {
                        ("get_recommendations_wrapper", vec![])
                    }
                    ExtensionExtraEvent::RequestedLyrics(_) => todo!(),
                    ExtensionExtraEvent::RequestedArtistSongs(artist, _) => (
                        "get_artist_songs_wrapper",
                        Json(artist.clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::RequestedAlbumSongs(album, _) => (
                        "get_album_songs_wrapper",
                        Json(album.clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::SongAdded(song) => (
                        "on_song_added_wrapper",
                        Json(song[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::SongRemoved(song) => (
                        "on_song_removed_wrapper",
                        Json(song[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::PlaylistAdded(playlist) => (
                        "on_playlist_added_wrapper",
                        Json(playlist[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::PlaylistRemoved(playlist) => (
                        "on_playlist_removed_wrapper",
                        Json(playlist[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::RequestedSongFromId(id) => (
                        "get_song_from_id_wrapper",
                        Json(id[0].clone()).to_bytes().unwrap(),
                    ),
                    ExtensionExtraEvent::GetRemoteURL(_) => todo!(),
                };
                (package_name, res.0, res.1)
            }
        }
    }

    pub fn parse_response(&self, value: Value) -> ExtensionCommandResponse {
        match self {
            Self::GetProviderScopes(_) => {
                ExtensionCommandResponse::GetProviderScopes(serde_json::from_value(value).unwrap())
            }
            Self::GetExtensionContextMenu => ExtensionCommandResponse::GetExtensionContextMenu(
                serde_json::from_value(value).unwrap(),
            ),
            Self::GetAccounts => {
                ExtensionCommandResponse::GetAccounts(serde_json::from_value(value).unwrap())
            }
            Self::PerformAccountLogin => ExtensionCommandResponse::PerformAccountLogin,
            Self::ExtraExtensionEvent(args) => {
                let res = match &args.data {
                    ExtensionExtraEvent::RequestedPlaylists(_) => {
                        ExtensionExtraEventResponse::RequestedPlaylists(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::RequestedPlaylistSongs(_, _, _) => {
                        ExtensionExtraEventResponse::RequestedPlaylistSongs(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::OauthCallback(_) => {
                        ExtensionExtraEventResponse::OauthCallback
                    }
                    ExtensionExtraEvent::SongQueueChanged(_) => {
                        ExtensionExtraEventResponse::SongQueueChanged
                    }
                    ExtensionExtraEvent::Seeked(_) => ExtensionExtraEventResponse::Seeked,
                    ExtensionExtraEvent::VolumeChanged(_) => {
                        ExtensionExtraEventResponse::VolumeChanged
                    }
                    ExtensionExtraEvent::PlayerStateChanged(_) => {
                        ExtensionExtraEventResponse::PlayerStateChanged
                    }
                    ExtensionExtraEvent::SongChanged(_) => ExtensionExtraEventResponse::SongChanged,
                    ExtensionExtraEvent::PreferenceChanged(_) => {
                        ExtensionExtraEventResponse::PreferenceChanged
                    }
                    ExtensionExtraEvent::PlaybackDetailsRequested(_) => {
                        ExtensionExtraEventResponse::PlaybackDetailsRequested(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::CustomRequest(_) => {
                        ExtensionExtraEventResponse::CustomRequest(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::RequestedSongFromURL(_, _) => {
                        ExtensionExtraEventResponse::RequestedSongFromURL(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::RequestedPlaylistFromURL(_, _) => {
                        ExtensionExtraEventResponse::RequestedPlaylistFromURL(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::RequestedSearchResult(_) => {
                        ExtensionExtraEventResponse::RequestedSearchResult(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::RequestedRecommendations => {
                        ExtensionExtraEventResponse::RequestedRecommendations(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::RequestedLyrics(_) => {
                        ExtensionExtraEventResponse::RequestedLyrics(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::RequestedArtistSongs(_, _) => {
                        ExtensionExtraEventResponse::RequestedArtistSongs(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::RequestedAlbumSongs(_, _) => {
                        ExtensionExtraEventResponse::RequestedAlbumSongs(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::SongAdded(_) => ExtensionExtraEventResponse::SongAdded,
                    ExtensionExtraEvent::SongRemoved(_) => ExtensionExtraEventResponse::SongRemoved,
                    ExtensionExtraEvent::PlaylistAdded(_) => {
                        ExtensionExtraEventResponse::PlaylistAdded
                    }
                    ExtensionExtraEvent::PlaylistRemoved(_) => {
                        ExtensionExtraEventResponse::PlaylistRemoved
                    }
                    ExtensionExtraEvent::RequestedSongFromId(_) => {
                        ExtensionExtraEventResponse::RequestedSongFromId(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                    ExtensionExtraEvent::GetRemoteURL(_) => {
                        ExtensionExtraEventResponse::GetRemoteURL(
                            serde_json::from_value(value).unwrap(),
                        )
                    }
                };
                ExtensionCommandResponse::ExtraExtensionEvent(Box::new(res))
            }
        }
    }
}

#[derive(Debug)]
pub enum RunnerCommand {
    FindNewExtensions,
    GetInstalledExtensions,
    GetExtensionIcon(PackageNameArgs),
    ToggleExtensionStatus(PackageNameArgs),
    RemoveExtension(PackageNameArgs),
    StopProcess,
    GetDisplayName(PackageNameArgs),
}

impl TryFrom<(&str, &Value)> for RunnerCommand {
    type Error = MoosyncError;

    fn try_from((r#type, data): (&str, &Value)) -> Result<Self, Self::Error> {
        match r#type {
            "findNewExtensions" => Ok(Self::FindNewExtensions),
            "getInstalledExtensions" => Ok(Self::GetInstalledExtensions),
            "getExtensionIcon" => Ok(Self::GetExtensionIcon(
                serde_json::from_value(data.clone()).unwrap(),
            )),
            "toggleExtensionStatus" => Ok(Self::ToggleExtensionStatus(
                serde_json::from_value(data.clone()).unwrap(),
            )),
            "removeExtension" => Ok(Self::RemoveExtension(
                serde_json::from_value(data.clone()).unwrap(),
            )),
            "stopProcess" => Ok(Self::StopProcess),
            "getDisplayName" => Ok(Self::GetDisplayName(
                serde_json::from_value(data.clone()).unwrap(),
            )),
            _ => Err("Failed to parse runner command".into()),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestPermissions {
    pub hosts: Vec<String>,
    pub paths: HashMap<PathBuf, PathBuf>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionManifest {
    pub moosync_extension: bool,
    pub display_name: String,
    pub extension_entry: PathBuf,
    pub author: Option<String>,
    pub name: String,
    pub version: String,
    pub icon: String,
    pub permissions: Option<ManifestPermissions>,
}
