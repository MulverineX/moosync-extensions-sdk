use std::{thread, time::Duration};

use common_types::{
    ExtensionExtraEvent, ExtensionExtraEventArgs, GenericExtensionHostRequest, PackageNameArgs,
};
use extension_handler::ExtensionHandler;
use extism::set_log_callback;
use ipc::SocketHandler;
use tokio::sync::mpsc::unbounded_channel;

mod extension_handler;
mod ipc;

#[tokio::main]
async fn main() {
    let args = [
        "-ipcPath",
        "/home/ovenoboyo/.local/share/app.moosync.moosync/extensions/ipc/ipc.sock",
        "-extensionPath",
        "/home/ovenoboyo/.local/share/app.moosync.moosync/extensions",
        "-installPath",
        "/home/ovenoboyo/projects/moosync/tauri/Moosync/target/debug/moosync",
    ];

    set_log_callback(
        move |log| {
            println!("{log}");
        },
        "info",
    )
    .unwrap();

    let (main_command_tx, main_command_rx) = unbounded_channel();
    let (main_reply_tx, main_reply_rx) = unbounded_channel();

    let main_command_tx_clone = main_command_tx.clone();
    let handle = tokio::spawn(async move {
        let ipc_path = args
            .get(args.iter().position(|a| *a == "-ipcPath").unwrap() + 1)
            .unwrap();

        let socket_handler = SocketHandler::new(ipc_path, main_command_tx_clone, main_reply_rx);
        socket_handler.listen().await;
    });

    let ext_handle = tokio::spawn(async move {
        let extensions_path = args
            .get(args.iter().position(|a| *a == "-extensionPath").unwrap() + 1)
            .unwrap();
        let mut ext_handler =
            ExtensionHandler::new(extensions_path, main_command_rx, main_reply_tx);
        ext_handler.listen_commands().await;
    });

    tokio::spawn(async move {
        thread::sleep(Duration::from_secs(2));
        main_command_tx.send(GenericExtensionHostRequest {
            type_: "getExtensionProviderScopes".into(),
            channel: "1".into(),
            data: Some(
                serde_json::to_value(PackageNameArgs {
                    package_name: "moosync.sample.extension".into(),
                })
                .unwrap(),
            ),
        })
    });

    ext_handle.await.unwrap();

    // handle.await.unwrap();
    // let url = Wasm::file("target/wasm32-unknown-unknown/debug/rust_pdk_template.wasm");
    // let manifest = Manifest::new([url]);

    // let mut plugin = Plugin::new(&manifest, [], true).unwrap();
    // plugin.call::<(), ()>("entry", ()).unwrap();

    // let res = plugin
    //     .call::<(), ProviderScopeWrapper>("extension_provides", ())
    //     .unwrap();

    // println!("{:?}", res);
}
