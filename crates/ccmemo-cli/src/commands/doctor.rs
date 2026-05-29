use anyhow::Result;
use ccmemo_core::service::config::Config;
use ccmemo_core::storage::sqlite::Database;
use ccmemo_core::storage::SessionRepository;

pub fn run_doctor() -> Result<()> {
    let term = console::Term::stdout();

    let title = console::Style::new().bold().apply_to("CCMemo Doctor").to_string();
    term.write_line(&title)?;
    term.write_line("")?;

    let mut all_ok = true;

    // Check config
    term.write_line("Checking configuration...")?;
    match Config::load() {
        Ok(config) => {
            term.write_line(&format!("  {} Config loaded", console::Style::new().green().apply_to("✓")))?;
            term.write_line(&format!("    Claude config dir: {}", config.claude_config_dir.display()))?;
            term.write_line(&format!("    Database path:     {}", config.db_path.display()))?;
            term.write_line(&format!("    Export dir:        {}", config.export_dir.display()))?;

            if config.claude_config_dir.exists() {
                term.write_line(&format!("  {} Claude config dir exists", console::Style::new().green().apply_to("✓")))?;
            } else {
                term.write_line(&format!("  {} Claude config dir not found", console::Style::new().red().apply_to("✗")))?;
                all_ok = false;
            }

            term.write_line("")?;
            term.write_line("Checking database...")?;
            match Database::open(&config.db_path) {
                Ok(db) => {
                    term.write_line(&format!("  {} Database opened", console::Style::new().green().apply_to("✓")))?;
                    match db.count_sessions() {
                        Ok(count) => term.write_line(&format!("    Sessions: {count}"))?,
                        Err(e) => {
                            term.write_line(&format!("  {} Cannot count sessions: {e}", console::Style::new().red().apply_to("✗")))?;
                            all_ok = false;
                        }
                    }
                }
                Err(e) => {
                    term.write_line(&format!("  {} Cannot open database: {e}", console::Style::new().red().apply_to("✗")))?;
                    all_ok = false;
                }
            }

            // Check projects dir
            term.write_line("")?;
            term.write_line("Checking Claude projects...")?;
            let projects_dir = config.claude_config_dir.join("projects");
            if projects_dir.exists() {
                let count = std::fs::read_dir(&projects_dir)?
                    .filter_map(|e| e.ok())
                    .filter(|e| e.path().is_dir())
                    .count();
                term.write_line(&format!("  {} Found {count} project directories", console::Style::new().green().apply_to("✓")))?;
            } else {
                term.write_line(&format!("  {} Projects directory not found", console::Style::new().yellow().apply_to("⚠")))?;
            }
        }
        Err(e) => {
            term.write_line(&format!("  {} Cannot load config: {e}", console::Style::new().red().apply_to("✗")))?;
            all_ok = false;
        }
    }

    term.write_line("")?;
    if all_ok {
        let msg = console::Style::new().green().bold().apply_to("All checks passed!").to_string();
        term.write_line(&msg)?;
    } else {
        let msg = console::Style::new().yellow().bold().apply_to("Some checks failed. See above for details.").to_string();
        term.write_line(&msg)?;
    }

    Ok(())
}
