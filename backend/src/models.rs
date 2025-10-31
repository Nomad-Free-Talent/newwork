use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub password_hash: String,
    pub role: String, // "manager", "employee", "coworker"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: UserInfo,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserInfo {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub name: String,
    pub email: String,
    pub password: String,
    pub role: String, // "manager", "employee", "coworker"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Feedback {
    pub id: String,
    pub user_id: String, // User ID the feedback is for
    pub from_user_id: String, // User ID who created the feedback
    pub content: String,
    pub polished_content: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFeedbackRequest {
    pub user_id: String, // User ID the feedback is for
    pub content: String,
    pub polish: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbsenceRequest {
    pub id: String,
    pub user_id: String, // User ID who requested the absence
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub reason: String,
    pub status: AbsenceStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AbsenceStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(Debug, Deserialize)]
pub struct CreateAbsenceRequest {
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAbsenceStatusRequest {
    pub status: AbsenceStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub name: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataItemFeedback {
    pub id: String,
    pub from_user_id: String, // User ID who created the feedback
    pub content: String,
    pub polished_content: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataItem {
    pub id: String,
    pub title: String,
    pub description: String,
    pub owner_id: String, // User ID of the owner
    pub is_deleted: bool,
    pub feedbacks: Vec<DataItemFeedback>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDataItemRequest {
    pub title: String,
    pub description: String,
    pub owner_id: Option<String>, // Optional for managers to assign to others, required for employees (defaults to current user)
}

#[derive(Debug, Deserialize)]
pub struct UpdateDataItemRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub is_deleted: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct AddDataItemFeedbackRequest {
    pub content: String,
    pub polish: Option<bool>,
}

