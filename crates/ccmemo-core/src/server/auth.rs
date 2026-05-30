use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};

use super::ServerState;

pub async fn auth_middleware(
    State(state): State<std::sync::Arc<ServerState>>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let authed = req
        .headers()
        .get("X-CCMemo-Token")
        .and_then(|v| v.to_str().ok())
        .map(|v| v == state.token)
        .unwrap_or(false);

    if !authed {
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(next.run(req).await)
}
