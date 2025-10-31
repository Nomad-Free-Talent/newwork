# NEWWORK Employee Profile System

A modern, full-stack employee profile management application built with React + Vite (frontend) and Axum/Rust (backend), featuring elegant authentication and authorization management with role-based access control.

## Introduction

This application demonstrates a comprehensive HR management system with three user roles: **Managers**, **Employees**, and **Co-workers**. Each role has specific permissions and access levels, enabling secure and efficient workforce management.

### Main Features

#### 🔐 Authentication & Authorization
- **JWT-based authentication** for secure API access
- **Role-based access control (RBAC)** with three distinct permission levels
- **Middleware protection** for all protected routes
- **Automatic token management** with interceptors

#### 👥 User Management (Manager Only)
- **Create, view, update, and delete users**
- **User roles**: Manager, Employee, Co-worker
- **User directory** with filtering and sorting capabilities
- **Prevention of self-deletion** for security

#### 📊 Data Items Management
- **Create and manage data items** with access control based on ownership
- **Soft deletion** with `is_deleted` flag
- **Role-based permissions**:
  - **Managers**: Full access (read/write/delete all data)
  - **Employees**: Read/write/delete only their own data
  - **Co-workers**: Read-only access to all data
- **Feedback system**: Co-workers can comment on data items
- **AI-enhanced feedback**: Optional HuggingFace AI polishing for feedback content

#### 📅 Absence Request Management
- **Employees**: Request absences and view their status
- **Managers**: Approve/reject absence requests
- **Co-workers**: No access to absence management
- **Status tracking**: Pending, Approved, Rejected

#### 💬 Feedback System
- **Co-workers** can leave feedback on employee profiles and data items
- **AI-powered enhancement**: Optional text polishing using HuggingFace API
- **Original and polished versions** displayed for AI-enhanced feedback

#### 🎨 Modern UI Design
- **Flat design** with clean, minimal interface
- **Responsive layout** that works on all screen sizes
- **Sorting and filtering** for all list views
- **Text truncation** and overflow handling
- **Empty states** and loading indicators

## Tech Stack

### Backend
- **Rust** with **Axum 0.7** web framework
- **JWT** (jsonwebtoken 9.3) for authentication
- **bcrypt 0.15** for password hashing
- **In-memory storage** using `Arc<RwLock<HashMap>>` and `Arc<RwLock<Vec>>` for thread-safe access
- **Migration system** for data seeding
- **HuggingFace API** integration for AI feedback polishing

### Frontend
- **React 18** with **Vite 5** for fast development
- **React Router 6** for navigation and route protection
- **Axios** for HTTP requests with interceptors
- **date-fns** for date formatting
- **Flat design** CSS with responsive grid layouts

## Quick Start Guide

### Prerequisites

Install the following on your system:

1. **Rust** (latest stable version)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Node.js** 18+ and npm
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use a version manager like `nvm`

3. **OpenSSL development libraries** (for Rust crypto dependencies)
   - **Ubuntu/Debian**:
     ```bash
     sudo apt-get update
     sudo apt-get install libssl-dev pkg-config
     ```
   - **Fedora/CentOS**:
     ```bash
     sudo dnf install openssl-devel
     ```
   - **macOS**:
     ```bash
     brew install openssl
     ```

### Running the Application

#### 1. Start the Backend

Open a terminal and navigate to the backend directory:

```bash
cd backend
```

Build and run the Rust backend (first build may take 5-10 minutes):

```bash
cargo run
```

The backend server will start on **http://localhost:3000**

You should see output like:
```
Backend server running on http://0.0.0.0:3000
Seeded 3 default users
Seeded 7 default data items
```

#### 2. Start the Frontend

Open a **new terminal** and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies (first time only):

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

Vite will automatically proxy `/api` requests to the backend on port 3000.

#### 3. Access the Application

1. Open your browser and go to **http://localhost:5173**
2. You'll see the login page with demo account information
3. Log in with any of the demo accounts below

### Demo Accounts

| Role | Email | Password | Capabilities |
|------|-------|----------|--------------|
| **Manager** | manager@newwork.com | password123 | Full access: user management, absence approval, all data items |
| **Employee** | employee@newwork.com | password123 | Own profile, request absences, manage own data items |
| **Co-worker** | coworker@newwork.com | password123 | Read-only data access, can leave feedback on data items |

## Project Structure

