use anyhow::Result;
use ccmemo_core::service::config::Config;
use ccmemo_core::service::demo::DemoService;
use ccmemo_core::storage::sqlite::Database;

pub fn run_demo() -> Result<()> {
    let config = Config::load()?;
    let db = Database::open(&config.db_path)?;
    let service = DemoService::new(&db);

    let count = service.import_demo()?;
    println!("Successfully imported {count} demo sessions.");
    println!("Run 'ccmemo list' to see them.");
    Ok(())
}
