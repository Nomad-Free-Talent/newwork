import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import '../App.css'

export default function EmployeeList() {
  const [employees, setEmployees] = useState([])
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
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees')
      setEmployees(response.data)
    } catch (err) {
      setError('Failed to load employees')
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

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app-container">
      <div className="navbar">
        <h2>NEWWORK Employee Directory</h2>
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
          <h1>Employee Directory</h1>
          {user?.role === 'manager' && !showUserForm && (
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

        <h2 style={{ marginBottom: '1rem' }}>Employees</h2>
        <div className="grid">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="employee-card"
              onClick={() => navigate(`/employees/${employee.id}`)}
            >
              <h3>{employee.name}</h3>
              <p><strong>Position:</strong> {employee.position}</p>
              <p><strong>Department:</strong> {employee.department}</p>
              <p><strong>Email:</strong> {employee.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

