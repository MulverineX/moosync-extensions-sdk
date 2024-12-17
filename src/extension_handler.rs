use std::{
    collections::HashMap,
    fs,
    io::{Read, Write},
    path::PathBuf,
    process,
    str::FromStr,
    sync::Arc,
    thread,
    time::{SystemTime, UNIX_EPOCH},
};

use common_types::{
    ExtensionCommand, ExtensionCommandResponse, ExtensionDetail, ExtensionManifest,
    ExtensionUIRequest, GenericExtensionHostRequest, MainCommand, MoosyncResult, RunnerCommand,
};
use extism::{host_fn, Error, Manifest, Plugin, PluginBuilder, UserData, ValType::I64, Wasm, PTR};
use futures::executor::block_on;
use interprocess::local_socket::{
    prelude::LocalSocketStream, traits::Stream, GenericFilePath, ToFsName,
};
use serde_json::Value;
use tokio::sync::{
    mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender},
    Mutex,
};
use tracing::{error, info};

pub type MainCommandReceiver = UnboundedReceiver<GenericExtensionHostRequest<Value>>;
pub type MainCommandSender = UnboundedSender<GenericExtensionHostRequest<Value>>;

pub type ExtReplyReceiver = UnboundedReceiver<(String, String, ExtensionCommandResponse)>;
pub type ExtReplySender = UnboundedSender<(String, String, ExtensionCommandResponse)>;

pub type MainReplySender = MainCommandSender;
pub type MainReplyReceiver = MainCommandReceiver;

pub type ExtCommandSender = UnboundedSender<ExtensionUIRequest>;
pub type ExtCommandReceiver = UnboundedReceiver<ExtensionUIRequest>;

struct MainCommandUserData {
    reply_map: Arc<std::sync::Mutex<HashMap<String, MainReplySender>>>,
    main_command_tx: ExtCommandSender,
    extension_name: String,
}

host_fn!(send_main_command(user_data: MainCommandUserData; command: MainCommand) -> Option<Value> {
    let user_data = user_data.get()?;
    let user_data = user_data.lock().unwrap();
    tracing::debug!("Got extension command {:?}", command);
    match command.to_request(user_data.extension_name.clone()) {
        Ok(request) => {
            let reply_map = user_data.reply_map.clone();
            let (tx, mut rx) = unbounded_channel();
            {
                let mut reply_map = reply_map.lock().unwrap();
                reply_map.insert(request.channel.clone(), tx);
            }

            let main_command_tx = user_data.main_command_tx.clone();
            tracing::trace!("Sending request {:?}", request);
            main_command_tx.send(request.clone()).unwrap();

            tracing::trace!("waiting on response for {:?}", command);
            if let Some(resp) = block_on(rx.recv()) {
                {
                    let mut reply_map = reply_map.lock().unwrap();
                    reply_map.remove(&request.channel);
                }
                tracing::debug!("Got response for {:?}: {:?}", command, resp);
                return Ok(resp.data)
            } else {
                return Err(Error::msg("Failed to receive response"))
            }
        }
        Err(e) => {
            tracing::error!("Failed to map command {:?}", command);
            return Err(Error::new(e))
        }
    }
});

host_fn!(system_time() -> u64 {
    let start = SystemTime::now();
    let since_the_epoch = start
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
   Ok(since_the_epoch.as_secs())
});

struct SocketUserData {
    socks: Vec<LocalSocketStream>,
}

host_fn!(open_clientfd(user_data: SocketUserData; sock_path: String) -> i64 {
    let user_data = user_data.get()?;
    let mut user_data = user_data.lock().unwrap();

    if user_data.socks.len() > u8::MAX as usize {
        error!("Cannot open more sockets");
        return Ok(-1);
    }

    if let Ok(sock_path) = PathBuf::from_str(sock_path.as_str())?.to_fs_name::<GenericFilePath>() {
        if let Ok(sock) = LocalSocketStream::connect(sock_path) {
            user_data.socks.push(sock);
            return Ok((user_data.socks.len() - 1) as i64);
        } else {
            error!("Failed to connect to sock");
        }
    } else {
        error!("Failed to parse sock path from string")
    }
    Ok(-1)
});

