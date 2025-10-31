use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::models::{Employee, Feedback, AbsenceRequest, User};

pub type Db = Arc<RwLock<HashMap<String, Employee>>>;
pub type FeedbackDb = Arc<RwLock<Vec<Feedback>>>;
pub type AbsenceDb = Arc<RwLock<Vec<AbsenceRequest>>>;
pub type UserDb = Arc<RwLock<HashMap<String, User>>>;

#[derive(Clone)]
pub struct AppState {
    pub employees: Db,
    pub feedbacks: FeedbackDb,
    pub absences: AbsenceDb,
    pub users: UserDb,
}

impl AppState {
    pub fn new() -> Self {
        let mut users = HashMap::new();
        let mut employees = HashMap::new();
        
        // Initialize with sample data
        let user1 = User {
            id: "1".to_string(),
            email: "manager@newwork.com".to_string(),
            password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5LS2QvGqk7qOe".to_string(), // password: "password123"
            role: "manager".to_string(),
            employee_id: Some("1".to_string()),
        };
        
        let user2 = User {
            id: "2".to_string(),
            email: "employee@newwork.com".to_string(),
            password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5LS2QvGqk7qOe".to_string(),
            role: "employee".to_string(),
            employee_id: Some("2".to_string()),
        };
        
        let user3 = User {
            id: "3".to_string(),
            email: "coworker@newwork.com".to_string(),
            password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5LS2QvGqk7qOe".to_string(),
            role: "coworker".to_string(),
            employee_id: None,
        };
        
        users.insert(user1.email.clone(), user1);
        users.insert(user2.email.clone(), user2);
        users.insert(user3.email.clone(), user3);
        
        let emp1 = Employee {
            id: "1".to_string(),
            name: "John Manager".to_string(),
            email: "manager@newwork.com".to_string(),
            position: "Engineering Manager".to_string(),
            department: "Engineering".to_string(),
            salary: Some(120000.0),
            phone: Some("+1-555-0101".to_string()),
            address: Some("123 Tech St, San Francisco, CA".to_string()),
            hire_date: chrono::Utc::now() - chrono::Duration::days(365),
            manager_id: None,
        };
        
        let emp2 = Employee {
            id: "2".to_string(),
            name: "Jane Employee".to_string(),
            email: "employee@newwork.com".to_string(),
            position: "Software Engineer".to_string(),
            department: "Engineering".to_string(),
            salary: Some(95000.0),
            phone: Some("+1-555-0102".to_string()),
            address: Some("456 Dev Ave, San Francisco, CA".to_string()),
            hire_date: chrono::Utc::now() - chrono::Duration::days(180),
            manager_id: Some("1".to_string()),
        };
        
        employees.insert(emp1.id.clone(), emp1);
        employees.insert(emp2.id.clone(), emp2);
        
        Self {
            employees: Arc::new(RwLock::new(employees)),
            feedbacks: Arc::new(RwLock::new(Vec::new())),
            absences: Arc::new(RwLock::new(Vec::new())),
            users: Arc::new(RwLock::new(users)),
        }
    }
}

