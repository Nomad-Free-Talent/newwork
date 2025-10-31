import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { format } from 'date-fns'
import '../App.css'

export default function AbsenceRequest() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [absences, setAbsences] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [updating, setUpdating] = useState(null)

  const isManager = user?.role === 'manager'
  const isEmployee = user?.role === 'employee'
  const isCoworker = user?.role === 'coworker'

  useEffect(() => {
    if (isCoworker) {
      setLoading(false)
      return
    }
    
    fetchAbsences()
    if (isManager) {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const fetchAbsences = async () => {
    try {
      const endpoint = isManager ? '/absences' : '/absences/me'
      const response = await api.get(endpoint)
      setAbsences(response.data)
    } catch (err) {
      setError('Failed to load absence requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEmployee) return
    
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await api.post('/absences', {
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        reason: formData.reason,
      })
      setSuccess('Absence request submitted successfully!')
      setFormData({ start_date: '', end_date: '', reason: '' })
      setShowForm(false)
      fetchAbsences()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit absence request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async (absenceId) => {
    setUpdating(absenceId)
    setError('')
    setSuccess('')

    try {
      await api.put(`/absences/${absenceId}/status`, { status: 'approved' })
      setSuccess('Absence request approved!')
      fetchAbsences()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve absence request')
    } finally {
      setUpdating(null)
    }
  }

  const handleReject = async (absenceId) => {
    setUpdating(absenceId)
    setError('')
    setSuccess('')

    try {
      await api.put(`/absences/${absenceId}/status`, { status: 'rejected' })
      setSuccess('Absence request rejected!')
      fetchAbsences()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject absence request')
    } finally {
      setUpdating(null)
    }
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : `User ${userId}`
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (isCoworker) {
    return (
      <div className="app-container">
        <div className="navbar">
          <h2>Absence Requests</h2>
          <div className="navbar-actions">
            <button className="btn-link" onClick={() => navigate('/users')}>
              User Management
            </button>
            <button className="btn-link" onClick={() => navigate('/data-items')}>
              Data Items
            </button>
            <span>Logged in as: {user?.email} ({user?.role})</span>
            <button className="btn-link" onClick={logout}>Logout</button>
          </div>
        </div>
        <div className="card">
          <h1>Access Restricted</h1>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            Co-workers do not have access to absence management.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="navbar">
        <h2>{isManager ? 'Absence Management' : 'My Absence Requests'}</h2>
        <div className="navbar-actions">
          {isManager && (
            <button className="btn-link" onClick={() => navigate('/users')}>
              User Management
            </button>
          )}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>{isManager ? 'All Absence Requests' : 'My Absence Requests'}</h1>
          {isEmployee && (
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'New Request'}
            </button>
          )}
        </div>

        {isEmployee && showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <div className="form-group">
              <label htmlFor="start_date">Start Date</label>
              <input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="end_date">End Date</label>
              <input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reason">Reason</label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                placeholder="Please provide a reason for your absence..."
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}

        {absences.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            {isManager 
              ? 'No absence requests found.' 
              : 'No absence requests yet. Click "New Request" to create one.'}
          </p>
        ) : (
          <div>
            {absences.map((absence) => {
              const isPending = absence.status === 'pending'
              
              return (
                <div key={absence.id} style={{ padding: '1rem', marginBottom: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                  {isManager && (
                    <div className="info-row">
                      <div className="info-label">User:</div>
                      <div className="info-value">{getUserName(absence.user_id)}</div>
                    </div>
                  )}
                  <div className="info-row">
                    <div className="info-label">Start Date:</div>
                    <div className="info-value">
                      {format(new Date(absence.start_date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">End Date:</div>
                    <div className="info-value">
                      {format(new Date(absence.end_date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Reason:</div>
                    <div className="info-value">{absence.reason}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Status:</div>
                    <div className="info-value">
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        background: absence.status === 'approved' ? '#d4edda' :
                                    absence.status === 'rejected' ? '#f8d7da' : '#fff3cd',
                        color: absence.status === 'approved' ? '#155724' :
                               absence.status === 'rejected' ? '#721c24' : '#856404',
                        textTransform: 'capitalize',
                        fontWeight: '600',
                      }}>
                        {absence.status}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">Submitted:</div>
                    <div className="info-value">
                      {format(new Date(absence.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                  
                  {isManager && isPending && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApprove(absence.id)}
                        disabled={updating === absence.id}
                        style={{ flex: 1 }}
                      >
                        {updating === absence.id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleReject(absence.id)}
                        disabled={updating === absence.id}
                        style={{ flex: 1 }}
                      >
                        {updating === absence.id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
