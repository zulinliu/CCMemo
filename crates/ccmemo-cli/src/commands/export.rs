use std::fs;
use std::path::Path;

use anyhow::Result;
use ccmemo_core::service::config::Config;
use ccmemo_core::storage::sqlite::Database;
use ccmemo_core::storage::{EventRepository, SessionRepository};

pub fn run_export(session_id: &str, format: &str, _safe: bool) -> Result<()> {
    let config = Config::load()?;
    let db = Database::open(&config.db_path)?;

    let session = db.get_session(session_id)?
        .ok_or_else(|| anyhow::anyhow!("Session '{}' not found", session_id))?;

    match format {
        "markdown" | "md" => export_markdown(&session, &db, &config)?,
        "jsonl" => export_jsonl(&session)?,
        _ => anyhow::bail!("Unsupported format: {format}. Use 'markdown' or 'jsonl'."),
    }

    Ok(())
}

fn export_markdown(
    session: &ccmemo_core::domain::types::SessionMetadata,
    db: &Database,
    config: &Config,
) -> Result<()> {
    fs::create_dir_all(&config.export_dir)?;

    let filename = format!(
        "{}-{}.md",
        session.started_at[..10].replace('-', ""),
        &session.session_id[..8.min(session.session_id.len())]
    );
    let output_path = config.export_dir.join(&filename);

    let mut md = String::new();
    md.push_str(&format!("# {}\n\n", session.auto_title));
    md.push_str(&format!("**Session ID:** {}\n", session.session_id));
    md.push_str(&format!("**Status:** {}\n", session.status));
    md.push_str(&format!("**Started:** {}\n", session.started_at));
    if let Some(ref ended) = session.ended_at {
        md.push_str(&format!("**Ended:** {ended}\n"));
    }
    if let Some(ref model) = session.model {
        md.push_str(&format!("**Model:** {model}\n"));
    }
    if let Some(ref branch) = session.branch {
        md.push_str(&format!("**Branch:** {branch}\n"));
    }
    md.push_str(&format!("**Events:** {}\n", db.get_event_count(&session.session_id)?));
    md.push_str("\n---\n\n");

    // Export events
    let events = db.get_events(&session.session_id, None, 10000)?;
    let mut last_type = String::new();

    for event in &events.items {
        if event.event_type != last_type {
            if !last_type.is_empty() {
                md.push('\n');
            }
            last_type = event.event_type.clone();
        }

        match event.event_type.as_str() {
            "user" => {
                md.push_str(&format!("## User\n\n"));
                if let Some(ref preview) = event.preview {
                    md.push_str(preview);
                }
                md.push_str("\n\n");
            }
            "assistant" => {
                md.push_str(&format!("## Assistant\n\n"));
                if let Some(ref preview) = event.preview {
                    md.push_str(preview);
                }
                md.push_str("\n\n");
            }
            "queue-operation" => {
                // Skip queue operations in markdown export
            }
            _ => {
                if let Some(ref preview) = event.preview {
                    md.push_str(&format!("**[{ty}]** {preview}\n\n", ty = event.event_type));
                }
            }
        }
    }

    fs::write(&output_path, &md)?;
    println!("Exported to {}", output_path.display());

    Ok(())
}

fn export_jsonl(session: &ccmemo_core::domain::types::SessionMetadata) -> Result<()> {
    let source_path = Path::new(&session.file_path);
    if !source_path.exists() {
        anyhow::bail!("Source JSONL file not found: {}", session.file_path);
    }

    println!("Source JSONL: {}", session.file_path);
    println!("To copy: cp \"{}\" <destination>", session.file_path);

    Ok(())
}
