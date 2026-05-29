pub mod config;
pub mod demo;
pub mod doctor;
pub mod export;
pub mod list;
pub mod resume;
pub mod scan;
pub mod show;

pub use config::{run_config_get, run_config_set};
pub use demo::run_demo;
pub use doctor::run_doctor;
pub use export::run_export;
pub use list::run_list;
pub use resume::run_resume;
pub use scan::run_scan;
pub use show::run_show;

use anyhow::Result;

pub async fn run_serve(port: Option<u16>) -> Result<()> {
    let config = ccmemo_core::service::config::Config::load()?;
    ccmemo_core::server::start_server(&config, port).await?;
    Ok(())
}
