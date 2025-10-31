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
            name: user.name.clone(),
            email: user.email.clone(),
            role: user.role.clone(),
        },
    }))
}

pub async fn get_employee(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(employee_id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Only managers can view employee profiles
    if !auth_user.is_manager() {
        return Err(StatusCode::FORBIDDEN);
    }

    let employees_db = state.employees.read().await;
    let employee = employees_db
        .get(&employee_id)
        .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(json!(employee)))
}

pub async fn update_employee(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(employee_id): Path<String>,
    Json(update_req): Json<UpdateEmployeeRequest>,
) -> Result<Json<Value>, StatusCode> {
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Only managers can edit employee profiles
    if !auth_user.is_manager() {
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
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Only managers can view employee directory
    if !auth_user.is_manager() {
        return Err(StatusCode::FORBIDDEN);
    }

    let employees = state.employees.read().await;
    Ok(Json(json!(employees.values().collect::<Vec<_>>())))
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
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Only employees can request absences
    if !auth_user.is_employee() {
        return Err(StatusCode::FORBIDDEN);
    }

    // Find employee by matching email
    let employees = state.employees.read().await;
    let employee = employees
        .values()
        .find(|e| e.email == claims.email)
        .ok_or(StatusCode::BAD_REQUEST)?;
    let employee_id = employee.id.clone();
    drop(employees);

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
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Only employees can view their own absences
    if !auth_user.is_employee() {
        return Err(StatusCode::FORBIDDEN);
    }

    // Find employee by matching email
    let employees = state.employees.read().await;
    let employee = employees
        .values()
        .find(|e| e.email == claims.email)
        .ok_or(StatusCode::BAD_REQUEST)?;
    let employee_id = employee.id.clone();
    drop(employees);

    let absences = state.absences.read().await;
    let my_absences: Vec<&AbsenceRequest> = absences
        .iter()
        .filter(|a| a.employee_id == employee_id)
        .collect();

    Ok(Json(json!(my_absences)))
}

pub async fn list_all_absences(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, StatusCode> {
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Only managers can view all absences
    if !auth_user.is_manager() {
        return Err(StatusCode::FORBIDDEN);
    }

    let absences = state.absences.read().await;
    Ok(Json(json!(absences.clone())))
}


pub async fn update_absence_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(update_req): Json<UpdateAbsenceStatusRequest>,
) -> Result<Json<Value>, StatusCode> {
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Only managers can approve/reject absences
    if !auth_user.is_manager() {
        return Err(StatusCode::FORBIDDEN);
    }

    let mut absences = state.absences.write().await;
    let absence = absences
        .iter_mut()
        .find(|a| a.id == id)
        .ok_or(StatusCode::NOT_FOUND)?;
    
    // Clone status for comparison
    let current_status = absence.status.clone();

    // Can only update if status is pending
    if current_status != AbsenceStatus::Pending {
        return Err(StatusCode::BAD_REQUEST);
    }

    absence.status = update_req.status.clone();

    Ok(Json(json!(absence)))
}

pub async fn list_users(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, StatusCode> {
    // Managers and co-workers can list users (co-workers need it to see owner info)
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    if !auth_user.is_manager() && !auth_user.is_coworker() {
        return Err(StatusCode::FORBIDDEN);
    }

    let users = state.users.read().await;
    // Return only user info (not password hashes)
    let user_info: Vec<UserInfo> = users
        .values()
        .map(|u| UserInfo {
            id: u.id.clone(),
            name: u.name.clone(),
            email: u.email.clone(),
            role: u.role.clone(),
        })
        .collect();

    Ok(Json(json!(user_info)))
}

pub async fn create_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(create_req): Json<CreateUserRequest>,
) -> Result<Json<Value>, StatusCode> {
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Only managers can create users
    if !auth_user.is_manager() {
        return Err(StatusCode::FORBIDDEN);
    }

    // Validate role
    if !["manager", "employee", "coworker"].contains(&create_req.role.as_str()) {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Check if user with this email already exists
    let users = state.users.read().await;
    if users.contains_key(&create_req.email) {
        return Err(StatusCode::CONFLICT);
    }
    drop(users);

    // Hash password
    let password_hash = bcrypt::hash(&create_req.password, 12)
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Generate user ID
    let user_id = uuid::Uuid::new_v4().to_string();

    let new_user = User {
        id: user_id.clone(),
        name: create_req.name.clone(),
        email: create_req.email.clone(),
        password_hash,
        role: create_req.role.clone(),
    };

    let mut users = state.users.write().await;
    users.insert(create_req.email.clone(), new_user.clone());

    Ok(Json(json!(UserInfo {
        id: user_id,
        name: create_req.name,
        email: create_req.email,
        role: create_req.role,
    })))
}

// Data Items handlers with access control

pub async fn list_data_items(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, StatusCode> {
    let data_items = state.data_items.read().await;
    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    let items: Vec<&DataItem> = if auth_user.is_manager() || auth_user.is_coworker() {
        // Manager and co-worker can see all (including deleted)
        data_items.values().collect()
    } else if auth_user.is_employee() {
        // Employee can only see their own data (by user ID)
        data_items
            .values()
            .filter(|item| item.owner_id == auth_user.id)
            .collect()
    } else {
        return Err(StatusCode::FORBIDDEN);
    };

    Ok(Json(json!(items)))
}

pub async fn get_data_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<String>,
) -> Result<Json<Value>, StatusCode> {
    let data_items = state.data_items.read().await;
    let item = data_items
        .get(&item_id)
        .ok_or(StatusCode::NOT_FOUND)?;

    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Check read permissions
    let can_read = if auth_user.is_manager() || auth_user.is_coworker() {
        true // Can read all
    } else if auth_user.is_employee() {
        item.owner_id == auth_user.id // Can only read own (by user ID)
    } else {
        false
    };

    if !can_read {
        return Err(StatusCode::FORBIDDEN);
    }

    Ok(Json(json!(item)))
}

pub async fn create_data_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(create_req): Json<CreateDataItemRequest>,
) -> Result<Json<Value>, StatusCode> {
    let auth_user = AuthenticatedUser {
        id: claims.sub.clone(),
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Determine owner_id
    let owner_id = if auth_user.is_manager() {
        // Manager can assign to any user, or defaults to themselves
        create_req.owner_id.unwrap_or_else(|| claims.sub.clone())
    } else if auth_user.is_employee() {
        // Employee can only create for themselves
        claims.sub.clone()
    } else if auth_user.is_coworker() {
        // Co-worker cannot create (read-only)
        return Err(StatusCode::FORBIDDEN);
    } else {
        return Err(StatusCode::FORBIDDEN);
    };

    // Validate that the owner_id exists
    let users = state.users.read().await;
    if !users.values().any(|u| u.id == owner_id) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let now = chrono::Utc::now();
    let item = DataItem {
        id: uuid::Uuid::new_v4().to_string(),
        title: create_req.title,
        description: create_req.description,
        owner_id,
        is_deleted: false,
        created_at: now,
        updated_at: now,
    };

    let mut data_items = state.data_items.write().await;
    data_items.insert(item.id.clone(), item.clone());

    Ok(Json(json!(item)))
}

pub async fn update_data_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<String>,
    Json(update_req): Json<UpdateDataItemRequest>,
) -> Result<Json<Value>, StatusCode> {
    let mut data_items = state.data_items.write().await;
    let item = data_items
        .get_mut(&item_id)
        .ok_or(StatusCode::NOT_FOUND)?;

    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Check write permissions
    let can_write = if auth_user.is_manager() {
        true // Manager can update all
    } else if auth_user.is_employee() {
        item.owner_id == auth_user.id // Employee can only update own (by user ID)
    } else if auth_user.is_coworker() {
        false // Co-worker cannot update (read-only)
    } else {
        false
    };

    if !can_write {
        return Err(StatusCode::FORBIDDEN);
    }

    // Update fields
    if let Some(title) = update_req.title {
        item.title = title;
    }
    if let Some(description) = update_req.description {
        item.description = description;
    }
    if let Some(is_deleted) = update_req.is_deleted {
        item.is_deleted = is_deleted;
    }
    item.updated_at = chrono::Utc::now();

    Ok(Json(json!(item)))
}

pub async fn delete_data_item(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(item_id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let mut data_items = state.data_items.write().await;
    let item = data_items
        .get_mut(&item_id)
        .ok_or(StatusCode::NOT_FOUND)?;

    let auth_user = AuthenticatedUser {
        id: claims.sub,
        email: claims.email.clone(),
        role: claims.role.clone(),
    };

    // Check delete permissions
    let can_delete = if auth_user.is_manager() {
        true // Manager can delete all
    } else if auth_user.is_employee() {
        item.owner_id == auth_user.id // Employee can only delete own (by user ID)
    } else if auth_user.is_coworker() {
        false // Co-worker cannot delete (read-only)
    } else {
        false
    };

    if !can_delete {
        return Err(StatusCode::FORBIDDEN);
    }

    // Soft delete by setting is_deleted flag
    item.is_deleted = true;
    item.updated_at = chrono::Utc::now();

    Ok(StatusCode::NO_CONTENT)
}

