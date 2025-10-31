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
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterStatus, setFilterStatus] = useState('all')

  const isManager = user?.role === 'manager'
  const isEmployee = user?.role === 'employee'
  const isCoworker = user?.role === 'coworker'

  // Sorting algorithm for absences
  const sortAbsences = (absencesList) => {
    const filtered = filterStatus === 'all' 
      ? absencesList 
      : absencesList.filter(a => a.status === filterStatus)
    
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'start_date':
          aVal = new Date(a.start_date).getTime()
          bVal = new Date(b.start_date).getTime()
          break
        case 'end_date':
          aVal = new Date(a.end_date).getTime()
          bVal = new Date(b.end_date).getTime()
          break
        case 'status':
          aVal = a.status?.toLowerCase() || ''
          bVal = b.status?.toLowerCase() || ''
          break
        case 'created_at':
        default:
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
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
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '2px' }}>
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

        {/* Sort and Filter Controls */}
        {absences.length > 0 && (
          <div className="sort-controls">
            {isManager && (
              <>
                <label>Filter by status:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </>
            )}
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created_at">Created Date</option>
              <option value="start_date">Start Date</option>
              <option value="end_date">End Date</option>
              {isManager && <option value="status">Status</option>}
            </select>
            <label>Order:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        )}

        {absences.length === 0 ? (
          <div className="empty-state">
            <h3>No Absence Requests</h3>
            <p>
              {isManager 
                ? 'No absence requests found.' 
                : 'No absence requests yet. Click "New Request" to create one.'}
            </p>
          </div>
        ) : (
          <div className="scrollable" style={{ maxHeight: '600px' }}>
            {sortAbsences(absences).map((absence) => {
              const isPending = absence.status === 'pending'
              
              const statusBadge = {
                pending: 'badge badge-pending',
                approved: 'badge badge-approved',
                rejected: 'badge badge-rejected',
              }[absence.status] || 'badge'

              return (
                <div key={absence.id} style={{ padding: '1rem', marginBottom: '1rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '2px' }}>
                  {isManager && (
                    <div className="info-row">
                      <div className="info-label">User:</div>
                      <div className="info-value text-truncate">{getUserName(absence.user_id)}</div>
                    </div>
                  )}
                  <div className="info-row">
                    <div className="info-label">Status:</div>
                    <div className="info-value">
                      <span className={statusBadge}>{absence.status}</span>
                    </div>
                  </div>
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
                    <div className="info-value text-truncate-2">{absence.reason}</div>
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
