use std::{collections::HashMap, fs, path::PathBuf, sync::Arc, thread};

use common_types::{
    ExtensionCommand, ExtensionCommandResponse, ExtensionDetail, ExtensionManifest,
    GenericExtensionHostRequest, MoosyncResult, RunnerCommand,
};
use extism::{host_fn, Manifest, Plugin, PluginBuilder, UserData, ValType, Wasm};
use futures::executor::block_on;
use serde_json::Value;
use tokio::sync::{
    mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender},
    Mutex,
};

pub type MainCommandReceiver = UnboundedReceiver<GenericExtensionHostRequest<Value>>;
pub type MainCommandSender = UnboundedSender<GenericExtensionHostRequest<Value>>;

pub type ExtReplyReceiver = UnboundedReceiver<(String, ExtensionCommandResponse)>;
pub type ExtReplySender = UnboundedSender<(String, ExtensionCommandResponse)>;

pub type MainReplySender = MainCommandSender;
pub type MainReplyReceiver = MainCommandReceiver;

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
    extensions_map: HashMap<String, Extension>,
}

impl ExtensionHandler {
    pub fn new(
        extensions_path: &str,
        main_command_rx: MainCommandReceiver,
        main_reply_tx: MainReplySender,
    ) -> Self {
        let (ext_reply_tx, mut ext_reply_rx) = unbounded_channel();
        let mut ret = Self {
            extensions_path: extensions_path.to_string(),
            main_command_rx,
            ext_reply_tx,
            main_reply_tx: main_reply_tx.clone(),
            extensions_map: HashMap::new(),
        };
        ret.spawn_extensions();
        tokio::spawn(async move {
            let mut main_reply_tx = main_reply_tx.clone();
            Self::listen_ext_reply(&mut main_reply_tx, &mut ext_reply_rx).await;
        });
        ret
    }

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
                        println!("Found manifests {:?}", manifest);
                        if manifest.extension_entry.extension().unwrap() == "wasm"
                            && manifest.extension_entry.exists()
                        {
                            parsed_manifests.push(manifest);
                        }
                    }
                    Err(e) => println!("Error parsing manifest: {:?}", e),
                }
            }
        }

        println!("Parsed manifests {:?}", parsed_manifests);
        parsed_manifests
    }

    fn spawn_extension(&self, manifest: ExtensionManifest) -> Extension {
        let url = Wasm::file(manifest.extension_entry.clone());
        let mut plugin_manifest = Manifest::new([url]);
        if let Some(permissions) = manifest.permissions {
            plugin_manifest = plugin_manifest
                .with_allowed_hosts(permissions.hosts.into_iter())
                .with_allowed_paths(permissions.paths.into_iter());
        }

        let plugin = PluginBuilder::new(plugin_manifest)
            .with_wasi(true)
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

    fn spawn_extensions(&mut self) {
        let manifests = self.find_extensions();
        for manifest in manifests {
            let package_name = manifest.name.clone();
            let extension = self.spawn_extension(manifest);
            let plugin = extension.plugin.clone();
            tokio::spawn(async move {
                let mut plugin = plugin.lock().await;
                plugin.call::<(), ()>("entry", ())
            });
            self.extensions_map.insert(package_name, extension);
        }

        println!("Spawned extensions {:?}", self.extensions_map);
    }

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

    async fn execute_command(
        &mut self,
        channel: String,
        command: ExtensionCommand,
    ) -> MoosyncResult<()> {
        let (package_name, fn_name, args) = command.to_plugin_call();
        let plugins = self.get_extensions(package_name);

        let plugins_len = plugins.len();
        if plugins_len > 1 {
            let ext_reply_tx = self.ext_reply_tx.clone();
            ext_reply_tx
                .send((channel.clone(), ExtensionCommandResponse::Empty))
                .unwrap();
        }
        println!("Got extensions {:?}", plugins);
        for extension in plugins {
            let command = command.clone();
            let args = args.clone();
            let extension = extension.clone();
            let ext_reply_tx = self.ext_reply_tx.clone();
            let channel = channel.clone();
            thread::spawn(move || {
                let mut plugin = block_on(extension.plugin.lock());
                let res = plugin.call::<_, Value>(fn_name, args.clone());
                match res {
                    Ok(res) => {
                        let parsed_response = command.parse_response(res);
                        if plugins_len == 1 {
                            ext_reply_tx.send((channel, parsed_response)).unwrap();
                        }
                    }
                    Err(e) => {
                        println!("Extension responsed with error: {:?}", e);
                        if plugins_len == 1 {
                            ext_reply_tx
                                .send((channel, ExtensionCommandResponse::Empty))
                                .unwrap();
                        }
                    }
                }
            });
        }

        Ok(())
    }

    fn remove_extension(&mut self, package_name: &String) {
        self.extensions_map.remove(package_name);
    }

    async fn handle_extension_command(&mut self, data: &GenericExtensionHostRequest<Value>) {
        let r#type = data.type_.as_str();
        let channel = data.channel.clone();
        if let Some(data) = &data.data {
            let command = ExtensionCommand::try_from((r#type, data));
            if let Ok(command) = command {
                println!("Executing command");
                self.execute_command(channel, command).await.unwrap();
                return;
            }
        }

        self.ext_reply_tx
            .send((channel, ExtensionCommandResponse::Empty))
            .unwrap();
    }

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
                    println!("Extension map: {:?}, {:?}", self.extensions_map, extensions);
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

    pub async fn listen_commands(&mut self) {
        loop {
            if let Some(resp) = &self.main_command_rx.recv().await {
                println!("Got command {:?}", resp);
                if self.handle_runner_command(resp).await.is_ok() {
                    continue;
                }
                self.handle_extension_command(resp).await
            }
        }
    }

    pub async fn listen_ext_reply(
        main_reply_tx: &mut MainReplySender,
        ext_reply_rx: &mut ExtReplyReceiver,
    ) {
        loop {
            if let Some((channel, res)) = ext_reply_rx.recv().await {
                let response = GenericExtensionHostRequest {
                    channel,
                    type_: String::new(),
                    data: Some(serde_json::to_value(res).unwrap()),
                };
                main_reply_tx.send(response).unwrap();
            }
        }
    }
}
