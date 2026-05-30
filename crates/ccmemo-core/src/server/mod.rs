pub mod app;
pub mod auth;
pub mod handlers;

use std::collections::HashSet;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};

use sha2::{Digest, Sha256};
use tokio::net::TcpListener;

use crate::domain::error::Result;
use crate::service::config::Config;
use crate::storage::sqlite::Database;

pub struct ServerState {
    pub db: Arc<Database>,
    pub password_hash: String,
    pub active_sessions: Mutex<HashSet<String>>,
}

fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let bytes = hasher.finalize();
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

pub async fn start_server(config: &Config, port: Option<u16>) -> Result<()> {
    let db = Database::open(&config.db_path)?;
    let password_hash = hash_password(&config.password);

    let state = Arc::new(ServerState {
        db: Arc::new(db),
        password_hash,
        active_sessions: Mutex::new(HashSet::new()),
    });

    let app = app::create_app(state);

    let bind_addr = port.unwrap_or(0u16);
    let addr = SocketAddr::from(([0, 0, 0, 0], bind_addr));
    let listener = TcpListener::bind(addr).await?;
    let actual_port = listener.local_addr()?.port();

    let url = format!("http://127.0.0.1:{actual_port}");

    println!("CCMemo server running at {url}");
    eprintln!("CCMEMO_URL={url}");

    axum::serve(listener, app).await?;

    Ok(())
}
