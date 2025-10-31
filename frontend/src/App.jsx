import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import UserManagement from './pages/EmployeeList'
import AbsenceRequest from './pages/AbsenceRequest'
import DataItems from './pages/DataItems'
import './App.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return user ? children : <Navigate to="/login" />
}

function ManagerOnlyRoute({ children }) {
  const { user } = useAuth()

  if (user?.role !== 'manager') {
    return <Navigate to="/data-items" />
  }

  return children
}

function RoleBasedRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  // Redirect based on role
  if (user.role === 'manager') {
    return <Navigate to="/users" />
  } else if (user.role === 'employee') {
    return <Navigate to="/absences" />
  } else {
    return <Navigate to="/data-items" />
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <ManagerOnlyRoute>
              <UserManagement />
            </ManagerOnlyRoute>
          </PrivateRoute>
        }
      />
      <Route
        path="/absences"
        element={
          <PrivateRoute>
            <AbsenceRequest />
          </PrivateRoute>
        }
      />
      <Route
        path="/data-items"
        element={
          <PrivateRoute>
            <DataItems />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<RoleBasedRedirect />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

