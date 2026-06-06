use anyhow::Result;
use ccmemo_core::service::config::Config;
use ccmemo_core::service::project_discovery::ProjectDiscovery;
use ccmemo_core::service::session_indexer::SessionIndexer;
use ccmemo_core::storage::sqlite::Database;

pub fn run_scan(full: bool) -> Result<()> {
    let config = Config::load()?;
    let db = Database::open(&config.db_path)?;

    println!("Scanning for Claude Code sessions...");
    println!("  Config dir: {}", config.claude_config_dir.display());

    let discovery = ProjectDiscovery::new(&config.claude_config_dir);
    let projects = discovery.discover_all()?;

    if projects.is_empty() {
        println!(
            "No projects found in {}",
            config.claude_config_dir.display()
        );
        return Ok(());
    }

    println!("  Found {} project(s)", projects.len());
    println!();

    let indexer = SessionIndexer::new(&db);
    let mut total_files = 0usize;
    let mut total_sessions = 0usize;
    let mut total_events = 0usize;
    let mut total_errors = 0usize;

    for project in &projects {
        let project_name = project
            .real_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or(&project.encoded_folder);
        println!(
            "  Scanning {project_name} ({} files)...",
            project.jsonl_files.len()
        );

        match indexer.index_project(project, full) {
            Ok(result) => {
                total_files += result.files_scanned;
                total_sessions += result.sessions_indexed + result.sessions_updated;
                total_events += result.events_indexed;
                total_errors += result.errors.len();

                for err in &result.errors {
                    eprintln!("    Warning: {err}");
                }

                if result.sessions_indexed > 0 || result.sessions_updated > 0 {
                    println!(
                        "    {} sessions indexed, {} updated, {} events",
                        result.sessions_indexed, result.sessions_updated, result.events_indexed
                    );
                }
            }
            Err(e) => {
                eprintln!("    Error scanning {}: {e}", project.encoded_folder);
                total_errors += 1;
            }
        }
    }

    println!();
    println!("Scan complete:");
    println!("  Files scanned: {total_files}");
    println!("  Sessions processed: {total_sessions}");
    println!("  Events indexed: {total_events}");

    if total_errors > 0 {
        println!("  Errors: {total_errors}");
    }

    println!();
    println!("Run 'ccmemo list' to see indexed sessions.");

    Ok(())
}
