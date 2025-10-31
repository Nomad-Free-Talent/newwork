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
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [filterRole, setFilterRole] = useState('all')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Sorting algorithm for users
  const sortUsers = (usersList) => {
    const filtered = filterRole === 'all' 
      ? usersList 
      : usersList.filter(u => u.role === filterRole)
    
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || ''
          bVal = b.name?.toLowerCase() || ''
          break
        case 'email':
          aVal = a.email?.toLowerCase() || ''
          bVal = b.email?.toLowerCase() || ''
          break
        case 'role':
          aVal = a.role?.toLowerCase() || ''
          bVal = b.role?.toLowerCase() || ''
          break
        default:
          aVal = a.name?.toLowerCase() || ''
          bVal = b.name?.toLowerCase() || ''
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      }
    })
    return sorted
  }

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
        return 'badge badge-manager'
      case 'coworker':
        return 'badge badge-coworker'
      case 'employee':
        return 'badge badge-employee'
      default:
        return 'badge'
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
          <form onSubmit={handleCreateUser} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '2px' }}>
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

        {/* Sort and Filter Controls */}
        {users.length > 0 && (
          <div className="sort-controls">
            <label>Filter by role:</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="manager">Managers</option>
              <option value="employee">Employees</option>
              <option value="coworker">Co-workers</option>
            </select>
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
            </select>
            <label>Order:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        )}

        {users.length === 0 ? (
          <div className="empty-state">
            <h3>No Users</h3>
            <p>Click "Add New User" to create one.</p>
          </div>
        ) : (
          <div className="grid">
            {sortUsers(users).map((u) => {
              const badgeClass = getRoleBadgeClass(u.role)
              
              return (
                <div
                  key={u.id}
                  className="employee-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="text-truncate" style={{ margin: '0 0 0.5rem 0' }}>
                        {u.name}
                      </h3>
                      <span className={badgeClass}>
                        {u.role}
                      </span>
                    </div>
                    {u.id !== user?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteUser(u.id, u.name)
                        }}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        title="Delete user"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <div className="info-row">
                    <div className="info-label">Email:</div>
                    <div className="info-value text-truncate">
                      {u.email}
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">User ID:</div>
                    <div className="info-value text-truncate" style={{ fontSize: '0.875rem', color: '#666' }}>
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

