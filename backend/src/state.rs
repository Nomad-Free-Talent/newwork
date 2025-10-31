use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::models::{Feedback, AbsenceRequest, User, DataItem};

pub type FeedbackDb = Arc<RwLock<Vec<Feedback>>>;
pub type AbsenceDb = Arc<RwLock<Vec<AbsenceRequest>>>;
pub type UserDb = Arc<RwLock<HashMap<String, User>>>;
pub type DataItemDb = Arc<RwLock<HashMap<String, DataItem>>>;

#[derive(Clone)]
pub struct AppState {
    pub feedbacks: FeedbackDb,
    pub absences: AbsenceDb,
    pub users: UserDb,
    pub data_items: DataItemDb,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            feedbacks: Arc::new(RwLock::new(Vec::new())),
            absences: Arc::new(RwLock::new(Vec::new())),
            users: Arc::new(RwLock::new(HashMap::new())),
            data_items: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

