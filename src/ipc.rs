use std::{io::ErrorKind, path::PathBuf, sync::Arc};

use common_types::{GenericExtensionHostRequest, MoosyncResult};
use interprocess::local_socket::{
    tokio::Stream, traits::tokio::Stream as _, GenericFilePath, ToFsName,
};
use serde_json::Value;
use tokio::{
    io::{split, AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader, ReadHalf, WriteHalf},
    join,
    sync::Mutex,
};

use crate::extension_handler::{ExtCommandReceiver, MainCommandSender, MainReplyReceiver};

pub struct SocketHandler {
    ipc_path: PathBuf,
    main_command_tx: MainCommandSender,
    main_reply_rx: Arc<Mutex<MainReplyReceiver>>,
    ext_command_rx: Arc<Mutex<ExtCommandReceiver>>,
}

impl SocketHandler {
    #[tracing::instrument(
        level = "trace",
        skip(ipc_path, main_command_tx, main_reply_rx, ext_command_rx)
    )]
    pub fn new(
        ipc_path: String,
        main_command_tx: MainCommandSender,
        main_reply_rx: MainReplyReceiver,
        ext_command_rx: ExtCommandReceiver,
    ) -> Self {
        Self {
            ipc_path: PathBuf::from(ipc_path),
            main_command_tx,
            main_reply_rx: Arc::new(Mutex::new(main_reply_rx)),
            ext_command_rx: Arc::new(Mutex::new(ext_command_rx)),
        }
    }

    #[tracing::instrument(level = "trace", skip(self))]
    pub async fn listen(&self) {
        let ipc_path = self.ipc_path.clone();

        let res = Stream::connect(ipc_path.to_fs_name::<GenericFilePath>().unwrap())
            .await
            .unwrap();

        let main_reply_rx = self.main_reply_rx.clone();
        let ext_command_rx = self.ext_command_rx.clone();
        let connection_handler =
            ConnectionHandler::new(&res, &self.main_command_tx, main_reply_rx, ext_command_rx);
        connection_handler.listen().await.unwrap();
    }
}

struct ConnectionHandler<'a> {
    read_conn: Arc<Mutex<ReadHalf<&'a Stream>>>,
    write_conn: Arc<Mutex<WriteHalf<&'a Stream>>>,
    main_command_tx: &'a MainCommandSender,
    main_reply_rx: Arc<Mutex<MainReplyReceiver>>,
    ext_command_rx: Arc<Mutex<ExtCommandReceiver>>,
}

impl<'a> ConnectionHandler<'a> {
    #[tracing::instrument(
        level = "trace",
        skip(conn, main_command_tx, main_reply_rx, ext_command_rx)
    )]
    pub fn new(
        conn: &'a Stream,
        main_command_tx: &'a MainCommandSender,
        main_reply_rx: Arc<Mutex<MainReplyReceiver>>,
        ext_command_rx: Arc<Mutex<ExtCommandReceiver>>,
    ) -> Self {
        let (read_conn, write_conn) = split(conn);

        Self {
            read_conn: Arc::new(Mutex::new(read_conn)),
            write_conn: Arc::new(Mutex::new(write_conn)),
            main_command_tx,
            main_reply_rx,
            ext_command_rx,
        }
    }

    #[tracing::instrument(level = "trace", skip(self, buf, old_buf))]
    async fn read_lines(&self, buf: &[u8], old_buf: &[u8]) -> (Vec<Vec<u8>>, Vec<u8>) {
        let mut reader = BufReader::new(buf);

        let mut lines = vec![];
        let mut remaining = vec![];

        let mut i = 0;

        loop {
            let mut parsed_buf = vec![];
            let read = reader.read_until(b'\n', &mut parsed_buf).await.unwrap();
            if read == 0 {
                break;
            }

            if i == 0 && !old_buf.is_empty() {
                parsed_buf = [old_buf, &parsed_buf].concat();
            }

            if !parsed_buf.ends_with(b"\n") {
                remaining = parsed_buf;
                break;
            }

            lines.push(parsed_buf);
            i += 1;
        }

        (lines, remaining)
    }

    #[tracing::instrument(level = "trace", skip(self))]
    async fn read_fixed_buf(&self) -> MoosyncResult<(Vec<u8>, usize)> {
        let mut buf = [0u8; 1024];

        let mut conn = self.read_conn.lock().await;

        let res = conn.read(&mut buf).await;

        if let Err(e) = res {
            return Err("Failed to read from socket".into());
        }

        let n = res.unwrap();
        Ok((buf[..n].to_vec(), n))
    }

    #[tracing::instrument(level = "trace", skip(self))]
    async fn listen_main_commands(&self) -> MoosyncResult<()> {
        let mut old_buf = vec![];
        loop {
            match self.read_fixed_buf().await {
                Ok((buf, n)) => {
                    if n == 0 {
                        return Err("Empty read from socket. Probably EOF".into());
                    }
                    let (lines, remaining) = self.read_lines(&buf, &old_buf).await;
                    old_buf = remaining;

                    for line in lines {
                        let parsed: Result<GenericExtensionHostRequest<Value>, serde_json::Error> =
                            serde_json::from_slice(&line);
                        match parsed {
                            Ok(data) => {
                                self.main_command_tx.send(data).unwrap();
                            }
                            Err(err) => {
                                tracing::info!("Failed to parse line as json: {:?}", err);
                            }
                        }
                    }
                }
                Err(err) => {
                    return Err(err);
                }
            }
        }
    }

    #[tracing::instrument(level = "trace", skip(self))]
    pub async fn listen_main_reply(&self) {
        let mut main_reply_rx = self.main_reply_rx.lock().await;
        loop {
            if let Some(res) = main_reply_rx.recv().await {
                let mut writer = self.write_conn.lock().await;
                tracing::info!("Writing back respose {:?}", serde_json::to_string(&res));
                let mut res = serde_json::to_vec(&res).unwrap();
                res.push(b'\n');
                if let Err(e) = writer.write(&res).await {
                    panic!("Failed to write to socket: {:?}", e)
                }
                writer.flush().await.unwrap();
                tracing::info!("Wrote response");
            }
        }
    }

    #[tracing::instrument(level = "trace", skip(self))]
    pub async fn listen_ext_command(&self) {
        let mut ext_command_rx = self.ext_command_rx.lock().await;
        loop {
            if let Some(res) = ext_command_rx.recv().await {
                let mut writer = self.write_conn.lock().await;
                tracing::info!("Writing ext command {:?}", res);
                let mut res = serde_json::to_vec(&res).unwrap();
                res.push(b'\n');
                if let Err(e) = writer.write(&res).await {
                    panic!("Failed to write to socket: {:?}", e)
                }
                writer.flush().await.unwrap();
                tracing::info!("Wrote command");
            }
        }
    }

    #[tracing::instrument(level = "trace", skip(self))]
    pub async fn listen(&self) -> Result<(), &str> {
        let _ = join!(
            self.listen_main_commands(),
            self.listen_main_reply(),
            self.listen_ext_command()
        );
        Ok(())
    }
}
