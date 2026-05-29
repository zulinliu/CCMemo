use std::path::PathBuf;

use crate::domain::error::{AppError, Result};

#[derive(Debug, Clone)]
pub struct Config {
    pub claude_config_dir: PathBuf,
    pub db_path: PathBuf,
    pub export_dir: PathBuf,
}

impl Config {
    pub fn load() -> Result<Self> {
        let home = dirs::home_dir()
            .ok_or_else(|| AppError::Config("Cannot find home directory".into()))?;

        let claude_config_dir = std::env::var("CCMEMO_CLAUDE_CONFIG_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| home.join(".claude"));

        let db_path = std::env::var("CCMEMO_DB_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                let xdg =
                    dirs::data_local_dir().unwrap_or_else(|| home.join(".local").join("share"));
                xdg.join("ccmemo").join("ccmemo.db")
            });

        let export_dir = std::env::var("CCMEMO_EXPORT_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| home.join("ccmemo-exports"));

        Ok(Self {
            claude_config_dir,
            db_path,
            export_dir,
        })
    }
}
