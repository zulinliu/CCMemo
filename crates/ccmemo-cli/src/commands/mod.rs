pub mod demo;
pub mod list;

pub use demo::run_demo;
pub use list::run_list;

use anyhow::Result;

pub fn run_scan(_full: bool) -> Result<()> {
    println!("Scan command not yet implemented. Run 'ccmemo demo' to load sample data.");
    Ok(())
}

pub fn run_show(_session_id: &str) -> Result<()> {
    println!("Show command not yet implemented.");
    Ok(())
}

pub fn run_resume(_session_id: &str) -> Result<()> {
    println!("Resume command not yet implemented.");
    Ok(())
}

pub fn run_export(_session_id: &str, _format: &str, _safe: bool) -> Result<()> {
    println!("Export command not yet implemented.");
    Ok(())
}

pub fn run_serve(_port: Option<u16>) -> Result<()> {
    println!("Web UI server will be available in Phase 2.");
    println!("For now, use CLI commands: scan, list, show, export, demo");
    Ok(())
}

pub fn run_config_get(_key: &str) -> Result<()> {
    println!("Config get not yet implemented.");
    Ok(())
}

pub fn run_config_set(_key: &str, _value: &str) -> Result<()> {
    println!("Config set not yet implemented.");
    Ok(())
}

pub fn run_doctor() -> Result<()> {
    println!("Doctor command not yet implemented.");
    Ok(())
}
