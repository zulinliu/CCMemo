use anyhow::Result;
use ccmemo_core::service::config::Config;

pub fn run_config_get(key: &str) -> Result<()> {
    let config = Config::load()?;

    match key {
        "claude_config_dir" | "config_dir" => println!("{}", config.claude_config_dir.display()),
        "db_path" | "database" => println!("{}", config.db_path.display()),
        "export_dir" => println!("{}", config.export_dir.display()),
        _ => println!("Unknown key: {key}. Available: claude_config_dir, db_path, export_dir"),
    }

    Ok(())
}

pub fn run_config_set(key: &str, value: &str) -> Result<()> {
    match key {
        "claude_config_dir" => {
            println!("Set CCCMEMO_CLAUDE_CONFIG_DIR={value}");
            println!("To persist: export CCCMEMO_CLAUDE_CONFIG_DIR=\"{value}\" in your shell profile");
        }
        "db_path" | "database" => {
            println!("Set CCCMEMO_DB_PATH={value}");
            println!("To persist: export CCCMEMO_DB_PATH=\"{value}\" in your shell profile");
        }
        "export_dir" => {
            println!("Set CCCMEMO_EXPORT_DIR={value}");
            println!("To persist: export CCCMEMO_EXPORT_DIR=\"{value}\" in your shell profile");
        }
        _ => println!("Unknown key: {key}. Available: claude_config_dir, db_path, export_dir"),
    }

    Ok(())
}
