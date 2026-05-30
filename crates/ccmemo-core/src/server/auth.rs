use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};

use super::ServerState;

fn get_cookie_value(cookie_header: &str, name: &str) -> Option<String> {
    cookie_header
        .split(';')
        .filter_map(|pair| {
            let mut parts = pair.trim().splitn(2, '=');
            let key = parts.next()?.trim();
            let value = parts.next()?.trim();
            if key == name {
                Some(value.to_string())
            } else {
                None
            }
        })
        .next()
}

pub async fn auth_middleware(
    State(state): State<std::sync::Arc<ServerState>>,
    req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let authed = req
        .headers()
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .and_then(|cookies| get_cookie_value(cookies, "ccmemo_session"))
        .map(|session_id| {
            let sessions = state.active_sessions.lock().unwrap();
            sessions.contains(&session_id)
        })
        .unwrap_or(false);

    if !authed {
        return Err(StatusCode::UNAUTHORIZED);
    }

    Ok(next.run(req).await)
}
