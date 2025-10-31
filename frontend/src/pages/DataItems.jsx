import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import { format } from 'date-fns'
import '../App.css'

export default function DataItems() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dataItems, setDataItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    owner_id: null,
  })
  const [users, setUsers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [feedbackForms, setFeedbackForms] = useState({})
  const [feedbackContent, setFeedbackContent] = useState({})
  const [polishFeedback, setPolishFeedback] = useState({})
  const [submittingFeedback, setSubmittingFeedback] = useState({})
  const [sortBy, setSortBy] = useState('updated_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const canCreate = user?.role === 'manager' || user?.role === 'employee'
  const canEdit = user?.role === 'manager' || (user?.role === 'employee')
  const canDelete = user?.role === 'manager' || (user?.role === 'employee')
  const isReadOnly = user?.role === 'coworker'
  const canComment = user?.role === 'coworker'

  // Sorting algorithm for data items
  const sortDataItems = (items) => {
    const sorted = [...items].sort((a, b) => {
      let aVal, bVal

      switch (sortBy) {
        case 'title':
          aVal = a.title?.toLowerCase() || ''
          bVal = b.title?.toLowerCase() || ''
          break
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        case 'updated_at':
        default:
          aVal = new Date(a.updated_at).getTime()
          bVal = new Date(b.updated_at).getTime()
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
    // Fetch users for owner info display (managers and co-workers can fetch all users)
    if (user?.role === 'manager' || user?.role === 'coworker') {
      fetchUsers()
    } else if (user) {
      // For employees, just add current user
      setUsers([user])
    }
    
    // Fetch data items
    fetchDataItems()
  }, [user])


  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      // Always include current user in the list
      const allUsers = response.data
      if (user && !allUsers.find(u => u.id === user.id)) {
        allUsers.push(user)
      }
      setUsers(allUsers)
    } catch (err) {
      console.error('Failed to load users:', err)
      // Fallback: use current user
      if (user) {
        setUsers([user])
      }
    }
  }

  const fetchDataItems = async () => {
    try {
      const response = await api.get('/data-items')
      // Filter out deleted items for non-managers, unless they own them
      const filtered = response.data.filter(item => {
        if (!item.is_deleted) return true
        // Show deleted items only to managers or if employee owns them
        return user?.role === 'manager' || (user?.role === 'employee' && item.owner_id === user?.id)
      })
      setDataItems(filtered)
    } catch (err) {
      setError('Failed to load data items')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        owner_id: user?.role === 'manager' ? formData.owner_id || user.id : user.id,
      }
      await api.post('/data-items', payload)
      setSuccess('Data item created successfully!')
      setFormData({ title: '', description: '', owner_id: null })
      setShowForm(false)
      fetchDataItems()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create data item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item) => {
    // Check if user can edit this item
    if (user?.role === 'employee' && item.owner_id !== user.id) {
      setError('You can only edit your own data items')
      return
    }
    if (isReadOnly) {
      setError('You have read-only access')
      return
    }
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      owner_id: item.owner_id,
    })
    setShowForm(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      await api.put(`/data-items/${editingItem.id}`, {
        title: formData.title,
        description: formData.description,
      })
      setSuccess('Data item updated successfully!')
      setEditingItem(null)
      setFormData({ title: '', description: '', owner_id: null })
      setShowForm(false)
      fetchDataItems()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update data item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (item) => {
    const isRestoring = item.is_deleted
    const action = isRestoring ? 'restore' : 'delete'
    
    if (!window.confirm(`Are you sure you want to ${action} this item?`)) {
      return
    }

    setError('')
    setSuccess('')

    try {
      if (isRestoring) {
        // Restore by setting is_deleted to false
        await api.put(`/data-items/${item.id}`, { is_deleted: false })
        setSuccess('Data item restored successfully!')
      } else {
        // Delete by setting is_deleted to true
        await api.delete(`/data-items/${item.id}`)
        setSuccess('Data item deleted successfully!')
      }
      fetchDataItems()
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} data item`)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingItem(null)
    setFormData({ title: '', description: '', owner_id: null })
    setError('')
  }

  const getOwnerInfo = (ownerId) => {
    const ownerUser = users.find(u => u.id === ownerId) || 
                     (ownerId === user?.id ? user : null)
    if (!ownerUser) {
      return { email: 'Unknown', role: 'unknown', bg: '#e0e0e0', color: '#333' }
    }
    
    const roleColors = {
      manager: { bg: '#d4edda', color: '#155724' },
      coworker: { bg: '#cfe2ff', color: '#084298' },
      employee: { bg: '#fff3cd', color: '#856404' },
    }
    
    return {
      email: ownerUser.email,
      role: ownerUser.role,
      ...roleColors[ownerUser.role] || { bg: '#e0e0e0', color: '#333' }
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="app-container">
      <div className="navbar">
        <h2>Data Items Management</h2>
        <div className="navbar-actions">
          {user?.role === 'manager' && (
            <>
              <button className="btn-link" onClick={() => navigate('/users')}>
                User Management
              </button>
              <button className="btn-link" onClick={() => navigate('/absences')}>
                Absence Management
              </button>
            </>
          )}
          {user?.role === 'employee' && (
            <button className="btn-link" onClick={() => navigate('/absences')}>
              My Absences
            </button>
          )}
          <span>Logged in as: {user?.email} ({user?.role})</span>
          <button className="btn-link" onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Data Items</h1>
          {canCreate && !showForm && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              New Data Item
            </button>
          )}
          {isReadOnly && (
            <span style={{ color: '#666', fontSize: '0.9rem' }}>Read-only access</span>
          )}
        </div>

        {showForm && (
          <form onSubmit={editingItem ? handleUpdate : handleCreate} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '2px' }}>
            <h3>{editingItem ? 'Edit Data Item' : 'Create New Data Item'}</h3>
            
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                placeholder="Enter description"
                rows="4"
              />
            </div>

            {user?.role === 'manager' && !editingItem && (
              <div className="form-group">
                <label htmlFor="owner_id">Owner</label>
                <select
                  id="owner_id"
                  value={formData.owner_id || user.id}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                  required
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.email} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {user?.role === 'employee' && (
              <input type="hidden" value={user.id} />
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Sort Controls */}
        {dataItems.length > 0 && (
          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="updated_at">Last Updated</option>
              <option value="created_at">Created Date</option>
              <option value="title">Title</option>
            </select>
            <label>Order:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        )}

        {dataItems.length === 0 ? (
          <div className="empty-state">
            <h3>No Data Items</h3>
            <p>{canCreate ? 'Click "New Data Item" to create one.' : 'No data items available.'}</p>
          </div>
        ) : (
          <div className="grid">
            {sortDataItems(dataItems).map((item) => {
              const ownerInfo = getOwnerInfo(item.owner_id)
              const canEditThis = canEdit && (user?.role === 'manager' || item.owner_id === user?.id)
              const canDeleteThis = canDelete && (user?.role === 'manager' || item.owner_id === user?.id)

              return (
                <div
                  key={item.id}
                  className={`data-item-card ${item.is_deleted ? 'deleted' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 className="text-truncate" style={{ margin: '0 0 0.5rem 0' }}>
                        {item.title}
                      </h3>
                      <span
                        className={`badge badge-${ownerInfo.role}`}
                        style={{ marginBottom: '0.5rem', marginRight: '0.5rem' }}
                        title={ownerInfo.email}
                      >
                        {ownerInfo.role.charAt(0).toUpperCase() + ownerInfo.role.slice(1)}
                      </span>
                      <span className="text-truncate" style={{ fontSize: '0.75rem', color: '#666', display: 'block' }}>
                        {ownerInfo.email}
                      </span>
                      {item.is_deleted && (
                        <span className="badge" style={{ background: '#ffebee', color: '#c62828', marginLeft: '0.5rem' }}>
                          Deleted
                        </span>
                      )}
                    </div>
                    {(canEditThis || canDeleteThis) && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {canEditThis && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClick={() => handleEdit(item)}
                            disabled={item.is_deleted}
                          >
                            Edit
                          </button>
                        )}
                        {canDeleteThis && (
                          <button
                            className={item.is_deleted ? "btn btn-primary" : "btn btn-danger"}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClick={() => handleDelete(item)}
                          >
                            {item.is_deleted ? 'Restore' : 'Delete'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-truncate-3" style={{ color: '#666', margin: '0 0 1rem 0', lineHeight: '1.5', flex: 1 }}>
                    {item.description}
                  </p>

                  {/* Feedback Section for Co-workers */}
                  {canComment && !item.is_deleted && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                      <button
                        onClick={() => setFeedbackForms({ ...feedbackForms, [item.id]: !feedbackForms[item.id] })}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', marginBottom: feedbackForms[item.id] ? '1rem' : 0 }}
                      >
                        {feedbackForms[item.id] ? 'Cancel' : 'Add Feedback'}
                      </button>

                      {feedbackForms[item.id] && (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault()
                            setSubmittingFeedback({ ...submittingFeedback, [item.id]: true })
                            setError('')
                            setSuccess('')
                            try {
                              await api.post(`/data-items/${item.id}/feedback`, {
                                content: feedbackContent[item.id] || '',
                                polish: polishFeedback[item.id] || false,
                              })
                              setSuccess('Feedback added successfully!')
                              setFeedbackForms({ ...feedbackForms, [item.id]: false })
                              setFeedbackContent({ ...feedbackContent, [item.id]: '' })
                              setPolishFeedback({ ...polishFeedback, [item.id]: false })
                              fetchDataItems()
                            } catch (err) {
                              setError(err.response?.data?.error || 'Failed to add feedback')
                            } finally {
                              setSubmittingFeedback({ ...submittingFeedback, [item.id]: false })
                            }
                          }}
                          style={{ marginTop: '1rem' }}
                        >
                          <div className="form-group">
                            <label htmlFor={`feedback-${item.id}`}>Feedback</label>
                            <textarea
                              id={`feedback-${item.id}`}
                              value={feedbackContent[item.id] || ''}
                              onChange={(e) => setFeedbackContent({ ...feedbackContent, [item.id]: e.target.value })}
                              required
                              placeholder="Enter your feedback..."
                              rows="3"
                              maxLength={500}
                            />
                          </div>
                          <div className="checkbox-group">
                            <input
                              type="checkbox"
                              id={`polish-${item.id}`}
                              checked={polishFeedback[item.id] || false}
                              onChange={(e) => setPolishFeedback({ ...polishFeedback, [item.id]: e.target.checked })}
                            />
                            <label htmlFor={`polish-${item.id}`}>Enhance with AI</label>
                          </div>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submittingFeedback[item.id]}
                            style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            {submittingFeedback[item.id] ? 'Submitting...' : 'Submit Feedback'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Display Feedbacks */}
                  {item.feedbacks && item.feedbacks.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Feedbacks ({item.feedbacks.length})</h4>
                      <div className="scrollable" style={{ maxHeight: '200px' }}>
                        {item.feedbacks.map((feedback) => {
                        const feedbackUser = users.find(u => u.id === feedback.from_user_id)
                        return (
                          <div key={feedback.id} style={{ padding: '0.75rem', background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '2px', marginBottom: '0.5rem' }}>
                            <div className="text-truncate" style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', fontWeight: '500' }}>
                              {feedbackUser ? feedbackUser.name : 'Unknown'} - {format(new Date(feedback.created_at), 'MMM d, yyyy')}
                            </div>
                            {feedback.polished_content ? (
                              <div>
                                <div className="text-truncate-2" style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>
                                  Original: {feedback.content}
                                </div>
                                <div className="text-truncate-3" style={{ fontSize: '0.875rem', color: '#2196F3', fontWeight: '500' }}>
                                  ✨ AI-Enhanced: {feedback.polished_content}
                                </div>
                              </div>
                            ) : (
                              <div className="text-truncate-3" style={{ fontSize: '0.875rem', wordBreak: 'break-word' }}>
                                {feedback.content}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      </div>
                    </div>
                  )}

                        <div style={{ fontSize: '0.875rem', color: '#999', borderTop: '1px solid #e0e0e0', paddingTop: '0.75rem', marginTop: 'auto' }}>
                    <div>Created: {format(new Date(item.created_at), 'MMM d, yyyy')}</div>
                    <div>Updated: {format(new Date(item.updated_at), 'MMM d, yyyy')}</div>
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

