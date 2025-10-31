import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import '../App.css'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
  })
  const [submitting, setSubmitting] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user?.role !== 'manager') {
      navigate('/data-items')
      return
    }
    fetchUsers()
  }, [user])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }

      await api.post('/users', payload)
      setSuccess('User created successfully!')
      setFormData({ name: '', email: '', password: '', role: 'employee' })
      setShowUserForm(false)
      fetchUsers()
    } catch (err) {
      if (err.response?.status === 409) {
        setError('User with this email already exists')
      } else {
        setError(err.response?.data?.error || 'Failed to create user')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    if (userId === user?.id) {
      setError('You cannot delete your own account')
      return
    }

    setError('')
    setSuccess('')

    try {
      await api.delete(`/users/${userId}`)
      setSuccess('User deleted successfully!')
      fetchUsers()
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Cannot delete this user')
      } else {
        setError(err.response?.data?.error || 'Failed to delete user')
      }
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (user?.role !== 'manager') {
    return null
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'manager':
        return { bg: '#d4edda', color: '#155724' }
      case 'coworker':
        return { bg: '#cfe2ff', color: '#084298' }
      case 'employee':
        return { bg: '#fff3cd', color: '#856404' }
      default:
        return { bg: '#e0e0e0', color: '#333' }
    }
  }

  return (
    <div className="app-container">
      <div className="navbar">
        <h2>NEWWORK User Management</h2>
        <div className="navbar-actions">
          <span>Logged in as: {user?.email} ({user?.role})</span>
          <button className="btn-link" onClick={() => navigate('/absences')}>
            Absence Management
          </button>
          <button className="btn-link" onClick={() => navigate('/data-items')}>
            Data Items
          </button>
          <button className="btn-link" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>User Management</h1>
          {!showUserForm && (
            <button className="btn btn-primary" onClick={() => setShowUserForm(true)}>
              Add New User
            </button>
          )}
        </div>

        {user?.role === 'manager' && showUserForm && (
          <form onSubmit={handleCreateUser} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3>Create New User</h3>
            
            <div className="form-group">
              <label htmlFor="user-name">Name</label>
              <input
                id="user-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Full Name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-email">Email</label>
              <input
                id="user-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="user@newwork.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-password">Password</label>
              <input
                id="user-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-role">Role</label>
              <select
                id="user-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
                <option value="coworker">Co-worker</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create User'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowUserForm(false)
                  setFormData({ name: '', email: '', password: '', role: 'employee' })
                  setError('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {users.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No users found. Click "Add New User" to create one.
          </p>
        ) : (
          <div className="grid">
            {users.map((u) => {
              const badge = getRoleBadgeClass(u.role)
              
              return (
                <div
                  key={u.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#667eea' }}>
                        {u.name}
                      </h3>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: badge.bg,
                          color: badge.color,
                          display: 'inline-block',
                          marginBottom: '0.5rem',
                          textTransform: 'capitalize',
                        }}
                      >
                        {u.role}
                      </span>
                    </div>
                    {u.id !== user?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUser(u.id, u.name)
                        }}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                        }}
                        title="Delete user"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <div className="info-row">
                    <div className="info-label">Email:</div>
                    <div className="info-value">
                      {u.email}
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">User ID:</div>
                    <div className="info-value" style={{ fontSize: '0.875rem', color: '#666' }}>
                      {u.id}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

