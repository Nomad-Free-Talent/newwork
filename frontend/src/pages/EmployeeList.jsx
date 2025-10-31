import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import '../App.css'

export default function EmployeeList() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
            My Absences
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

      <div className="card">
        <h1>Employees</h1>
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

