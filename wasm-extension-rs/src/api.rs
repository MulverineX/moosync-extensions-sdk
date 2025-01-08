use types::entities::{QueryableAlbum, QueryableArtist, QueryablePlaylist, SearchResult};
use types::extensions::{ExtensionProviderScope, MainCommand};
use types::ui::extensions::{
    AccountLoginArgs, CustomRequestReturnType, ExtensionAccountDetail,
    PlaybackDetailsReturnType, PreferenceArgs,
};
use types::errors::Result as MoosyncResult;
use types::songs::{Song};
use extism_pdk::host_fn;
use serde_json::Value;

#[allow(unused_variables)]
pub trait Accounts {
    fn get_accounts(&self) -> MoosyncResult<Vec<ExtensionAccountDetail>> {
        Err("Not implemented".into())
    }

    fn perform_account_login(&self, args: AccountLoginArgs) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }

    fn oauth_callback(&self, code: String) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }
}

#[allow(unused_variables)]
pub trait DatabaseEvents {
    fn on_song_added(&self, song: Song) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }

    fn on_song_removed(&self, song: Song) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }

    fn on_playlist_added(&self, playlist: QueryablePlaylist) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }

    fn on_playlist_removed(&self, playlist: QueryablePlaylist) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }
}

#[allow(unused_variables)]
pub trait PreferenceEvents {
    fn on_preferences_changed(&self, args: PreferenceArgs) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }
}

#[allow(unused_variables)]
pub trait PlayerEvents {
    fn on_queue_changed(&self, queue: Value) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }

    fn on_volume_changed(&self) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }

    fn on_player_state_changed(&self) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }

    fn on_song_changed(&self) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }

    fn on_seeked(&self, time: f64) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }
}

#[allow(unused_variables)]
pub trait Provider {
    fn get_provider_scopes(&self) -> MoosyncResult<Vec<ExtensionProviderScope>>;

    fn get_playlists(&self) -> MoosyncResult<Vec<QueryablePlaylist>> {
        Err("Not implemented".into())
    }
    fn get_playlist_content(
        &self,
        id: String,
        next_page_token: Option<String>,
    ) -> MoosyncResult<Vec<Song>> {
        Err("Not implemented".into())
    }
    fn get_playlist_from_url(&self, url: String) -> MoosyncResult<Option<QueryablePlaylist>> {
        Err("Not implemented".into())
    }
    fn get_playback_details(&self, song: Song) -> MoosyncResult<PlaybackDetailsReturnType> {
        Err("Not implemented".into())
    }
    fn search(&self, term: String) -> MoosyncResult<SearchResult> {
        Err("Not implemented".into())
    }
    fn get_recommendations(&self) -> MoosyncResult<Vec<Song>> {
        Err("Not implemented".into())
    }

    fn get_song_from_url(&self, url: String) -> MoosyncResult<Option<Song>> {
        Err("Not implemented".into())
    }

    fn handle_custom_request(&self, url: String) -> MoosyncResult<CustomRequestReturnType> {
        Err("Not implemented".into())
    }

    fn get_artist_songs(
        &self,
        artist: QueryableArtist,
        next_page_token: Option<String>,
    ) -> MoosyncResult<Vec<Song>> {
        Err("Not implemented".into())
    }

    fn get_album_songs(
        &self,
        album: QueryableAlbum,
        next_page_token: Option<String>,
    ) -> MoosyncResult<Vec<Song>> {
        Err("Not implemented".into())
    }

    fn get_song_from_id(&self, id: String) -> MoosyncResult<Option<Song>> {
        Err("Not implemented".into())
    }

    fn scrobble(&self, song: Song) -> MoosyncResult<()> {
        Err("Not implemented".into())
    }
}

pub trait Extension:
    Provider + PlayerEvents + PreferenceEvents + DatabaseEvents + Accounts
{
}

#[host_fn]
extern "ExtismHost" {
    fn send_main_command(command: MainCommand) -> Option<Value>;
    fn system_time() -> u64;
    fn open_clientfd(path: String) -> i64;
    fn write_sock(sock_id: i64, buf: Vec<u8>) -> i64;
    fn read_sock(sock_id: i64, read_len: u64) -> Vec<u8>;
}

