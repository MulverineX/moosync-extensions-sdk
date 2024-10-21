use std::env;

use extension_handler::ExtensionHandler;
use ipc::SocketHandler;
use tokio::sync::mpsc::unbounded_channel;
use tracing_subscriber::{fmt, layer::SubscriberExt, EnvFilter};

mod extension_handler;
mod ipc;
mod tests;

#[tracing::instrument(level = "trace", skip())]
#[tokio::main]
async fn main() {
    let filter = EnvFilter::from_env("MOOSYNC_LOG");
    let layer = fmt::layer().pretty().with_target(true);
    let subscriber = tracing_subscriber::registry().with(layer).with(filter);

    tracing::subscriber::set_global_default(subscriber).unwrap();

    let args = env::args().collect::<Vec<String>>();
    let ipc_path = args
        .get(args.iter().position(|a| *a == "-ipcPath").unwrap() + 1)
        .unwrap()
        .clone();

    let extensions_path = args
        .get(args.iter().position(|a| *a == "-extensionPath").unwrap() + 1)
        .unwrap()
        .clone();

    let (main_command_tx, main_command_rx) = unbounded_channel();
    let (main_reply_tx, main_reply_rx) = unbounded_channel();
    let (ext_command_tx, ext_command_rx) = unbounded_channel();

    let main_command_tx_clone = main_command_tx.clone();
    let handle = tokio::spawn(async move {
        let socket_handler = SocketHandler::new(
            ipc_path,
            main_command_tx_clone,
            main_reply_rx,
            ext_command_rx,
        );
        socket_handler.listen().await;
    });

    tokio::spawn(async move {
        let mut ext_handler = ExtensionHandler::new(
            extensions_path,
            main_command_rx,
            main_reply_tx,
            ext_command_tx,
        );
        ext_handler.listen_commands().await;
    });

    handle.await.unwrap();
}
