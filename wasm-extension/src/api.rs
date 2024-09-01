use serde_json::Value;
use types::{
    entities::{QueryableAlbum, QueryableArtist, QueryablePlaylist, SearchResult},
    errors::Result,
    extensions::{
        CustomRequestReturnType, ExtensionProviderScope, PlaybackDetailsReturnType, PreferenceArgs,
    },
    songs::Song,
};

#[allow(unused_variables)]
pub trait DatabaseEvents {
    fn on_song_added(&self, song: Song) -> Result<()> {
        Err("Not implemented".into())
    }

    fn on_song_removed(&self, song: Song) -> Result<()> {
        Err("Not implemented".into())
    }

    fn on_playlist_added(&self, playlist: QueryablePlaylist) -> Result<()> {
        Err("Not implemented".into())
    }

    fn on_playlist_removed(&self, playlist: QueryablePlaylist) -> Result<()> {
        Err("Not implemented".into())
    }
}

#[allow(unused_variables)]
pub trait PreferenceEvents {
    fn on_preferences_changed(&self, args: PreferenceArgs) -> Result<()> {
        Err("Not implemented".into())
    }
}

#[allow(unused_variables)]
pub trait PlayerEvents {
    fn on_queue_changed(&self, queue: Value) -> Result<()> {
        Err("Not implemented".into())
    }

    fn on_volume_changed(&self) -> Result<()> {
        Err("Not implemented".into())
    }

    fn on_player_state_changed(&self) -> Result<()> {
        Err("Not implemented".into())
    }

    fn on_song_changed(&self) -> Result<()> {
        Err("Not implemented".into())
    }

    fn on_seeked(&self, time: f64) -> Result<()> {
        Err("Not implemented".into())
    }
}

#[allow(unused_variables)]
pub trait Provider {
    fn get_provider_scopes(&self) -> Result<Vec<ExtensionProviderScope>>;

    fn get_playlists(&self) -> Result<Vec<QueryablePlaylist>> {
        Err("Not implemented".into())
    }
    fn get_playlist_content(&self, id: String) -> Result<Vec<Song>> {
        Err("Not implemented".into())
    }
    fn get_playlist_from_url(&self) -> Result<QueryablePlaylist> {
        Err("Not implemented".into())
    }
    fn get_playback_details(&self, song: Song) -> Result<PlaybackDetailsReturnType> {
        Err("Not implemented".into())
    }
    fn search(&self, term: String) -> Result<SearchResult> {
        Err("Not implemented".into())
    }
    fn get_recommendations(&self) -> Result<Vec<Song>> {
        Err("Not implemented".into())
    }

    fn get_song_from_url(&self, url: String) -> Result<Song> {
        Err("Not implemented".into())
    }

    fn handle_custom_request(&self, url: String) -> Result<CustomRequestReturnType> {
        Err("Not implemented".into())
    }

    fn get_artist_songs(&self, artist: QueryableArtist) -> Result<Vec<Song>> {
        Err("Not implemented".into())
    }

    fn get_album_songs(&self, album: QueryableAlbum) -> Result<Vec<Song>> {
        Err("Not implemented".into())
    }

    fn get_song_from_id(&self, id: String) -> Result<Song> {
        Err("Not implemented".into())
    }
}

pub trait Extension: Provider + PlayerEvents + PreferenceEvents + DatabaseEvents {}
