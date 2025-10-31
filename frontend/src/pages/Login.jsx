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
      // Redirect based on role - will be handled by RoleBasedRedirect in App.jsx
      navigate('/')
    } else {
      setError(result.error || 'Invalid email or password')
    }
    
    setLoading(false)
  }

  return (
    <div className="app-container">
      <div style={{ maxWidth: '400px', margin: '5rem auto', width: '100%' }}>
        <div className="card">
          <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            NEWWORK
          </h1>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '400', color: '#666' }}>
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
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0', fontSize: '0.875rem', color: '#666' }}>
            <p style={{ fontWeight: '500', marginBottom: '0.5rem', color: '#333' }}>Demo Accounts:</p>
            <p style={{ margin: '0.25rem 0', wordBreak: 'break-word' }}>Manager: manager@newwork.com</p>
            <p style={{ margin: '0.25rem 0', wordBreak: 'break-word' }}>Employee: employee@newwork.com</p>
            <p style={{ margin: '0.25rem 0', wordBreak: 'break-word' }}>Co-worker: coworker@newwork.com</p>
            <p style={{ margin: '0.25rem 0' }}>Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

