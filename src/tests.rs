use std::{
    collections::HashMap, fs, path::PathBuf, process::Command, str::FromStr, sync::Once, thread,
    time::Duration,
};

use crate::extension_handler::ExtensionHandler;
use common_types::{
    CustomRequestReturnType, ExtensionAccountDetail, ExtensionCommand, ExtensionDetail,
    ExtensionExtraEvent, ExtensionExtraEventArgs, ExtensionProviderScope, ExtensionUIRequest,
    GenericExtensionHostRequest, PackageNameArgs, PlaybackDetailsReturnType, PlayerState,
    PlaylistAndSongsReturnType, PlaylistReturnType, PreferenceArgs, QueryablePlaylist,
    RecommendationsReturnType, RunnerCommand, SearchReturnType, Song, SongReturnType,
    SongsWithPageTokenReturnType,
};
use serde_json::Value;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tracing_subscriber::{fmt, layer::SubscriberExt};

static INIT: Once = Once::new();

fn generate_ext() {
    INIT.call_once(|| {
        let filter = tracing_subscriber::filter::LevelFilter::DEBUG;
        let layer = fmt::layer().pretty().with_target(true);
        let subscriber = tracing_subscriber::registry().with(layer).with(filter);

        tracing::subscriber::set_global_default(subscriber).unwrap();

        let path = std::env::current_dir().unwrap();
        let js_ext_path = path.join("wasm-extension-js/test");
        let tests_path = path.join("tests");
        // if tests_path.exists() {
        //     for entry in tests_path.read_dir().unwrap() {
        //         std::fs::remove_file(entry.unwrap().path()).unwrap();
        //     }
        // } else {
        //     fs::create_dir(tests_path.clone()).unwrap();
        // }

        println!("js ext path {:?} {}", js_ext_path, js_ext_path.exists());
        // Command::new("yarn")
        //     .args(["install"])
        //     .current_dir(js_ext_path.clone())
        //     .spawn()
        //     .unwrap()
        //     .wait()
        //     .unwrap();

        // Command::new("yarn")
        //     .args(["build"])
        //     .current_dir(js_ext_path.clone())
        //     .spawn()
        //     .unwrap()
        //     .wait()
        //     .unwrap();

        // Command::new("cp")
        //     .args(["dist/ext.wasm", "../../tests/js-ext.wasm"])
        //     .current_dir(js_ext_path.clone())
        //     .spawn()
        //     .unwrap()
        //     .wait()
        //     .unwrap();

        println!("current dir {:?}", path);
    });
}

struct Listeners {
    main_command_tx: UnboundedSender<GenericExtensionHostRequest<Value>>,
    main_reply_rx: UnboundedReceiver<GenericExtensionHostRequest<Value>>,
    ext_command_rx: UnboundedReceiver<ExtensionUIRequest>,
}

async fn initialize() -> Listeners {
    generate_ext();

    let (main_command_tx, main_command_rx) = unbounded_channel();
    let (main_reply_tx, mut main_reply_rx) = unbounded_channel();
    let (ext_command_tx, ext_command_rx) = unbounded_channel();

    let extensions_path = std::env::current_dir()
        .unwrap()
        .join("tests")
        .to_str()
        .unwrap()
        .to_string();

    tokio::spawn(async move {
        let mut ext_handler = ExtensionHandler::new(
            extensions_path,
            main_command_rx,
            main_reply_tx,
            ext_command_tx,
        );
        ext_handler.listen_commands().await;
    });

    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: "findNewExtensions".to_string(),
            channel: "1".to_string(),
            data: None,
        })
        .unwrap();

    main_reply_rx.recv().await;

    Listeners {
        main_command_tx,
        main_reply_rx,
        ext_command_rx,
    }
}

#[tokio::test]
async fn test_discovery() {
    let Listeners {
        main_command_tx,
        mut main_reply_rx,
        ext_command_rx: _,
    } = initialize().await;

    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: "getInstalledExtensions".to_string(),
            channel: "12345".to_string(),
            data: None,
        })
        .unwrap();

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: Vec<ExtensionDetail> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert_eq!(resp.len(), 1);
    }

    loop {}
}

#[tokio::test]
async fn test_events_no_input() {
    let Listeners {
        main_command_tx,
        mut main_reply_rx,
        ext_command_rx: _,
    } = initialize().await;

    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: "getAccounts".to_string(),
            channel: "2".to_string(),
            data: Some(
                serde_json::to_value(PackageNameArgs {
                    package_name: "moosync.sample.extension".to_string(),
                })
                .unwrap(),
            ),
        })
        .unwrap();

    if let Some(resp) = main_reply_rx.recv().await {
        println!("Got resp {:?}", resp);
        let resp: HashMap<String, Vec<ExtensionAccountDetail>> =
            serde_json::from_value(resp.data.unwrap()).unwrap();
        assert_eq!(resp.get("moosync.sample.extension").unwrap().len(), 1);
    }

    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: "getExtensionProviderScopes".to_string(),
            channel: "3".to_string(),
            data: Some(
                serde_json::to_value(PackageNameArgs {
                    package_name: "moosync.sample.extension".to_string(),
                })
                .unwrap(),
            ),
        })
        .unwrap();

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Vec<ExtensionProviderScope>> =
            serde_json::from_value(resp.data.unwrap()).unwrap();
        println!("Got resp {:?}", resp);
        assert!(resp.get("moosync.sample.extension").is_some());
    }
}

