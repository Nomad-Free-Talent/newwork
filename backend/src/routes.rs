use axum::{
    middleware::from_fn,
    routing::{get, post, put, delete},
    Router,
};

use crate::auth::auth_middleware;
use crate::handlers::*;
use crate::state::AppState;

pub fn create_router() -> Router<AppState> {
    let protected_routes = Router::new()
        .route("/employees", get(list_employees))
        .route("/employees/:id", get(get_employee))
        .route("/employees/:id", put(update_employee))
        .route("/feedback", post(create_feedback))
        .route("/absences", post(create_absence_request))
        .route("/absences/me", get(get_my_absences))
        .route("/data-items", get(list_data_items))
        .route("/data-items", post(create_data_item))
        .route("/data-items/:id", get(get_data_item))
        .route("/data-items/:id", put(update_data_item))
        .route("/data-items/:id", delete(delete_data_item))
        .layer(from_fn(auth_middleware));

    Router::new()
        .route("/auth/login", post(login))
        .merge(protected_routes)
}

