import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../App.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      navigate('/employees')
    } else {
      setError(result.error || 'Invalid email or password')
    }
    
    setLoading(false)
  }

  return (
    <div className="app-container">
      <div style={{ maxWidth: '400px', margin: '5rem auto' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            NEWWORK
          </h1>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            Employee Portal
          </h2>
          
          {error && <div className="error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="manager@newwork.com"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="password123"
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
            <p><strong>Demo Accounts:</strong></p>
            <p>Manager: manager@newwork.com</p>
            <p>Employee: employee@newwork.com</p>
            <p>Co-worker: coworker@newwork.com</p>
            <p>Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

