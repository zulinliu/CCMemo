use anyhow::Result;
use ccmemo_core::domain::types::SessionStatus;
use ccmemo_core::service::config::Config;
use ccmemo_core::storage::sqlite::Database;
use ccmemo_core::storage::{EventRepository, SessionRepository};

pub fn run_show(session_id: &str) -> Result<()> {
    let config = Config::load()?;
    let db = Database::open(&config.db_path)?;

    let session = db
        .get_session(session_id)?
        .ok_or_else(|| anyhow::anyhow!("Session '{}' not found", session_id))?;

    let event_count = db.get_event_count(&session.session_id)?;

    let term = console::Term::stdout();

    let header = console::Style::new()
        .bold()
        .apply_to(format!(
            "Session: {}",
            &session.session_id[..8.min(session.session_id.len())]
        ))
        .to_string();
    term.write_line(&header)?;
    term.write_line(&format!("  Full ID:  {}", session.session_id))?;
    term.write_line(&format!("  Title:    {}", session.auto_title))?;
    if let Some(ref custom) = session.custom_title {
        term.write_line(&format!("  Custom:   {custom}"))?;
    }
    term.write_line(&format!(
        "  Status:   {}",
        match session.status {
            SessionStatus::Active => console::Style::new().blue().bold().apply_to("active"),
            SessionStatus::Completed => console::Style::new().green().apply_to("completed"),
            SessionStatus::Interrupted => console::Style::new().yellow().apply_to("interrupted"),
            SessionStatus::Unrecoverable => console::Style::new().red().apply_to("unrecoverable"),
        }
    ))?;
    term.write_line(&format!("  Project:  {}", session.project_id))?;
    term.write_line(&format!("  Started:  {}", session.started_at))?;
    if let Some(ref ended) = session.ended_at {
        term.write_line(&format!("  Ended:    {ended}"))?;
    }
    if let Some(ref model) = session.model {
        term.write_line(&format!("  Model:    {model}"))?;
    }
    if let Some(ref branch) = session.branch {
        term.write_line(&format!("  Branch:   {branch}"))?;
    }
    term.write_line(&format!("  Events:   {event_count}"))?;
    term.write_line(&format!("  Files:    {}", session.file_count))?;
    term.write_line(&format!("  Tool calls: {}", session.tool_call_count))?;
    term.write_line(&format!("  Errors:   {}", session.error_count))?;
    if let Some(ref tags) = session.tags {
        term.write_line(&format!("  Tags:     {tags}"))?;
    }
    term.write_line(&format!("  Source:   {}", session.file_path))?;
    term.write_line("")?;

    // Show events
    let events_result = db.get_events(&session.session_id, None, 20)?;
    if !events_result.items.is_empty() {
        let events_header = console::Style::new()
            .bold()
            .apply_to("Recent Events:")
            .to_string();
        term.write_line(&events_header)?;
        for event in &events_result.items {
            let preview = event.preview.as_deref().unwrap_or("");
            let preview_truncated = if preview.chars().count() > 80 {
                let t: String = preview.chars().take(77).collect();
                format!("{t}...")
            } else {
                preview.to_string()
            };
            term.write_line(&format!(
                "  [{:>3}] {:<12} {}",
                event.sequence, event.event_type, preview_truncated
            ))?;
        }
        if events_result.has_more {
            term.write_line(&format!("  ... {} more events", event_count - 20))?;
        }
    }

    Ok(())
}
