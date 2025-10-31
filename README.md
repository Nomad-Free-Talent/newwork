# NEWWORK Employee Profile System

A modern, full-stack employee profile management application built with React + Vite (frontend) and Axum/Rust (backend), featuring elegant authentication and authorization management.

## Features

- **Role-Based Access Control**: Different permission levels for managers, employees, and co-workers
- **Employee Profiles**: View and edit employee information based on role
- **Feedback System**: Co-workers and employees can leave feedback with optional AI-powered polishing
- **Absence Requests**: Employees can request time off
- **JWT Authentication**: Secure token-based authentication
- **Elegant UI**: Modern, responsive design with gradient backgrounds

## Tech Stack

### Backend
- **Rust** with **Axum** web framework
- **JWT** for authentication
- **bcrypt** for password hashing
- **in-memory storage** (for demo purposes - easily replaceable with database)

### Frontend
- **React 18** with **Vite**
- **React Router** for navigation
- **Axios** for API calls
- **date-fns** for date formatting

## Project Structure

```
newwork/
├── backend/
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── auth.rs           # Authentication & authorization
│   │   ├── handlers.rs       # API request handlers
│   │   ├── models.rs         # Data models
│   │   ├── routes.rs         # API routes
│   │   └── state.rs          # Application state (in-memory DB)
│   └── Cargo.toml
├── frontend/
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React contexts (Auth)
│   │   ├── services/         # API service
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- **Rust** (latest stable version) - [Install Rust](https://www.rust-lang.org/tools/install)
- **Node.js** 18+ and **npm** - [Install Node.js](https://nodejs.org/)
- **Cargo** (comes with Rust)
- **OpenSSL development libraries**:
  - Ubuntu/Debian: `sudo apt-get install libssl-dev pkg-config`
  - Fedora: `sudo dnf install openssl-devel`
  - macOS: `brew install openssl`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Build and run the backend server:
```bash
cargo run
```

The backend will start on `http://localhost:3000`

**Note**: The first build may take several minutes as it downloads and compiles dependencies.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Demo Accounts

The application comes with three pre-configured demo accounts:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Manager | manager@newwork.com | password123 | Can view and edit all employee data |
| Employee | employee@newwork.com | password123 | Can view/edit own profile, request absences, leave feedback |
| Co-worker | coworker@newwork.com | password123 | Can view public employee data, leave feedback |

## API Endpoints

All API endpoints are prefixed with `/api`.

### Public Endpoints
- `POST /api/auth/login` - Authenticate user and receive JWT token

### Protected Endpoints (require JWT token)
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee profile (filtered by role)
- `PUT /api/employees/:id` - Update employee profile (role-based permissions)
- `POST /api/feedback` - Submit feedback for an employee
- `POST /api/absences` - Create absence request
- `GET /api/absences/me` - Get current user's absence requests
- `GET /api/data-items` - List data items (filtered by role)
- `GET /api/data-items/:id` - Get specific data item
- `POST /api/data-items` - Create data item
- `PUT /api/data-items/:id` - Update data item
- `DELETE /api/data-items/:id` - Soft delete data item

## Architecture Decisions

### Authentication & Authorization

1. **JWT Tokens**: Chosen for stateless authentication, making the API scalable and easy to integrate with different clients.

2. **Role-Based Access Control (RBAC)**: Implemented at both the middleware level (route protection) and handler level (data filtering).

3. **Permission Granularity**:
   - **Managers**: Full access to all employee data
   - **Employees**: Full access to their own profile, can request absences
   - **Co-workers**: Limited to public data view, can leave feedback

4. **Middleware Pattern**: Authentication middleware extracts and validates JWT tokens, attaching claims to request extensions for handlers to use.

### Data Storage

- **In-Memory Storage**: For this demo, data is stored in memory using `Arc<RwLock<HashMap>>` for thread-safe access.
- **Migration System**: Initial data seeding is handled by migrations (`src/migrations.rs`). Migrations run automatically on server startup and are idempotent (won't duplicate data if run multiple times).
- **Easy Database Migration**: The storage abstraction makes it straightforward to replace with a real database (PostgreSQL, MongoDB, etc.) without changing business logic.

### Data Items & Access Control Example

The application includes a data items feature that demonstrates sophisticated access control:

- **Data Item Structure**: Each item has `title`, `description`, `owner` (manager/coworker/employee), and `is_deleted` flag
- **Access Control Rules**:
  - **Manager**: Full access - can read, write, and delete all data items
  - **Co-worker**: Read-only access - can read all data items but cannot create, update, or delete
  - **Employee**: Owner-based access - can only read, write, and delete data items where `owner == "employee"`

This serves as a practical example of role-based access control implementation.

### Frontend Architecture

1. **Context API**: Used for global authentication state management
2. **Protected Routes**: React Router with custom `PrivateRoute` component
3. **Axios Interceptors**: Automatically attach JWT tokens and handle 401 errors

### AI Feedback Polishing

- Integrated with HuggingFace Inference API for text polishing
- Falls back gracefully if API is unavailable or token is missing
- Optional feature - users can choose whether to use AI polishing
- To enable full AI polishing, set `HUGGINGFACE_TOKEN` environment variable (optional)

## What I'd Improve With More Time

1. **Database Integration**: Replace in-memory storage with PostgreSQL or SQLite
   - Add proper migrations
   - Implement connection pooling
   - Add query optimization

2. **Testing**:
   - Unit tests for authentication logic
   - Integration tests for API endpoints
   - Frontend component tests
   - E2E tests with Playwright/Cypress

3. **Security Enhancements**:
   - Rate limiting
   - Input validation and sanitization
   - CSRF protection
   - Secure password reset flow
   - Refresh token mechanism

4. **Features**:
   - Absence approval workflow for managers
   - Email notifications
   - File uploads for employee avatars
   - Search and filtering for employee list
   - Pagination for large datasets

5. **Developer Experience**:
   - Docker containerization
   - Hot reload improvements
   - Better error messages
   - API documentation (OpenAPI/Swagger)
   - Environment variable management

6. **Performance**:
   - Caching layer (Redis)
   - Database indexing
   - Frontend code splitting
   - Optimistic UI updates

7. **UI/UX**:
   - Dark mode
   - Better loading states
   - Toast notifications
   - Form validation feedback
   - Accessibility improvements (ARIA labels, keyboard navigation)

## Running in Production

For production deployment:

1. Set `JWT_SECRET` environment variable
2. Configure proper database connection
3. Set up CORS properly (currently allows all origins)
4. Use environment variables for all secrets
5. Enable HTTPS
6. Set up proper logging
7. Configure rate limiting

## License

This is a demo project for NEWWORK's coding challenge.

