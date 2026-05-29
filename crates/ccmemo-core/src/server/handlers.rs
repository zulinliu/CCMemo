use std::sync::Arc;

use axum::{
    body::Body,
    extract::{Request, Path, Query, State},
    http::{StatusCode, header, response::Response},
    response::{Html, IntoResponse, Json},
};
use serde::Deserialize;
use rust_embed::RustEmbed;

use crate::domain::types::{SessionQuery, SessionStatus};
use crate::storage::{EventRepository, ProjectRepository, SessionRepository};
use super::ServerState;

#[derive(RustEmbed)]
#[folder = "../../frontend/dist/"]
struct FrontendAssets;

#[derive(Deserialize)]
pub struct ListSessionsQuery {
    pub project_id: Option<String>,
    pub status: Option<String>,
    pub query: Option<String>,
    pub limit: Option<usize>,
    pub cursor: Option<String>,
}

#[derive(Deserialize)]
pub struct TimelineQuery {
    pub cursor: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: Option<String>,
    pub project_id: Option<String>,
    pub limit: Option<usize>,
}

pub async fn list_projects(
    State(state): State<Arc<ServerState>>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let projects = state.db.get_all()?;
    let json = serde_json::to_value(&projects)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(Json(ApiResponse::ok(json)))
}

pub async fn list_sessions(
    State(state): State<Arc<ServerState>>,
    Query(params): Query<ListSessionsQuery>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let session_status = params.status.as_deref().and_then(|s| match s {
        "active" => Some(SessionStatus::Active),
        "completed" => Some(SessionStatus::Completed),
        "interrupted" => Some(SessionStatus::Interrupted),
        "unrecoverable" => Some(SessionStatus::Unrecoverable),
        _ => None,
    });

    let sq = SessionQuery {
        project_id: params.project_id,
        status: session_status,
        query: params.query,
        limit: params.limit.or(Some(20)),
        cursor: params.cursor,
    };

    let result = state.db.get_sessions(&sq)?;
    let json = serde_json::to_value(&result)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(Json(ApiResponse::ok(json)))
}

pub async fn get_session(
    State(state): State<Arc<ServerState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let session = state.db.get_session(&id)?
        .ok_or_else(|| AppError::NotFound(format!("Session '{}' not found", id)))?;
    let json = serde_json::to_value(&session)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(Json(ApiResponse::ok(json)))
}

pub async fn get_timeline(
    State(state): State<Arc<ServerState>>,
    Path(id): Path<String>,
    Query(params): Query<TimelineQuery>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let session = state.db.get_session(&id)?
        .ok_or_else(|| AppError::NotFound(format!("Session '{}' not found", id)))?;

    let limit = params.limit.unwrap_or(100);
    let events = state.db.get_events(&session.session_id, params.cursor.as_deref(), limit)?;
    let json = serde_json::to_value(&events)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(Json(ApiResponse::ok(json)))
}

pub async fn get_tool_calls(
    State(state): State<Arc<ServerState>>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let session = state.db.get_session(&id)?
        .ok_or_else(|| AppError::NotFound(format!("Session '{}' not found", id)))?;

    let conn = state.db.get_read_conn()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, eventId, sessionId, toolName, filePath, inputSummary, outputSummary \
         FROM ToolCall WHERE sessionId = ?1 ORDER BY id"
    ).map_err(|e| AppError::Internal(e.to_string()))?;
    let rows = stmt.query_map(rusqlite::params![session.session_id], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "event_id": row.get::<_, String>(1)?,
            "session_id": row.get::<_, String>(2)?,
            "tool_name": row.get::<_, String>(3)?,
            "file_path": row.get::<_, Option<String>>(4)?,
            "input_summary": row.get::<_, Option<String>>(5)?,
            "output_summary": row.get::<_, Option<String>>(6)?,
        }))
    }).map_err(|e| AppError::Internal(e.to_string()))?;

    let tool_calls: Vec<serde_json::Value> = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Json(ApiResponse::ok(serde_json::json!({ "items": tool_calls }))))
}

