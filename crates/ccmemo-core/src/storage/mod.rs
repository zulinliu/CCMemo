pub mod migrations;
pub mod models;
pub mod sqlite;

use crate::domain::error::Result;
use crate::domain::types::{PaginatedResult, ProjectIdentity, ScanBookmark, SessionMetadata, SessionQuery, TranscriptEvent};

pub trait SessionRepository: Send + Sync {
    fn get_sessions(&self, query: &SessionQuery) -> Result<PaginatedResult<SessionMetadata>>;
    fn get_session(&self, id: &str) -> Result<Option<SessionMetadata>>;
    fn upsert_session(&self, session: &SessionMetadata) -> Result<()>;
    fn count_sessions(&self) -> Result<i64>;
}

pub trait EventRepository: Send + Sync {
    fn get_events(
        &self,
        session_id: &str,
        cursor: Option<&str>,
        limit: usize,
    ) -> Result<PaginatedResult<TranscriptEvent>>;
    fn upsert_events(&self, events: &[TranscriptEvent]) -> Result<()>;
    fn get_event_count(&self, session_id: &str) -> Result<i64>;
}

pub trait ProjectRepository: Send + Sync {
    fn get_all(&self) -> Result<Vec<ProjectIdentity>>;
    fn upsert(&self, project: &ProjectIdentity) -> Result<()>;
    fn find_by_encoded_folder(&self, folder: &str) -> Result<Option<ProjectIdentity>>;
}

pub trait BookmarkRepository: Send + Sync {
    fn get_bookmark(&self, file_path: &str) -> Result<Option<ScanBookmark>>;
    fn upsert_bookmark(&self, bookmark: &ScanBookmark) -> Result<()>;
}
