use chrono::Utc;
use tracing::info;

use crate::models::{Employee, User};
use crate::state::AppState;

pub async fn run_migrations(state: &AppState) {
    info!("Running database migrations...");
    
    seed_default_users(state).await;
    seed_default_employees(state).await;
    
    info!("Database migrations completed");
}

async fn seed_default_users(state: &AppState) {
    let mut users = state.users.write().await;
    
    // Check if users already exist
    if !users.is_empty() {
        info!("Users already seeded, skipping...");
        return;
    }
    
    info!("Seeding default users...");
    
    // Hash for "password123"
    // Using bcrypt with cost 12
    let password_hash = bcrypt::hash("password123", 12)
        .expect("Failed to hash default password");
    
    let user1 = User {
        id: "1".to_string(),
        email: "manager@newwork.com".to_string(),
        password_hash: password_hash.clone(),
        role: "manager".to_string(),
        employee_id: Some("1".to_string()),
    };
    
    let user2 = User {
        id: "2".to_string(),
        email: "employee@newwork.com".to_string(),
        password_hash: password_hash.clone(),
        role: "employee".to_string(),
        employee_id: Some("2".to_string()),
    };
    
    let user3 = User {
        id: "3".to_string(),
        email: "coworker@newwork.com".to_string(),
        password_hash,
        role: "coworker".to_string(),
        employee_id: None,
    };
    
    users.insert(user1.email.clone(), user1);
    users.insert(user2.email.clone(), user2);
    users.insert(user3.email.clone(), user3);
    
    info!("Seeded 3 default users");
}

async fn seed_default_employees(state: &AppState) {
    let mut employees = state.employees.write().await;
    
    // Check if employees already exist
    if !employees.is_empty() {
        info!("Employees already seeded, skipping...");
        return;
    }
    
    info!("Seeding default employees...");
    
    let emp1 = Employee {
        id: "1".to_string(),
        name: "John Manager".to_string(),
        email: "manager@newwork.com".to_string(),
        position: "Engineering Manager".to_string(),
        department: "Engineering".to_string(),
        salary: Some(120000.0),
        phone: Some("+1-555-0101".to_string()),
        address: Some("123 Tech St, San Francisco, CA".to_string()),
        hire_date: Utc::now() - chrono::Duration::days(365),
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
        hire_date: Utc::now() - chrono::Duration::days(180),
        manager_id: Some("1".to_string()),
    };
    
    employees.insert(emp1.id.clone(), emp1);
    employees.insert(emp2.id.clone(), emp2);
    
    info!("Seeded 2 default employees");
}