```
newwork/
├── backend/
│   ├── src/
│   │   ├── main.rs          # Application entry point, server setup
│   │   ├── auth.rs          # JWT token generation/validation, middleware
│   │   ├── handlers.rs      # API endpoint handlers (CRUD operations)
│   │   ├── models.rs        # Data structures (User, Feedback, Absence, DataItem)
│   │   ├── routes.rs         # Route definitions and middleware application
│   │   ├── state.rs         # Application state (in-memory databases)
│   │   └── migrations.rs    # Data seeding and migration system
│   └── Cargo.toml           # Rust dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── EmployeeList.jsx    # User Management (Manager only)
│   │   │   ├── EmployeeProfile.jsx
│   │   │   ├── AbsenceRequest.jsx  # Absence management
│   │   │   └── DataItems.jsx       # Data items with feedback
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Authentication state management
│   │   ├── services/
│   │   │   └── api.js              # Axios configuration and interceptors
│   │   ├── App.jsx                 # Main app component, routing
│   │   ├── App.css                 # Global styles (flat design)
│   │   └── main.jsx                # React entry point
│   ├── vite.config.js        # Vite configuration with proxy
│   └── package.json          # Node.js dependencies
│
└── README.md                 # This file
```

## API Endpoints

All API endpoints are prefixed with `/api`.

### Public Endpoints
- `POST /api/auth/login` - Authenticate user (returns JWT token)

### Protected Endpoints (require JWT token in Authorization header)

#### User Management (Manager only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Data Items
- `GET /api/data-items` - List data items (filtered by role)
- `GET /api/data-items/:id` - Get specific data item
- `POST /api/data-items` - Create data item
- `PUT /api/data-items/:id` - Update data item
- `DELETE /api/data-items/:id` - Soft delete data item
- `POST /api/data-items/:id/feedback` - Add feedback (Co-worker only)

#### Absence Requests
- `POST /api/absences` - Create absence request (Employee only)
- `GET /api/absences/me` - Get current user's absences (Employee only)
- `GET /api/absences` - List all absences (Manager only)
- `PUT /api/absences/:id/status` - Update absence status (Manager only)

## Architectural Decisions

### 1. Authentication & Authorization

**JWT Tokens**: Stateless authentication enables horizontal scaling and easy client integration. Tokens contain user ID, email, role, and name in claims.

**Middleware Pattern**: 
- Authentication middleware validates JWT tokens on protected routes
- Claims are extracted and attached to request extensions
- Handlers access user information from extensions, avoiding database lookups

**Role-Based Access Control**:
- Implemented at both middleware and handler levels
- Three-tier permission system:
  - **Managers**: Full administrative access
  - **Employees**: Owner-based access (can only modify own data)
  - **Co-workers**: Read-only access with feedback capabilities

### 2. Data Storage

**In-Memory Storage**:
- Using `Arc<RwLock<HashMap>>` for thread-safe concurrent access
- `HashMap<String, User>` keyed by email for O(1) lookups
- `HashMap<String, DataItem>` keyed by ID
- `Vec<Feedback>` and `Vec<AbsenceRequest>` for append-heavy operations
- Easy to replace with database without changing business logic

**Migration System**:
- Automatic data seeding on server startup
- Idempotent migrations (safe to run multiple times)
- Default users and sample data items for demo purposes
- Located in `backend/src/migrations.rs`

**Soft Deletion**:
- Data items use `is_deleted` flag instead of permanent deletion
- Allows data recovery and audit trails
- Deleted items filtered from normal views

### 3. Frontend Architecture

**Context API for State Management**:
- `AuthContext` provides global authentication state
- Simple and sufficient for this application size
- Could be upgraded to Redux/Zustand if complexity grows

**Route Protection**:
- `PrivateRoute` component wraps protected pages
- `ManagerOnlyRoute` restricts routes to managers
- `RoleBasedRedirect` automatically redirects users based on role after login

**Axios Interceptors**:
- Automatically attach JWT token to all requests
- Redirect to login on 401 responses
- Centralized error handling

### 4. Data Items Access Control

Demonstrates sophisticated RBAC implementation:
- **Manager**: Full CRUD on all items
- **Employee**: CRUD only on items where `owner_id == user_id`
- **Co-worker**: Read-only on all items, can add feedback
- Ownership determined by `owner_id` field matching user ID

### 5. Feedback System

**Design Decisions**:
- Feedback stored directly in `DataItem` model as `Vec<DataItemFeedback>`
- Each feedback includes original content and optional AI-polished version
- Co-workers can only comment on non-deleted items
- AI enhancement is optional (checkbox in UI)

**AI Integration**:
- Uses HuggingFace Inference API (free tier)
- Graceful fallback if API unavailable
- Set `HUGGINGFACE_TOKEN` environment variable for authenticated requests (optional)

### 6. UI/UX Design