host_fn!(write_sock(user_data: SocketUserData; sock_id: i64, buf: Vec<u8>) -> i64 {
    info!("Here");
    let user_data = user_data.get()?;
    let mut user_data = user_data.lock().unwrap();

    let sock = user_data.socks.get_mut(sock_id as usize);
    if let Some(sock) = sock {
        info!("Writing {:?}", buf);
        let res = sock.write_all(&buf);
        if let Err(e) = res {
            error!("Failed to write data to sock {}", e);
            return Ok(-1);
        } else {
            info!("Wrote all");
            return Ok(-1);
        }
    }

    error!("Invalid sock id");
    return Ok(-1);
});

host_fn!(read_sock(user_data: SocketUserData; sock_id: i64, read_len: u64) -> Vec<u8> {
    let user_data = user_data.get()?;
    let mut user_data = user_data.lock().unwrap();

    let sock = user_data.socks.get_mut(sock_id as usize);
    if let Some(sock) = sock {
        let mut read_len = read_len;
        if read_len == 0 || read_len > 1024 {
            read_len = 1024
        }

        info!("Reading {}", read_len);
        let mut ret = vec![0; read_len as usize];
        let read = sock.read(&mut ret);
        if let Ok(read) = read {
            if read >= 1024 {
                error!("Read out of bounds");
                return Ok(vec![]);
            }
            let mut ret = ret.to_vec();
            ret.truncate(read);
            return Ok(ret);
        }
    }

    error!("Invalid sock id");
    return Ok(vec![]);
});

#[derive(Debug, Clone)]
struct Extension {
    plugin: Arc<Mutex<Plugin>>,
    package_name: String,
    name: String,
    icon: String,
    author: Option<String>,
    version: String,
    path: PathBuf,
}

impl From<&Extension> for ExtensionDetail {
    #[tracing::instrument(level = "trace", skip(val))]
    fn from(val: &Extension) -> Self {
        ExtensionDetail {
            name: val.name.clone(),
            package_name: val.package_name.clone(),
            desc: None,
            author: val.author.clone(),
            version: val.version.clone(),
            has_started: true,
            entry: val.path.clone().to_str().unwrap().to_string(),
            preferences: vec![],
            extension_path: val.path.clone().to_str().unwrap().to_string(),
            extension_icon: Some(val.icon.clone()),
        }
    }
}

pub struct ExtensionHandler {
    extensions_path: String,
    main_command_rx: MainCommandReceiver,
    main_reply_tx: MainReplySender,
    ext_reply_tx: ExtReplySender,
    ext_command_tx: ExtCommandSender,
    extensions_map: HashMap<String, Extension>,
    reply_map: Arc<std::sync::Mutex<HashMap<String, MainReplySender>>>,
}

impl ExtensionHandler {
    #[tracing::instrument(level = "trace", skip(main_command_rx, main_reply_tx, ext_command_tx))]
    pub fn new(
        extensions_path: String,
        main_command_rx: MainCommandReceiver,
        main_reply_tx: MainReplySender,
        ext_command_tx: ExtCommandSender,
    ) -> Self {
        let (ext_reply_tx, mut ext_reply_rx) = unbounded_channel();
        let mut ret = Self {
            extensions_path: extensions_path.to_string(),
            main_command_rx,
            ext_reply_tx,
            ext_command_tx,
            main_reply_tx: main_reply_tx.clone(),
            extensions_map: HashMap::new(),
            reply_map: Arc::new(std::sync::Mutex::new(HashMap::new())),
        };
        ret.spawn_extensions();
        tokio::spawn(async move {
            let mut main_reply_tx = main_reply_tx.clone();
            Self::listen_ext_reply(&mut main_reply_tx, &mut ext_reply_rx).await;
        });
        ret
    }

