use anyhow::Result;
use ccmemo_core::service::config::Config;
use ccmemo_core::storage::SessionRepository;
use ccmemo_core::storage::sqlite::Database;

pub fn run_resume(session_id: &str) -> Result<()> {
    let config = Config::load()?;
    let db = Database::open(&config.db_path)?;

    let session = db
        .get_session(session_id)?
        .ok_or_else(|| anyhow::anyhow!("Session '{}' not found", session_id))?;

    let term = console::Term::stdout();

    let title = console::Style::new()
        .bold()
        .apply_to("Resume Readiness Check")
        .to_string();
    term.write_line(&title)?;
    term.write_line("")?;

    term.write_line(&format!("  Session: {}", session.session_id))?;
    term.write_line(&format!("  Title:   {}", session.auto_title))?;
    term.write_line(&format!(
        "  Branch:  {}",
        session.branch.as_deref().unwrap_or("unknown")
    ))?;
    term.write_line(&format!("  Source:  {}", session.file_path))?;
    term.write_line("")?;

    let mut ready = true;

    let file_exists = std::path::Path::new(&session.file_path).exists();
    if file_exists {
        term.write_line(&format!(
            "  {} Source file accessible",
            console::Style::new().green().apply_to("✓")
        ))?;
    } else {
        term.write_line(&format!(
            "  {} Source file not found: {}",
            console::Style::new().red().apply_to("✗"),
            session.file_path
        ))?;
        ready = false;
    }

    if let Some(ref branch) = session.branch {
        term.write_line(&format!(
            "  {} Last branch: {branch}",
            console::Style::new().green().apply_to("✓")
        ))?;
    } else {
        term.write_line(&format!(
            "  {} No branch info available",
            console::Style::new().yellow().apply_to("⚠")
        ))?;
    }

    if let Some(ref model) = session.model {
        term.write_line(&format!(
            "  {} Model: {model}",
            console::Style::new().green().apply_to("✓")
        ))?;
    }

    term.write_line("")?;

    if ready {
        let msg = console::Style::new()
            .green()
            .bold()
            .apply_to("  Ready to resume!")
            .to_string();
        term.write_line(&msg)?;
    } else {
        let msg = console::Style::new()
            .red()
            .bold()
            .apply_to("  Not ready to resume.")
            .to_string();
        term.write_line(&msg)?;
        term.write_line("  Some checks failed. Fix the issues above and try again.")?;
    }

    Ok(())
}
