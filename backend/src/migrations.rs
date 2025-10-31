use chrono::Utc;
use tracing::info;

use crate::models::{User, DataItem};
use crate::state::AppState;

pub async fn run_migrations(state: &AppState) {
    info!("Running database migrations...");
    
    seed_default_users(state).await;
    seed_default_data_items(state).await;
    
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
        name: "John Manager".to_string(),
        email: "manager@newwork.com".to_string(),
        password_hash: password_hash.clone(),
        role: "manager".to_string(),
    };
    
    let user2 = User {
        id: "2".to_string(),
        name: "Jane Employee".to_string(),
        email: "employee@newwork.com".to_string(),
        password_hash: password_hash.clone(),
        role: "employee".to_string(),
    };
    
    let user3 = User {
        id: "3".to_string(),
        name: "Bob Co-worker".to_string(),
        email: "coworker@newwork.com".to_string(),
        password_hash,
        role: "coworker".to_string(),
    };
    
    users.insert(user1.email.clone(), user1);
    users.insert(user2.email.clone(), user2);
    users.insert(user3.email.clone(), user3);
    
    info!("Seeded 3 default users");
}

async fn seed_default_data_items(state: &AppState) {
    let mut data_items = state.data_items.write().await;
    
    // Check if data items already exist
    if !data_items.is_empty() {
        info!("Data items already seeded, skipping...");
        return;
    }
    
    info!("Seeding default data items...");
    
    let now = Utc::now();
    
    // Manager-owned data (user ID: "1")
    let sensitive1 = DataItem {
        id: "data-1".to_string(),
        title: "Sensitive Financial Report".to_string(),
        description: "Q4 financial analysis with revenue projections and budget allocations".to_string(),
        owner_id: "1".to_string(), // manager@newwork.com
        is_deleted: false,
        created_at: now - chrono::Duration::days(30),
        updated_at: now - chrono::Duration::days(5),
    };
    
    let sensitive2 = DataItem {
        id: "data-2".to_string(),
        title: "Employee Salary Data".to_string(),
        description: "Confidential salary information for engineering team members".to_string(),
        owner_id: "1".to_string(), // manager@newwork.com
        is_deleted: false,
        created_at: now - chrono::Duration::days(20),
        updated_at: now - chrono::Duration::days(3),
    };
    
    // Co-worker-owned data (user ID: "3")
    let nonsensitive1 = DataItem {
        id: "data-3".to_string(),
        title: "Team Meeting Notes".to_string(),
        description: "Weekly standup notes and action items from engineering team meetings".to_string(),
        owner_id: "3".to_string(), // coworker@newwork.com
        is_deleted: false,
        created_at: now - chrono::Duration::days(10),
        updated_at: now - chrono::Duration::days(2),
    };
    
    let nonsensitive2 = DataItem {
        id: "data-4".to_string(),
        title: "Project Documentation".to_string(),
        description: "Public project documentation and technical specifications".to_string(),
        owner_id: "3".to_string(), // coworker@newwork.com
        is_deleted: false,
        created_at: now - chrono::Duration::days(15),
        updated_at: now - chrono::Duration::days(1),
    };
    
    // Employee-owned data (user ID: "2")
    let employee_data1 = DataItem {
        id: "data-5".to_string(),
        title: "Personal Task List".to_string(),
        description: "My personal task list and work items for the current sprint".to_string(),
        owner_id: "2".to_string(), // employee@newwork.com
        is_deleted: false,
        created_at: now - chrono::Duration::days(7),
        updated_at: now - chrono::Duration::hours(12),
    };
    
    let employee_data2 = DataItem {
        id: "data-6".to_string(),
        title: "Learning Notes".to_string(),
        description: "Personal notes from learning sessions and training materials".to_string(),
        owner_id: "2".to_string(), // employee@newwork.com
        is_deleted: false,
        created_at: now - chrono::Duration::days(5),
        updated_at: now - chrono::Duration::hours(6),
    };
    
    // Deleted item example (employee-owned)
    let deleted_item = DataItem {
        id: "data-7".to_string(),
        title: "Old Project Plan".to_string(),
        description: "Outdated project plan that has been replaced".to_string(),
        owner_id: "2".to_string(), // employee@newwork.com
        is_deleted: true,
        created_at: now - chrono::Duration::days(60),
        updated_at: now - chrono::Duration::days(30),
    };
    
    data_items.insert(sensitive1.id.clone(), sensitive1);
    data_items.insert(sensitive2.id.clone(), sensitive2);
    data_items.insert(nonsensitive1.id.clone(), nonsensitive1);
    data_items.insert(nonsensitive2.id.clone(), nonsensitive2);
    data_items.insert(employee_data1.id.clone(), employee_data1);
    data_items.insert(employee_data2.id.clone(), employee_data2);
    data_items.insert(deleted_item.id.clone(), deleted_item);
    
    info!("Seeded 7 default data items (sensitive, non-sensitive, employee-owned, and deleted examples)");
}