pub async fn search(
    State(state): State<Arc<ServerState>>,
    Query(params): Query<SearchQuery>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let q = params.q.unwrap_or_default();
    if q.is_empty() {
        return Ok(Json(ApiResponse::ok(serde_json::json!({"items": [], "has_more": false}))));
    }

    let conn = state.db.get_read_conn()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let limit = params.limit.unwrap_or(20) as i64;
    let fts_query = format!("{}*", q.replace('"', "\"\"\""));

    let mut sql = String::from(
        "SELECT s.sessionId, s.projectId, s.autoTitle, s.customTitle, s.status, \
         s.startedAt, s.endedAt, s.model, s.branch, s.fileCount, s.toolCallCount, s.errorCount \
         FROM SessionMetadata s \
         JOIN session_fts f ON f.sessionId = s.sessionId \
         WHERE session_fts MATCH ?1"
    );
    let mut param_box: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(fts_query)];

    if let Some(ref pid) = params.project_id {
        sql.push_str(" AND s.projectId = ?");
        param_box.push(Box::new(pid.clone()));
    }

    sql.push_str(" ORDER BY s.startedAt DESC LIMIT ?");
    param_box.push(Box::new(limit + 1));

    let param_refs: Vec<&dyn rusqlite::types::ToSql> =
        param_box.iter().map(|p| p.as_ref()).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| AppError::Internal(e.to_string()))?;
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        Ok(serde_json::json!({
            "session_id": row.get::<_, String>(0)?,
            "project_id": row.get::<_, String>(1)?,
            "auto_title": row.get::<_, String>(2)?,
            "custom_title": row.get::<_, Option<String>>(3)?,
            "status": row.get::<_, String>(4)?,
            "started_at": row.get::<_, String>(5)?,
            "ended_at": row.get::<_, Option<String>>(6)?,
            "model": row.get::<_, Option<String>>(7)?,
            "branch": row.get::<_, Option<String>>(8)?,
            "file_count": row.get::<_, i64>(9)?,
            "tool_call_count": row.get::<_, i64>(10)?,
            "error_count": row.get::<_, i64>(11)?,
        }))
    }).map_err(|e| AppError::Internal(e.to_string()))?;

    let mut items: Vec<serde_json::Value> = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let has_more = items.len() > limit as usize;
    if has_more {
        items.truncate(limit as usize);
    }

    Ok(Json(ApiResponse::ok(serde_json::json!({
        "items": items,
        "has_more": has_more
    }))))
}

pub async fn get_stats(
    State(state): State<Arc<ServerState>>,
) -> Result<Json<ApiResponse<serde_json::Value>>, AppError> {
    let session_count = state.db.count_sessions()?;
    let projects = state.db.get_all()?;

    let conn = state.db.get_read_conn()
        .map_err(|e| AppError::Internal(e.to_string()))?;
    let event_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM TranscriptEvent", [],
        |row| row.get(0)
    ).unwrap_or(0);

    let tool_call_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM ToolCall", [],
        |row| row.get(0)
    ).unwrap_or(0);

    Ok(Json(ApiResponse::ok(serde_json::json!({
        "session_count": session_count,
        "project_count": projects.len(),
        "event_count": event_count,
        "tool_call_count": tool_call_count,
    }))))
}

pub async fn serve_frontend(req: Request) -> impl IntoResponse {
    let path = req.uri().path().trim_start_matches('/');

    // Try to serve the exact file first
    if !path.is_empty()
        && path != "index.html"
        && let Some(file) = FrontendAssets::get(path)
    {
        let mime = mime_guess::from_path(path).first_or_octet_stream();
        return Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, mime.as_ref())
            .header(header::CACHE_CONTROL, "public, max-age=31536000")
            .body(Body::from(file.data.into_owned()))
            .unwrap();
    }

    // SPA fallback: serve index.html for all other routes
    match FrontendAssets::get("index.html") {
        Some(content) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, "text/html; charset=utf-8")
            .header(header::CACHE_CONTROL, "no-cache")
            .body(Body::from(content.data.into_owned()))
            .unwrap(),
        None => Html(
            "<html><body style='font-family:system-ui;max-width:600px;margin:4rem auto;padding:0 1rem'>\
             <h1>CCMemo</h1>\
             <p>Frontend not built. Run <code>cd frontend && npm run build</code> first.</p>\
             <p>API is available at <code>/api/*</code></p>\
             </body></html>"
        ).into_response(),
    }
}

#[derive(serde::Serialize)]
pub struct ApiResponse<T: serde::Serialize> {
    pub status: &'static str,
    pub data: T,
}

impl<T: serde::Serialize> ApiResponse<T> {
    pub fn ok(data: T) -> Self {
        Self { status: "ok", data }
    }
}

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response<Body> {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Internal(msg) => {
                tracing::error!("Internal error: {msg}");
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };
        let body = serde_json::json!({"status": "error", "message": message});
        (status, Json(body)).into_response()
    }
}

impl From<crate::domain::error::AppError> for AppError {
    fn from(e: crate::domain::error::AppError) -> Self {
        AppError::Internal(e.to_string())
    }
}