fn send_extra_event(
    main_command_tx: UnboundedSender<GenericExtensionHostRequest<Value>>,
    arg: ExtensionExtraEvent,
) {
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: "extraExtensionEvents".to_string(),
            // TODO: Randomize this
            channel: "9999".to_string(),
            data: Some(
                serde_json::to_value(ExtensionExtraEventArgs {
                    package_name: "moosync.sample.extension".to_string(),
                    data: arg,
                })
                .unwrap(),
            ),
        })
        .unwrap();
}

#[tokio::test]
async fn test_extra_events() {
    let Listeners {
        main_command_tx,
        mut main_reply_rx,
        ext_command_rx: _,
    } = initialize().await;

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::OauthCallback(["This is a code".to_string()]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::Scrobble([Default::default()]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::PlaylistRemoved([vec![QueryablePlaylist::default()]]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::PlaylistAdded([vec![QueryablePlaylist::default()]]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::SongRemoved([vec![Default::default()]]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::SongRemoved([vec![Default::default()]]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::PreferenceChanged([PreferenceArgs {
            key: "key1".to_string(),
            value: Value::String("Hello".to_string()),
        }]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::Seeked([69.1234]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::SongChanged([None]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::PlayerStateChanged([PlayerState::Paused]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::SongQueueChanged([Value::Null]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::VolumeChanged([69.543212324234]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp: HashMap<String, Value> = serde_json::from_value(resp.data.unwrap()).unwrap();
        assert!(resp.values().next().unwrap().is_null());
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedPlaylists([false]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp =
            serde_json::from_value::<HashMap<String, PlaylistReturnType>>(resp.data.unwrap());
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedPlaylistSongs("some playlist".into(), false, None),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, SongsWithPageTokenReturnType>>(
            resp.data.unwrap(),
        );
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedPlaylistFromURL("some url".into(), false),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, PlaylistAndSongsReturnType>>(
            resp.data.unwrap(),
        );
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::PlaybackDetailsRequested([Default::default()]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, PlaybackDetailsReturnType>>(
            resp.data.unwrap(),
        );
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedSearchResult(["hello".into()]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, SearchReturnType>>(resp.data.unwrap());
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedRecommendations,
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, RecommendationsReturnType>>(
            resp.data.unwrap(),
        );
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedSongFromURL("some url".into(), false),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, SongReturnType>>(resp.data.unwrap());
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::CustomRequest(["some url".into()]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp =
            serde_json::from_value::<HashMap<String, CustomRequestReturnType>>(resp.data.unwrap());
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedArtistSongs(Default::default(), None),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, SongsWithPageTokenReturnType>>(
            resp.data.unwrap(),
        );
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedAlbumSongs(Default::default(), None),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, SongsWithPageTokenReturnType>>(
            resp.data.unwrap(),
        );
        assert!(resp.is_ok())
    }

    send_extra_event(
        main_command_tx.clone(),
        ExtensionExtraEvent::RequestedSongFromId(["some id".into()]),
    );

    if let Some(resp) = main_reply_rx.recv().await {
        let resp = serde_json::from_value::<HashMap<String, SongReturnType>>(resp.data.unwrap());
        assert!(resp.is_ok())
    }
}

#[tokio::test]
async fn test_host_fn() {
    let Listeners {
        main_command_tx,
        main_reply_rx: _,
        mut ext_command_rx,
    } = initialize().await;

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "getSongs");

    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(serde_json::to_value(vec![Song::default()]).unwrap()),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "getCurrentSong");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(serde_json::to_value(Song::default()).unwrap()),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "getPlayerState");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(serde_json::to_value(PlayerState::Playing).unwrap()),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "getVolume");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(serde_json::to_value(98.6).unwrap()),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "getTime");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(serde_json::to_value(98.6).unwrap()),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "getQueue");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(serde_json::to_value(vec![Song::default()]).unwrap()),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "getPreferences");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(serde_json::to_value("hello world").unwrap()),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "getSecurePreferences");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(serde_json::to_value("hello world").unwrap()),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "setSecurePreferences");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "setPreferences");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "addSong");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "removeSong");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "updateSong");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "addPlaylist");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "addToPlaylist");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "registerOauth");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "openExternal");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();

    let resp = ext_command_rx.recv().await.unwrap();
    assert!(resp.type_ == "updateAccounts");
    main_command_tx
        .send(GenericExtensionHostRequest {
            type_: resp.type_,
            channel: resp.channel,
            data: Some(Value::Null),
        })
        .unwrap();
}