**Flat Design Philosophy**:
- Minimal styling: 1px borders, 2px border radius
- No gradients, shadows, or excessive effects
- Material Design color palette (#2196F3, #f44336, etc.)
- Clean typography with proper hierarchy

**Responsive Grid**:
- CSS Grid with `repeat(auto-fill, minmax(min(100%, 320px), 1fr))`
- Adapts from single column on mobile to multi-column on desktop
- Minimum card width of 320px ensures readability

**Overflow Handling**:
- Text truncation utilities (1-line, 2-line, 3-line ellipsis)
- Scrollable containers for long lists (feedback, absences)
- Custom styled scrollbars
- Word-break and overflow-wrap for long strings

**Sorting & Filtering**:
- Client-side sorting for immediate feedback
- Multiple sort criteria per feature (date, name, status, etc.)
- Filtering by role or status
- Sorting algorithms handle edge cases (nulls, dates, strings)

## What Can Be Improved

### 1. Database Integration
**Current**: In-memory storage loses data on restart  
**Improvement**: 
- Migrate to PostgreSQL or SQLite
- Add proper schema migrations with tools like `sqlx-migrate` or `diesel`
- Implement connection pooling
- Add database indexes for performance

### 2. Testing
**Current**: No automated tests  
**Improvement**:
- **Backend**: Unit tests for handlers, integration tests for API endpoints
- **Frontend**: Component tests with React Testing Library, E2E tests with Playwright
- Test coverage targets: 80%+ for critical paths
- CI/CD pipeline with automated testing

### 3. Security Enhancements
**Current**: Basic JWT authentication  
**Improvement**:
- Rate limiting (e.g., 100 requests/minute per IP)
- Input validation and sanitization (prevent SQL injection, XSS)
- CSRF protection for state-changing operations
- Refresh token mechanism for better security
- Password strength requirements and reset flow
- HTTPS enforcement in production
- Security headers (HSTS, CSP, X-Frame-Options)

### 4. Features
**Current**: Core functionality implemented  
**Improvement**:
- Email notifications for absence approvals/rejections
- File uploads (avatars, documents)
- Advanced search and filtering with debouncing
- Pagination for large datasets
- Export functionality (CSV, PDF reports)
- Activity logs and audit trails
- Calendar view for absences
- Bulk operations for managers

### 5. Developer Experience
**Current**: Manual setup required  
**Improvement**:
- **Docker**: Docker Compose for one-command setup
- **Environment variables**: `.env` files with validation
- **API Documentation**: OpenAPI/Swagger with interactive docs
- **Hot reload**: Better development experience with file watchers
- **Error tracking**: Sentry integration for production errors
- **Logging**: Structured logging with levels (DEBUG, INFO, WARN, ERROR)

### 6. Performance
**Current**: Basic implementation  
**Improvement**:
- **Caching**: Redis for session data and frequently accessed items
- **Database indexing**: Indexes on foreign keys and frequently queried fields
- **Frontend optimization**: Code splitting, lazy loading, React.memo where appropriate
- **API optimization**: Response pagination, field selection, query optimization
- **CDN**: Static asset delivery for production

### 7. UI/UX Enhancements
**Current**: Flat design with basic functionality  
**Improvement**:
- Dark mode toggle
- Toast notifications for actions (success/error)
- Skeleton loaders instead of "Loading..." text
- Form validation with inline error messages
- Accessibility: ARIA labels, keyboard navigation, screen reader support
- Animations: Smooth transitions for state changes
- Progressive Web App (PWA) support

### 8. Code Quality
**Current**: Functional but could be more organized  
**Improvement**:
- TypeScript for frontend (better type safety)
- Error handling: Custom error types, proper error propagation
- Code organization: Feature-based folder structure
- Documentation: Inline code comments, function documentation
- Linting: ESLint for frontend, Clippy for Rust backend
- Pre-commit hooks: Format code, run linters before commit

## Troubleshooting

### Backend Issues

**Problem**: `cargo run` fails with OpenSSL errors  
**Solution**: Install OpenSSL development libraries (see Prerequisites)

**Problem**: Port 3000 already in use  
**Solution**: 
- Kill the process: `lsof -ti:3000 | xargs kill`
- Or change port in `backend/src/main.rs`

**Problem**: JWT validation errors  
**Solution**: Ensure `JWT_SECRET` environment variable is set (or use default for development)

### Frontend Issues

**Problem**: `npm install` fails  
**Solution**: 
- Update Node.js to version 18+
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then reinstall

**Problem**: API calls fail with CORS errors  
**Solution**: 
- Ensure backend is running on port 3000
- Check `vite.config.js` proxy configuration
- Verify API base URL in `frontend/src/services/api.js`

**Problem**: Blank page after login  
**Solution**: 
- Check browser console for errors
- Verify JWT token is stored in localStorage
- Check network tab for failed API calls
