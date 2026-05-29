use anyhow::Result;
use ccmemo_core::domain::types::{SessionQuery, SessionStatus};
use ccmemo_core::service::config::Config;
use ccmemo_core::storage::sqlite::Database;
use ccmemo_core::storage::{ProjectRepository, SessionRepository};

pub fn run_list(
    query: Option<&str>,
    project: Option<&str>,
    status: Option<&str>,
    limit: Option<usize>,
    format: &str,
) -> Result<()> {
    let config = Config::load()?;
    let db = Database::open(&config.db_path)?;

    let session_status = status.and_then(|s| match s {
        "active" => Some(SessionStatus::Active),
        "completed" => Some(SessionStatus::Completed),
        "interrupted" => Some(SessionStatus::Interrupted),
        "unrecoverable" => Some(SessionStatus::Unrecoverable),
        _ => None,
    });

    let sq = SessionQuery {
        project_id: project.map(String::from),
        status: session_status,
        query: query.map(String::from),
        limit,
        cursor: None,
    };

    let result = db.get_sessions(&sq)?;

    if format == "json" {
        let json = serde_json::to_string_pretty(&result.items)?;
        println!("{json}");
        return Ok(());
    }

    if result.items.is_empty() {
        println!(
            "No sessions found. Run 'ccmemo demo' to load sample data or 'ccmemo scan' to index real sessions."
        );
        return Ok(());
    }

    // Build project name lookup
    let projects = db.get_all()?;
    let project_names: std::collections::HashMap<String, &str> = projects
        .iter()
        .map(|p| (p.id.clone(), p.name.as_str()))
        .collect();

    let term = console::Term::stdout();
    let is_tty = term.is_term();

    if is_tty {
        term.write_line(&format!(
            "{:<10} {:<42} {:<18} {:<14} {:<20}",
            "ID", "Title", "Project", "Status", "Last Updated"
        ))?;
        term.write_line(&"-".repeat(106))?;
    }

    for session in &result.items {
        let id = &session.session_id[..8.min(session.session_id.len())];
        let title = truncate(&session.auto_title, 40);
        let project_name = truncate(
            project_names
                .get(&session.project_id)
                .copied()
                .unwrap_or(&session.project_id),
            16,
        );

        let status_str = if is_tty {
            let style = match session.status {
                SessionStatus::Active => console::Style::new().blue().bold(),
                SessionStatus::Completed => console::Style::new().green(),
                SessionStatus::Interrupted => console::Style::new().yellow(),
                SessionStatus::Unrecoverable => console::Style::new().red(),
            };
            style.apply_to(session.status.to_string()).to_string()
        } else {
            session.status.to_string()
        };

        let last_updated = format_relative_time(&session.started_at);

        if is_tty {
            term.write_line(&format!(
                "{:<10} {:<42} {:<18} {:<14} {:<20}",
                id, title, project_name, status_str, last_updated
            ))?;
        } else {
            println!("{id}\t{title}\t{project_name}\t{status_str}\t{last_updated}");
        }
    }

    if result.has_more {
        term.write_line("\n... more results available (use --limit to increase)")?;
    }

    Ok(())
}

fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        s.to_string()
    } else {
        let truncated: String = s.chars().take(max - 3).collect();
        format!("{truncated}...")
    }
}

fn format_relative_time(iso: &str) -> String {
    chrono::DateTime::parse_from_rfc3339(iso)
        .map(|dt| {
            let now = chrono::Utc::now();
            let diff = now.signed_duration_since(dt.with_timezone(&chrono::Utc));
            if diff.num_minutes() < 1 {
                "just now".into()
            } else if diff.num_hours() < 1 {
                format!("{}m ago", diff.num_minutes())
            } else if diff.num_days() < 1 {
                format!("{}h ago", diff.num_hours())
            } else if diff.num_weeks() < 1 {
                format!("{}d ago", diff.num_days())
            } else {
                format!("{}w ago", diff.num_weeks())
            }
        })
        .unwrap_or_else(|_| iso.to_string())
}
