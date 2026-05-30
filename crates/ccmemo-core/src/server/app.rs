use std::sync::Arc;

use axum::{
    Router,
    extract::Request,
    http::{HeaderValue, StatusCode},
    middleware,
    middleware::Next,
    response::Response,
    routing::get,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use super::ServerState;
use super::handlers;

pub fn create_app(state: Arc<ServerState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin([
            "http://127.0.0.1".parse::<HeaderValue>().unwrap(),
            "http://localhost".parse::<HeaderValue>().unwrap(),
        ])
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .route("/projects", get(handlers::list_projects))
        .route("/sessions", get(handlers::list_sessions))
        .route("/sessions/{id}", get(handlers::get_session))
        .route("/sessions/{id}/timeline", get(handlers::get_timeline))
        .route("/sessions/{id}/tool-calls", get(handlers::get_tool_calls))
        .route("/search", get(handlers::search))
        .route("/stats", get(handlers::get_stats))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            super::auth::auth_middleware,
        ));

    Router::new()
        .nest("/api", api_routes)
        .fallback(handlers::serve_frontend)
        .layer(middleware::from_fn(security_headers_middleware))
        .layer(middleware::from_fn(host_validation_middleware))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}

async fn host_validation_middleware(req: Request, next: Next) -> Result<Response, StatusCode> {
    let valid = req
        .headers()
        .get("host")
        .and_then(|v| v.to_str().ok())
        .map(|h| {
            let host = h.split(':').next().unwrap_or(h);
            host == "127.0.0.1" || host == "localhost"
        })
        .unwrap_or(true);

    if !valid {
        tracing::debug!("Rejected request with invalid Host header");
        return Err(StatusCode::NOT_FOUND);
    }

    Ok(next.run(req).await)
}

async fn security_headers_middleware(req: Request, next: Next) -> Response {
    let mut resp = next.run(req).await;
    let headers = resp.headers_mut();
    headers.insert(
        axum::http::header::X_CONTENT_TYPE_OPTIONS,
        HeaderValue::from_static("nosniff"),
    );
    headers.insert(
        axum::http::header::X_FRAME_OPTIONS,
        HeaderValue::from_static("DENY"),
    );
    headers.insert(
        axum::http::header::REFERRER_POLICY,
        HeaderValue::from_static("no-referrer"),
    );
    headers.insert(
        axum::http::header::HeaderName::from_static("x-content-security-policy"),
        HeaderValue::from_static("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"),
    );
    resp
}
