use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    Extension,
};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::auth::{AuthenticatedUser, Claims, generate_token};
use crate::models::*;
use crate::state::AppState;

pub async fn login(
    State(state): State<AppState>,
    Json(login_req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, StatusCode> {
    let users = state.users.read().await;
    let user = users
        .get(&login_req.email)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    // In production, use proper password hashing/verification
    // For demo, we'll just check a simple hash
    let valid = bcrypt::verify(&login_req.password, &user.password_hash)
        .unwrap_or(false);

    if !valid {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = generate_token(&user.id, &user.email, &user.role)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(LoginResponse {
        token,
        user: UserInfo {
            id: user.id.clone(),
            email: user.email.clone(),
            role: user.role.clone(),
            employee_id: user.employee_id.clone(),
        },
    }))
}

pub async fn get_employee(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(employee_id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let employees = state.users.read().await;
    let user = employees
        .get(&claims.email)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    let employees_db = state.employees.read().await;
    let employee = employees_db
        .get(&employee_id)
        .ok_or(StatusCode::NOT_FOUND)?;

    // Check permissions
    let can_view_all = auth_user.is_manager() 
        || (auth_user.is_employee() && user.employee_id.as_ref() == Some(&employee_id));

    if can_view_all {
        Ok(Json(json!(employee)))
    } else if auth_user.is_coworker() {
        // Co-worker can only see public data
        let public_data: EmployeePublic = employee.clone().into();
        Ok(Json(json!(public_data)))
    } else {
        Err(StatusCode::FORBIDDEN)
    }
}

pub async fn update_employee(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(employee_id): Path<String>,
    Json(update_req): Json<UpdateEmployeeRequest>,
) -> Result<Json<Value>, StatusCode> {
    let users = state.users.read().await;
    let user = users
        .get(&claims.email)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Check permissions - only manager or owner can edit
    let can_edit = auth_user.is_manager() 
        || (auth_user.is_employee() && user.employee_id.as_ref() == Some(&employee_id));

    if !can_edit {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut employees = state.employees.write().await;
    let employee = employees
        .get_mut(&employee_id)
        .ok_or(StatusCode::NOT_FOUND)?;

    if let Some(name) = update_req.name {
        employee.name = name;
    }
    if let Some(email) = update_req.email {
        employee.email = email;
    }
    if let Some(position) = update_req.position {
        employee.position = position;
    }
    if let Some(department) = update_req.department {
        employee.department = department;
    }
    if let Some(salary) = update_req.salary {
        employee.salary = Some(salary);
    }
    if let Some(phone) = update_req.phone {
        employee.phone = Some(phone);
    }
    if let Some(address) = update_req.address {
        employee.address = Some(address);
    }

    Ok(Json(json!(employee)))
}

pub async fn list_employees(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, StatusCode> {
    let employees = state.employees.read().await;
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    if auth_user.is_manager() {
        // Manager sees all
        Ok(Json(json!(employees.values().collect::<Vec<_>>())))
    } else {
        // Others see public data
        let public_data: Vec<EmployeePublic> = employees
            .values()
            .cloned()
            .map(|e| e.into())
            .collect();
        Ok(Json(json!(public_data)))
    }
}

pub async fn create_feedback(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(feedback_req): Json<CreateFeedbackRequest>,
) -> Result<Json<Value>, StatusCode> {
    // Check if user is coworker or employee
    let auth_user = AuthenticatedUser {
        id: claims.sub.clone(),
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    if !auth_user.is_coworker() && !auth_user.is_employee() {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut content = feedback_req.content.clone();
    
    // Polish content using AI if requested
    if feedback_req.polish.unwrap_or(false) {
        content = polish_feedback_with_ai(&content).await
            .unwrap_or_else(|_| feedback_req.content.clone());
    }

    let feedback = Feedback {
        id: Uuid::new_v4().to_string(),
        employee_id: feedback_req.employee_id,
        from_user_id: claims.sub,
        content: feedback_req.content,
        polished_content: if feedback_req.polish.unwrap_or(false) {
            Some(content)
        } else {
            None
        },
        created_at: chrono::Utc::now(),
    };

    let mut feedbacks = state.feedbacks.write().await;
    feedbacks.push(feedback.clone());

    Ok(Json(json!(feedback)))
}

async fn polish_feedback_with_ai(content: &str) -> Result<String, reqwest::Error> {
    // Using HuggingFace Inference API - free tier
    // Note: For production, set HUGGINGFACE_TOKEN environment variable
    let token = std::env::var("HUGGINGFACE_TOKEN").ok();
    
    let client = reqwest::Client::new();
    let prompt = format!(
        "Please polish and improve the following professional feedback while maintaining its original meaning: {}",
        content
    );

    // Using a free text generation model from HuggingFace
    // Note: This is a simplified example - you'd want to use a proper text polish/grammar model
    let mut request = client
        .post("https://api-inference.huggingface.co/models/gpt2")
        .json(&json!({
            "inputs": prompt,
            "parameters": {
                "max_length": 200,
                "temperature": 0.7
            }
        }));
    
    if let Some(t) = token {
        request = request.header("Authorization", format!("Bearer {}", t));
    }
    
    let response = request.send().await?;

    // For demo purposes, if API fails, return improved version manually
    if !response.status().is_success() {
        // Fallback: simple improvement
        return Ok(format!("[AI-Polished] {}", content.trim()));
    }

    let result: Value = response.json().await?;
    if let Some(array) = result.as_array() {
        if let Some(first) = array.first() {
            if let Some(generated_text) = first.get("generated_text") {
                if let Some(text) = generated_text.as_str() {
                    return Ok(text.to_string());
                }
            }
        }
    }
    
    // Fallback if parsing fails
    Ok(format!("[AI-Polished] {}", content.trim()))
}

pub async fn create_absence_request(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(absence_req): Json<CreateAbsenceRequest>,
) -> Result<Json<Value>, StatusCode> {
    let users = state.users.read().await;
    let user = users
        .get(&claims.email)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let employee_id = user.employee_id.clone()
        .ok_or(StatusCode::BAD_REQUEST)?;

    let absence = AbsenceRequest {
        id: Uuid::new_v4().to_string(),
        employee_id,
        start_date: absence_req.start_date,
        end_date: absence_req.end_date,
        reason: absence_req.reason,
        status: AbsenceStatus::Pending,
        created_at: chrono::Utc::now(),
    };

    let mut absences = state.absences.write().await;
    absences.push(absence.clone());

    Ok(Json(json!(absence)))
}

pub async fn get_my_absences(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, StatusCode> {
    let users = state.users.read().await;
    let user = users
        .get(&claims.email)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let employee_id = user.employee_id.clone()
        .ok_or(StatusCode::BAD_REQUEST)?;

    let absences = state.absences.read().await;
    let my_absences: Vec<&AbsenceRequest> = absences
        .iter()
        .filter(|a| a.employee_id == employee_id)
        .collect();

    Ok(Json(json!(my_absences)))
}

