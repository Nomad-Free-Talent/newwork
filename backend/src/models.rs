use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Employee {
    pub id: String,
    pub name: String,
    pub email: String,
    pub position: String,
    pub department: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub salary: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub address: Option<String>,
    pub hire_date: DateTime<Utc>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub manager_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmployeePublic {
    pub id: String,
    pub name: String,
    pub email: String,
    pub position: String,
    pub department: String,
    pub hire_date: DateTime<Utc>,
}

impl From<Employee> for EmployeePublic {
    fn from(emp: Employee) -> Self {
        Self {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            position: emp.position,
            department: emp.department,
            hire_date: emp.hire_date,
        }
    }
}

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
    pub employee_id: String,
    pub from_user_id: String,
    pub content: String,
    pub polished_content: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFeedbackRequest {
    pub employee_id: String,
    pub content: String,
    pub polish: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbsenceRequest {
    pub id: String,
    pub employee_id: String,
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
pub struct UpdateEmployeeRequest {
    pub name: Option<String>,
    pub email: Option<String>,
    pub position: Option<String>,
    pub department: Option<String>,
    pub salary: Option<f64>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataItem {
    pub id: String,
    pub title: String,
    pub description: String,
    pub owner_id: String, // User ID of the owner
    pub is_deleted: bool,
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

