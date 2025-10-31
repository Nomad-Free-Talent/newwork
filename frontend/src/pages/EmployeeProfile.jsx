import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { format } from 'date-fns'
import '../App.css'

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [polishFeedback, setPolishFeedback] = useState(false)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const canViewAll = user?.role === 'manager' || (user?.role === 'employee' && employee?.email === user?.email)
  const canEdit = canViewAll
  const canLeaveFeedback = user?.role === 'coworker' || user?.role === 'employee'

  useEffect(() => {
    fetchEmployee()
  }, [id])

  const fetchEmployee = async () => {
    try {
      const response = await api.get(`/employees/${id}`)
      setEmployee(response.data)
    } catch (err) {
      setError('Failed to load employee profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const formData = new FormData(e.target)
    const updates = {
      name: formData.get('name') || undefined,
      email: formData.get('email') || undefined,
      position: formData.get('position') || undefined,
      department: formData.get('department') || undefined,
      salary: formData.get('salary') ? parseFloat(formData.get('salary')) : undefined,
      phone: formData.get('phone') || undefined,
      address: formData.get('address') || undefined,
    }

    // Remove undefined fields
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key])

    try {
      const response = await api.put(`/employees/${id}`, updates)
      setEmployee(response.data)
      setIsEditing(false)
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError('Failed to update profile')
    }
  }

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    setSubmittingFeedback(true)
    setError('')

    try {
      await api.post('/feedback', {
        user_id: id,
        content: feedback,
        polish: polishFeedback,
      })
      setFeedback('')
      setPolishFeedback(false)
      setSuccess('Feedback submitted successfully!')
    } catch (err) {
      setError('Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!employee) {
    return <div className="app-container"><div className="error">Employee not found</div></div>
  }

  return (
    <div className="app-container">
      <div className="navbar">
        <h2>Employee Profile</h2>
        <div className="navbar-actions">
          <button className="btn-link" onClick={() => navigate('/employees')}>
            Back to List
          </button>
          <button className="btn-link" onClick={() => navigate('/absences')}>
            Absence Management
          </button>
          <button className="btn-link" onClick={() => navigate('/data-items')}>
            Data Items
          </button>
          <span>Logged in as: {user?.email} ({user?.role})</span>
          <button className="btn-link" onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        {!isEditing ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h1>{employee.name}</h1>
              {canEdit && (
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>

            <div className="info-row">
              <div className="info-label">Email:</div>
              <div className="info-value">{employee.email}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Position:</div>
              <div className="info-value">{employee.position}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Department:</div>
              <div className="info-value">{employee.department}</div>
            </div>
            {canViewAll && employee.salary && (
              <div className="info-row">
                <div className="info-label">Salary:</div>
                <div className="info-value">${employee.salary.toLocaleString()}</div>
              </div>
            )}
            {canViewAll && employee.phone && (
              <div className="info-row">
                <div className="info-label">Phone:</div>
                <div className="info-value">{employee.phone}</div>
              </div>
            )}
            {canViewAll && employee.address && (
              <div className="info-row">
                <div className="info-label">Address:</div>
                <div className="info-value">{employee.address}</div>
              </div>
            )}
            <div className="info-row">
              <div className="info-label">Hire Date:</div>
              <div className="info-value">
                {format(new Date(employee.hire_date), 'MMMM d, yyyy')}
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleUpdate}>
            <h1>Edit Profile</h1>
            <div className="form-group">
              <label>Name</label>
              <input name="name" defaultValue={employee.name} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" defaultValue={employee.email} required />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input name="position" defaultValue={employee.position} required />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input name="department" defaultValue={employee.department} required />
            </div>
            {canViewAll && (
              <>
                <div className="form-group">
                  <label>Salary</label>
                  <input
                    name="salary"
                    type="number"
                    step="0.01"
                    defaultValue={employee.salary || ''}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" defaultValue={employee.phone || ''} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input name="address" defaultValue={employee.address || ''} />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary">Save</button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {canLeaveFeedback && (
        <div className="card">
          <h2>Leave Feedback</h2>
          <form onSubmit={handleFeedbackSubmit}>
            <div className="form-group">
              <label htmlFor="feedback">Feedback</label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
                placeholder="Share your thoughts about this employee..."
              />
            </div>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="polish"
                checked={polishFeedback}
                onChange={(e) => setPolishFeedback(e.target.checked)}
              />
              <label htmlFor="polish">Polish with AI</label>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingFeedback}
            >
              {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

