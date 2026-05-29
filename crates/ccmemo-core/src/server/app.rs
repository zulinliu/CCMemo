use std::sync::Arc;

use axum::{
    middleware,
    Router,
    routing::get,
};
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;

use super::ServerState;
use super::handlers;

pub fn create_app(state: Arc<ServerState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
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
        .layer(middleware::from_fn_with_state(state.clone(), super::auth::auth_middleware));

    Router::new()
        .nest("/api", api_routes)
        .fallback(handlers::serve_frontend)
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
