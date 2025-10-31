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

  const canCreate = user?.role === 'manager' || user?.role === 'employee'
  const canEdit = user?.role === 'manager' || (user?.role === 'employee')
  const canDelete = user?.role === 'manager' || (user?.role === 'employee')
  const isReadOnly = user?.role === 'coworker'

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
              <button className="btn-link" onClick={() => navigate('/employees')}>
                Employee Directory
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
          <form onSubmit={editingItem ? handleUpdate : handleCreate} style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
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

        {dataItems.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
            No data items found. {canCreate && 'Click "New Data Item" to create one.'}
          </p>
        ) : (
          <div className="grid">
            {dataItems.map((item) => {
              const ownerInfo = getOwnerInfo(item.owner_id)
              const canEditThis = canEdit && (user?.role === 'manager' || item.owner_id === user?.id)
              const canDeleteThis = canDelete && (user?.role === 'manager' || item.owner_id === user?.id)

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                    border: item.is_deleted ? '2px solid #dc3545' : '1px solid #e0e0e0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#667eea' }}>
                        {item.title}
                      </h3>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: ownerInfo.bg,
                          color: ownerInfo.color,
                          display: 'inline-block',
                          marginBottom: '0.5rem',
                          marginRight: '0.5rem',
                        }}
                        title={ownerInfo.email}
                      >
                        {ownerInfo.role.charAt(0).toUpperCase() + ownerInfo.role.slice(1)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {ownerInfo.email}
                      </span>
                      {item.is_deleted && (
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: '#f8d7da',
                            color: '#721c24',
                            marginLeft: '0.5rem',
                            display: 'inline-block',
                          }}
                        >
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

                  <p style={{ color: '#666', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                    {item.description}
                  </p>

                  <div style={{ fontSize: '0.875rem', color: '#999', borderTop: '1px solid #e0e0e0', paddingTop: '0.75rem' }}>
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

