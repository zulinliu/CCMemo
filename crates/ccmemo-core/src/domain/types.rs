use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SessionStatus {
    Active,
    Completed,
    Interrupted,
    Unrecoverable,
}

impl std::fmt::Display for SessionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Active => write!(f, "active"),
            Self::Completed => write!(f, "completed"),
            Self::Interrupted => write!(f, "interrupted"),
            Self::Unrecoverable => write!(f, "unrecoverable"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventScope {
    User,
    Ai,
    File,
    Command,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectIdentity {
    pub id: String,
    pub name: String,
    pub real_path: String,
    pub normalized_path: String,
    pub encoded_folder: String,
    pub git_remote: Option<String>,
    pub last_active_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMetadata {
    pub session_id: String,
    pub project_id: String,
    pub auto_title: String,
    pub custom_title: Option<String>,
    pub status: SessionStatus,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub total_input_tokens: i64,
    pub total_output_tokens: i64,
    pub model: Option<String>,
    pub file_count: i64,
    pub tool_call_count: i64,
    pub error_count: i64,
    pub tags: Option<String>,
    pub branch: Option<String>,
    pub file_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptEvent {
    pub id: String,
    pub session_id: String,
    pub sequence: i64,
    pub event_type: String,
    pub timestamp: String,
    pub file_offset: i64,
    pub byte_length: i64,
    pub preview: Option<String>,
    pub raw_json_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub event_id: String,
    pub session_id: String,
    pub tool_name: String,
    pub file_path: Option<String>,
    pub input_summary: Option<String>,
    pub output_summary: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanBookmark {
    pub file_path: String,
    pub session_id: Option<String>,
    pub last_indexed_line: i64,
    pub file_hash: Option<String>,
    pub last_scanned_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    pub items: Vec<T>,
    pub next_cursor: Option<String>,
    pub has_more: bool,
}

#[derive(Debug, Clone, Default)]
pub struct SessionQuery {
    pub project_id: Option<String>,
    pub status: Option<SessionStatus>,
    pub query: Option<String>,
    pub limit: Option<usize>,
    pub cursor: Option<String>,
}
