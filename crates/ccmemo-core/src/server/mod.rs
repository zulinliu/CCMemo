pub mod app;
pub mod auth;
pub mod handlers;

use std::net::SocketAddr;
use std::sync::Arc;

use tokio::net::TcpListener;

use crate::domain::error::Result;
use crate::service::config::Config;
use crate::storage::sqlite::Database;

pub struct ServerState {
    pub db: Arc<Database>,
    pub token: String,
}

pub async fn start_server(config: &Config, port: Option<u16>) -> Result<()> {
    let db = Database::open(&config.db_path)?;
    let token = uuid::Uuid::new_v4().to_string();

    let state = Arc::new(ServerState {
        db: Arc::new(db),
        token: token.clone(),
    });

    let app = app::create_app(state);

    let bind_port = port.unwrap_or(0);
    let addr = SocketAddr::from(([127, 0, 0, 1], bind_port));
    let listener = TcpListener::bind(addr).await?;
    let actual_port = listener.local_addr()?.port();

    let url = format!("http://127.0.0.1:{actual_port}");

    println!("CCMemo server running at {url}");
    eprintln!("CCMEMO_TOKEN={token}");
    eprintln!("CCMEMO_URL={url}");

    axum::serve(listener, app).await?;

    Ok(())
}