    #[tracing::instrument(level = "trace", skip(self))]
    fn find_extension_manifests(&self) -> Vec<PathBuf> {
        let mut package_json_paths = Vec::new();

        if let Ok(entries) = fs::read_dir(self.extensions_path.clone()) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    // Check only the first level subdirectories
                    if let Ok(sub_entries) = fs::read_dir(&path) {
                        for sub_entry in sub_entries.flatten() {
                            let sub_path = sub_entry.path();
                            if sub_path.is_file()
                                && sub_path.file_name() == Some("package.json".as_ref())
                            {
                                package_json_paths.push(sub_path);
                            }
                        }
                    }
                } else if path.is_file() && path.file_name() == Some("package.json".as_ref()) {
                    package_json_paths.push(path);
                }
            }
        }
        package_json_paths
    }

    #[tracing::instrument(level = "trace", skip(self))]
    fn find_extensions(&self) -> Vec<ExtensionManifest> {
        let manifests = self.find_extension_manifests();
        let mut parsed_manifests = vec![];
        for manifest_path in manifests {
            if let Ok(contents) = fs::read(manifest_path.clone()) {
                match serde_json::from_slice::<ExtensionManifest>(&contents) {
                    Ok(mut manifest) => {
                        manifest.extension_entry = manifest_path
                            .parent()
                            .unwrap()
                            .join(manifest.extension_entry);
                        if !self.extensions_map.contains_key(&manifest.name)
                            && manifest.extension_entry.extension().unwrap() == "wasm"
                            && manifest.extension_entry.exists()
                        {
                            parsed_manifests.push(manifest);
                        }
                    }
                    Err(e) => tracing::error!("Error parsing manifest: {:?}", e),
                }
            }
        }

        parsed_manifests
    }

    #[tracing::instrument(level = "trace", skip(self))]
    fn spawn_extension(&self, manifest: ExtensionManifest) -> Extension {
        let url = Wasm::file(manifest.extension_entry.clone());
        let mut plugin_manifest = Manifest::new([url]);
        if let Some(permissions) = manifest.permissions {
            plugin_manifest = plugin_manifest
                .with_allowed_hosts(permissions.hosts.into_iter())
                .with_allowed_paths(permissions.paths.into_iter())
                .with_config_key("pid", format!("{}", process::id()));
        }

        let user_data = UserData::new(MainCommandUserData {
            reply_map: self.reply_map.clone(),
            main_command_tx: self.ext_command_tx.clone(),
            extension_name: manifest.name.clone(),
        });

        let sock_data = UserData::new(SocketUserData { socks: vec![] });
        let plugin = PluginBuilder::new(plugin_manifest)
            .with_wasi(true)
            .with_function(
                "send_main_command",
                [PTR],
                [PTR],
                user_data,
                send_main_command,
            )
            .with_function("system_time", [], [PTR], UserData::default(), system_time)
            .with_function(
                "open_clientfd",
                [PTR],
                [I64],
                sock_data.clone(),
                open_clientfd,
            )
            .with_function(
                "write_sock",
                [I64, PTR],
                [I64],
                sock_data.clone(),
                write_sock,
            )
            .with_function("read_sock", [I64, I64], [PTR], sock_data, read_sock)
            .build()
            .unwrap();

        Extension {
            plugin: Arc::new(Mutex::new(plugin)),
            name: manifest.display_name,
            package_name: manifest.name,
            icon: manifest.icon,
            author: manifest.author,
            version: manifest.version,
            path: manifest.extension_entry.clone(),
        }
    }

    #[tracing::instrument(level = "trace", skip(self))]
    fn spawn_extensions(&mut self) {
        let manifests = self.find_extensions();
        for manifest in manifests {
            let package_name = manifest.name.clone();
            let extension = self.spawn_extension(manifest);
            let plugin = extension.plugin.clone();
            thread::spawn(move || {
                let mut plugin = block_on(plugin.lock());
                tracing::trace!("Callign entry");
                plugin.call::<(), ()>("entry", ()).unwrap();
            });
            self.extensions_map.insert(package_name, extension);
        }
    }

    #[tracing::instrument(level = "trace", skip(self))]
    fn get_extensions(&self, package_name: String) -> Vec<&Extension> {
        let mut plugins = vec![];
        if package_name.is_empty() {
            plugins.extend(self.extensions_map.values());
        } else {
            let plugin = self.extensions_map.get(&package_name);
            if let Some(plugin) = plugin {
                plugins.push(plugin);
            }
        }
        plugins
    }

    fn sanitize_response(response: &mut ExtensionCommandResponse, package_name: String) {
        match response {
            ExtensionCommandResponse::GetProviderScopes(_) => {}
            ExtensionCommandResponse::GetExtensionContextMenu(_) => {}
            ExtensionCommandResponse::GetAccounts(accounts) => {
                for account in accounts {
                    account.package_name = package_name.clone();
                }
            }
            ExtensionCommandResponse::PerformAccountLogin => {}
            ExtensionCommandResponse::ExtraExtensionEvent(_) => {}
            ExtensionCommandResponse::Empty => {}
        }
    }

    #[tracing::instrument(level = "trace", skip(self))]
    async fn execute_command(
        &mut self,
        channel: String,
        command: ExtensionCommand,
    ) -> MoosyncResult<()> {
        let (package_name, fn_name, args) = command.to_plugin_call();
        let plugins = self.get_extensions(package_name.clone());

        let plugins_len = plugins.len();
        if plugins_len > 1 {
            let ext_reply_tx = self.ext_reply_tx.clone();
            ext_reply_tx
                .send((
                    channel.clone(),
                    package_name.clone(),
                    ExtensionCommandResponse::Empty,
                ))
                .unwrap();
        }

        for extension in plugins {
            let command = command.clone();
            let args = args.clone();
            let extension = extension.clone();
            let ext_reply_tx = self.ext_reply_tx.clone();
            let channel = channel.clone();
            let package_name = package_name.clone();
            thread::spawn(move || {
                let mut plugin = block_on(extension.plugin.lock());
                let res = plugin.call::<_, Value>(fn_name, args.clone());
                match res {
                    Ok(res) => match command.parse_response(res) {
                        Ok(mut parsed_response) => {
                            Self::sanitize_response(&mut parsed_response, package_name.clone());
                            if plugins_len == 1 {
                                ext_reply_tx
                                    .send((channel, package_name, parsed_response))
                                    .unwrap();
                            }
                        }
                        Err(e) => {
                            tracing::error!(
                                "Failed to parse response from extension {} {:?}",
                                package_name,
                                e
                            );
                            if plugins_len == 1 {
                                ext_reply_tx
                                    .send((channel, package_name, ExtensionCommandResponse::Empty))
                                    .unwrap();
                            }
                        }
                    },
                    Err(e) => {
                        tracing::error!(
                            "Extension {} responsed with error: {:?}",
                            extension.package_name,
                            e
                        );
                        if plugins_len == 1 {
                            ext_reply_tx
                                .send((
                                    channel,
                                    extension.package_name,
                                    ExtensionCommandResponse::Empty,
                                ))
                                .unwrap();
                        }
                    }
                }
            });
        }

        Ok(())
    }

    #[tracing::instrument(level = "trace", skip(self))]
    fn remove_extension(&mut self, package_name: &String) {
        self.extensions_map.remove(package_name);
    }

    #[tracing::instrument(level = "trace", skip(self))]
    async fn handle_extension_command(&mut self, data: &GenericExtensionHostRequest<Value>) {
        let r#type = data.type_.as_str();
        let channel = data.channel.clone();
        if let Some(data) = &data.data {
            let command = ExtensionCommand::try_from((r#type, data));
            if let Ok(command) = command {
                tracing::debug!("Executing command {:?}", command);
                self.execute_command(channel, command).await.unwrap();
                return;
            }
        }

        self.ext_reply_tx
            .send((channel, String::new(), ExtensionCommandResponse::Empty))
            .unwrap();
    }

    #[tracing::instrument(level = "trace", skip(self))]
    async fn handle_runner_command(
        &mut self,
        resp: &GenericExtensionHostRequest<Value>,
    ) -> MoosyncResult<()> {
        let resp = resp.clone();
        let r#type = resp.type_.as_str();
        let channel = resp.channel.clone();
        if let Ok(command) = RunnerCommand::try_from((r#type, &resp.data.unwrap_or(Value::Null))) {
            let ret = match command {
                RunnerCommand::GetInstalledExtensions => {
                    let extensions = self
                        .extensions_map
                        .values()
                        .map(|e| e.into())
                        .collect::<Vec<ExtensionDetail>>();
                    tracing::debug!("Extension map: {:?}, {:?}", self.extensions_map, extensions);
                    serde_json::to_value(extensions).unwrap()
                }
                RunnerCommand::FindNewExtensions => {
                    self.spawn_extensions();
                    Value::Null
                }
                RunnerCommand::GetExtensionIcon(p) => {
                    if let Some(extension) = self.get_extensions(p.package_name).first() {
                        Value::String(extension.icon.clone())
                    } else {
                        Value::Null
                    }
                }
                RunnerCommand::ToggleExtensionStatus(_) => todo!(),
                RunnerCommand::RemoveExtension(p) => {
                    self.remove_extension(&p.package_name);
                    Value::Null
                }
                RunnerCommand::StopProcess => {
                    std::process::exit(0);
                }
                RunnerCommand::GetDisplayName(p) => {
                    if let Some(extension) = self.get_extensions(p.package_name).first() {
                        Value::String(extension.name.clone())
                    } else {
                        Value::Null
                    }
                }
            };
            let response = GenericExtensionHostRequest {
                channel,
                type_: String::new(),
                data: Some(ret),
            };
            self.main_reply_tx.send(response).unwrap();
            return Ok(());
        }
        Err("Not a runner command".into())
    }

    #[tracing::instrument(level = "trace", skip(self))]
    fn handle_reply(&self, resp: &GenericExtensionHostRequest<Value>) -> MoosyncResult<()> {
        let reply_map = self.reply_map.lock().unwrap();

        tracing::trace!("Inside reply {:?} {:?}", reply_map, resp);
        if let Some(tx) = reply_map.get(&resp.channel) {
            tracing::trace!("Handling as reply");
            tx.send(resp.clone()).unwrap();
            return Ok(());
        }

        Err("Not a reply".into())
    }

    #[tracing::instrument(level = "trace", skip(self))]
    pub async fn listen_commands(&mut self) {
        loop {
            if let Some(resp) = &self.main_command_rx.recv().await {
                tracing::debug!("Got command {:?}", resp);

                if self.handle_reply(resp).is_ok() {
                    continue;
                }

                if self.handle_runner_command(resp).await.is_ok() {
                    continue;
                }

                self.handle_extension_command(resp).await
            }
        }
    }

    #[tracing::instrument(level = "trace", skip(main_reply_tx, ext_reply_rx))]
    pub async fn listen_ext_reply(
        main_reply_tx: &mut MainReplySender,
        ext_reply_rx: &mut ExtReplyReceiver,
    ) {
        loop {
            if let Some((channel, package_name, res)) = ext_reply_rx.recv().await {
                let response = if package_name.is_empty() {
                    GenericExtensionHostRequest {
                        channel,
                        type_: String::new(),
                        data: Some(serde_json::to_value(res).unwrap()),
                    }
                } else {
                    let mut data_map = HashMap::new();
                    data_map.insert(package_name.clone(), res);
                    GenericExtensionHostRequest {
                        channel,
                        type_: String::new(),
                        data: Some(serde_json::to_value(data_map).unwrap()),
                    }
                };
                main_reply_tx.send(response).unwrap();
            }
        }
    }
}
