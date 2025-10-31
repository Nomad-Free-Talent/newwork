use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::models::{Employee, Feedback, AbsenceRequest, User, DataItem};

pub type Db = Arc<RwLock<HashMap<String, Employee>>>;
pub type FeedbackDb = Arc<RwLock<Vec<Feedback>>>;
pub type AbsenceDb = Arc<RwLock<Vec<AbsenceRequest>>>;
pub type UserDb = Arc<RwLock<HashMap<String, User>>>;
pub type DataItemDb = Arc<RwLock<HashMap<String, DataItem>>>;

#[derive(Clone)]
pub struct AppState {
    pub employees: Db,
    pub feedbacks: FeedbackDb,
    pub absences: AbsenceDb,
    pub users: UserDb,
    pub data_items: DataItemDb,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            employees: Arc::new(RwLock::new(HashMap::new())),
            feedbacks: Arc::new(RwLock::new(Vec::new())),
            absences: Arc::new(RwLock::new(Vec::new())),
            users: Arc::new(RwLock::new(HashMap::new())),
            data_items: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

