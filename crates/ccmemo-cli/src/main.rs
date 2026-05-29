use clap::{Parser, Subcommand};

mod commands;

#[derive(Parser)]
#[command(
    name = "ccmemo",
    version,
    about = "CCMemo - Claude Code session memory manager"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Scan and index Claude Code session transcripts
    Scan {
        /// Force full re-scan ignoring bookmarks
        #[arg(long)]
        full: bool,
    },
    /// List indexed sessions
    List {
        /// Search query
        #[arg(short, long)]
        query: Option<String>,
        /// Filter by project
        #[arg(short, long)]
        project: Option<String>,
        /// Filter by status (active/completed/interrupted/unrecoverable)
        #[arg(short, long)]
        status: Option<String>,
        /// Maximum results
        #[arg(short, long)]
        limit: Option<usize>,
        /// Output format (table or json)
        #[arg(short, long, default_value = "table")]
        format: String,
    },
    /// Show session details
    Show {
        /// Session ID (full or 8-char prefix)
        session_id: String,
    },
    /// Check resume readiness and show command
    Resume {
        /// Session ID
        session_id: String,
    },
    /// Export session to markdown or jsonl
    Export {
        /// Session ID
        session_id: String,
        /// Export format: markdown or jsonl
        #[arg(short, long, default_value = "markdown")]
        format: String,
        /// Apply redaction for safe sharing (Phase 4)
        #[arg(long)]
        safe: bool,
    },
    /// Start Web UI server (Phase 2)
    Serve {
        /// Port to bind
        #[arg(short, long)]
        port: Option<u16>,
    },
    /// Import demo sessions
    Demo,
    /// Manage configuration
    Config {
        #[command(subcommand)]
        action: ConfigAction,
    },
    /// Run diagnostic checks
    Doctor,
}

#[derive(Subcommand)]
enum ConfigAction {
    /// Get a config value
    Get { key: String },
    /// Set a config value
    Set { key: String, value: String },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_env("RUST_LOG")
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("warn")),
        )
        .init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Scan { full } => commands::run_scan(full),
        Commands::List {
            query,
            project,
            status,
            limit,
            format,
        } => commands::run_list(
            query.as_deref(),
            project.as_deref(),
            status.as_deref(),
            limit,
            &format,
        ),
        Commands::Show { session_id } => commands::run_show(&session_id),
        Commands::Resume { session_id } => commands::run_resume(&session_id),
        Commands::Export {
            session_id,
            format,
            safe,
        } => commands::run_export(&session_id, &format, safe),
        Commands::Serve { port } => commands::run_serve(port),
        Commands::Demo => commands::run_demo(),
        Commands::Config { action } => match action {
            ConfigAction::Get { key } => commands::run_config_get(&key),
            ConfigAction::Set { key, value } => commands::run_config_set(&key, &value),
        },
        Commands::Doctor => commands::run_doctor(),
    }
}