pub mod extension_api {
    use types::entities::QueryablePlaylist;
    use types::songs::{GetSongOptions, Song};
    use types::ui::extensions::{
        AddToPlaylistRequest, PreferenceData
    };
    use types::errors::{MoosyncError, Result as MoosyncResult};
    use types::extensions::{MainCommand};
    use serde_json::Value;
    use types::ui::player_details::PlayerState;

    use super::{
        open_clientfd, read_sock as read_sock_ext, send_main_command, system_time,
        write_sock as write_sock_ext,
    };

    macro_rules! create_api_fn {
        ($(
            $fn_name:ident (
                $variant:ident,
                $( $arg_name:ident : $arg_type:ty ),*
            ) -> $ret_type:ty
        );* $(;)?) => {
            $(
                pub fn $fn_name($( $arg_name: $arg_type ),*) -> MoosyncResult<$ret_type> {
                    unsafe {
                        match send_main_command(MainCommand::$variant($($arg_name),*)) {
                            Ok(resp) => {
                                if let Some(resp) = resp {
                                    return Ok(serde_json::from_value(resp)?);
                                }
                                Err(MoosyncError::String("No response".into()))
                            }
                            Err(e) => Err(e.to_string().into()),
                        }
                    }
                }
            )*
        };
    }

    macro_rules! create_api_fn_no_resp {
        ($(
            $fn_name:ident (
                $variant:ident,
                $( $arg_name:ident : $arg_type:ty ),*
            ) -> $ret_type:ty
        );* $(;)?) => {
            $(
                pub fn $fn_name($( $arg_name: $arg_type ),*) -> MoosyncResult<$ret_type> {
                    unsafe {
                        match send_main_command(MainCommand::$variant($($arg_name),*)) {
                            Ok(_) => {
                                return Ok(())
                            }
                            Err(e) => Err(e.to_string().into()),
                        }
                    }
                }
            )*
        };
    }

    create_api_fn! {
        get_song(GetSong, options: GetSongOptions) -> Vec<Song>;
        get_current_song(GetCurrentSong,) -> Option<Song>;
        // get_entity(GetEntity, options: GetEntityOptions) -> Vec<Entity>;
        get_player_state(GetPlayerState,) -> PlayerState;
        get_volume(GetVolume,) -> f64;
        get_time(GetTime,) -> f64;
        get_queue(GetQueue,) -> Vec<Song>;
        get_preference(GetPreference, data: PreferenceData) -> Value;

        get_secure(GetSecure, data: PreferenceData) -> Value;
        add_playlist(AddPlaylist, playlist: QueryablePlaylist) -> String;
    }

    create_api_fn_no_resp! {
        set_preference(SetPreference, data: PreferenceData) -> ();
        set_secure(SetSecure, data: PreferenceData) -> ();
        add_songs(AddSongs, songs: Vec<Song>) -> ();
        remove_song(RemoveSong, song: Song) -> ();
        update_song(UpdateSong, song: Song) -> ();

        add_to_playlist(AddToPlaylist, request: AddToPlaylistRequest) -> ();
        register_oauth(RegisterOAuth, token: String) -> ();
        open_external_url(OpenExternalUrl, url: String) -> ();
        update_accounts(UpdateAccounts, package_name: Option<String>) -> ()
    }

    pub fn get_system_time() -> u64 {
        unsafe {
            if let Ok(time) = system_time() {
                return time;
            }
            0u64
        }
    }

    pub fn open_sock(path: String) -> MoosyncResult<i64> {
        let res = unsafe { open_clientfd(path) };
        res.map_err(|e| MoosyncError::String(e.to_string()))
    }

    pub fn write_sock(sock_id: i64, buf: Vec<u8>) -> MoosyncResult<i64> {
        let res = unsafe { write_sock_ext(sock_id, buf) };
        res.map_err(|e| MoosyncError::String(e.to_string()))
    }

    pub fn read_sock(sock_id: i64, read_len: u64) -> MoosyncResult<Vec<u8>> {
        let res = unsafe { read_sock_ext(sock_id, read_len) };
        res.map_err(|e| MoosyncError::String(e.to_string()))
    }
}
