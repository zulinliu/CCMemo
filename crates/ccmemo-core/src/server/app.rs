use std::sync::Arc;

use axum::{
    Router,
    extract::Request,
    http::{HeaderValue, StatusCode},
    middleware,
    middleware::Next,
    response::Response,
    routing::{get, post},
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use super::ServerState;
use super::handlers;

pub fn create_app(state: Arc<ServerState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let auth_routes = Router::new()
        .route("/auth/login", post(handlers::login))
        .route("/auth/logout", post(handlers::logout))
        .route("/auth/check", get(handlers::auth_check));

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
        .nest("/api", auth_routes)
        .nest("/api", api_routes)
        .fallback(handlers::serve_frontend)
        .layer(middleware::from_fn(security_headers_middleware))
        .layer(middleware::from_fn(host_validation_middleware))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}

fn is_private_host(host: &str) -> bool {
    if host == "127.0.0.1" || host == "localhost" || host == "0.0.0.0" {
        return true;
    }
    if host.starts_with("192.168.") || host.starts_with("10.") {
        return true;
    }
    // 172.16.0.0/12
    if let Some(rest) = host.strip_prefix("172.")
        && let Some(seg) = rest.split('.').next()
        && let Ok(n) = seg.parse::<u8>()
        && (16..=31).contains(&n)
    {
        return true;
    }
    if host == "172.30.1.63" {
        return true;
    }
    false
}

async fn host_validation_middleware(req: Request, next: Next) -> Result<Response, StatusCode> {
    let host = req
        .headers()
        .get("host")
        .and_then(|v| v.to_str().ok())
        .map(|h| h.split(':').next().unwrap_or(h).to_lowercase());

    match host.as_deref() {
        // Allow known private/local addresses
        Some(h) if is_private_host(h) => {},
        // Allow requests without Host header (local unix socket, etc.)
        None => {},
        // For non-private hosts (e.g. tunnel domains like test.liuzl.asia),
        // block obvious localhost-spoofing via non-standard ports on public IPs
        Some(h) if h.contains("localhost") || h.contains("127.0.0.1") => {
            tracing::debug!("Rejected request with spoofed Host header: {h}");
            return Err(StatusCode::NOT_FOUND);
        }
        // Allow all other public hostnames (tunnel domains, etc.)
        Some(_) => {},
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
        HeaderValue::from_static("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; manifest-src 'self'"),
    );
    resp
}
