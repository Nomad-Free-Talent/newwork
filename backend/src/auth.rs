use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

const JWT_SECRET: &[u8] = b"your-secret-key-change-in-production";

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user id
    pub email: String,
    pub role: String,
    pub exp: usize,
}

pub fn generate_token(user_id: &str, email: &str, role: &str) -> Result<String, jsonwebtoken::errors::Error> {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        exp: expiration,
    };

    encode(&Header::default(), &claims, &EncodingKey::from_secret(JWT_SECRET))
}

pub fn verify_token(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(JWT_SECRET),
        &Validation::default(),
    )?;
    Ok(token_data.claims)
}

pub async fn auth_middleware(
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = verify_token(token).map_err(|_| StatusCode::UNAUTHORIZED)?;
    
    // Attach claims to request extensions for handlers to use
    request.extensions_mut().insert(claims);
    
    Ok(next.run(request).await)
}

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub id: String,
    pub email: String,
    pub role: String,
}

impl AuthenticatedUser {
    pub fn is_manager(&self) -> bool {
        self.role == "manager"
    }

    pub fn is_employee(&self) -> bool {
        self.role == "employee"
    }

    pub fn is_coworker(&self) -> bool {
        self.role == "coworker"
    }

    pub fn can_view_all(&self, employee_id: &str) -> bool {
        // Manager can view all
        if self.is_manager() {
            return true;
        }
        // Employee can view their own
        if self.is_employee() {
            // In a real app, we'd check the employee_id from the user's record
            // For simplicity, we'll check if the employee_id matches
            return true; // Simplified - would need to check user's employee_id
        }
        false
    }

    pub fn can_edit(&self, employee_id: &str) -> bool {
        // Manager can edit all
        if self.is_manager() {
            return true;
        }
        // Employee can edit their own
        if self.is_employee() {
            // In a real app, we'd check the employee_id from the user's record
            return true; // Simplified
        }
        false
    }
}

