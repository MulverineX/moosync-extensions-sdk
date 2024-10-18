use common_types::{
    AccountLoginArgs, CustomRequestReturnType, ExtensionAccountDetail, ExtensionProviderScope,
    MainCommand, MoosyncError, MoosyncResult, PlaybackDetailsReturnType, PreferenceArgs,
    QueryableAlbum, QueryableArtist, QueryablePlaylist, SearchResult, Song,
};
use extism_pdk::{extism, host_fn};
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
    fn get_playlist_content(&self, id: String) -> MoosyncResult<Vec<Song>> {
        Err("Not implemented".into())
    }
    fn get_playlist_from_url(&self) -> MoosyncResult<Option<QueryablePlaylist>> {
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

    fn get_artist_songs(&self, artist: QueryableArtist) -> MoosyncResult<Vec<Song>> {
        Err("Not implemented".into())
    }

    fn get_album_songs(&self, album: QueryableAlbum) -> MoosyncResult<Vec<Song>> {
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
}

pub mod extension_api {
    use common_types::{
        AddToPlaylistRequest, GetSongOptions, MainCommand, MoosyncError, MoosyncResult,
        PlayerState, PreferenceData, QueryablePlaylist, Song,
    };
    use serde_json::Value;

    use super::{send_main_command, system_time};

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
    }

    create_api_fn_no_resp! {
        set_preference(SetPreference, data: PreferenceData) -> ();
        set_secure(SetSecure, data: PreferenceData) -> ();
        add_songs(AddSongs, songs: Vec<Song>) -> ();
        remove_song(RemoveSong, song: Song) -> ();
        update_song(UpdateSong, song: Song) -> ();
        add_playlist(AddPlaylist, playlist: QueryablePlaylist) -> ();
        add_to_playlist(AddToPlaylist, request: AddToPlaylistRequest) -> ();
        register_oauth(RegisterOAuth, token: String) -> ();
        open_external_url(OpenExternalUrl, url: String) -> ();
        update_accounts(UpdateAccounts,) -> ()
    }

    pub fn get_system_time() -> u64 {
        unsafe {
            if let Ok(time) = system_time() {
                return time;
            }
            0u64
        }
    }
}
