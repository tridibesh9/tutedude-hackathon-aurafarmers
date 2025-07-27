import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { authAPI, apiHelpers } from '../../utils/api.js';
import './AuthPages.css';

const Login = ({ setUserRole, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token is still valid
      authAPI.verifyToken()
        .then(() => {
          navigate('/dashboard');
        })
        .catch(() => {
          // Token invalid, remove it
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
        });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);
      
      // Store token and user type
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('userType', response.user_type);
      
      // Update app state
      if (setUserRole) setUserRole(response.user_type);
      if (setIsAuthenticated) setIsAuthenticated(true);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };
    const navigateToRegister = () => {
    navigate('/register');
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            {/* Smartphone Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-icon"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          </div>
          <h1 className="auth-title">Partner</h1>
          <p className="auth-subtitle">Your trusted partner</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {error && (
            <div className="error-message" style={{
              color: '#ef4444',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              padding: '8px 12px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="login-phone">Enter Mobile Number (Optional)</label>
            <div className="input-prefix-container">
              <span className="input-prefix">+91</span>
              <input
                id="login-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input-field with-prefix"
                placeholder="1234567890"
                maxLength="10"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="********"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-switcher">
          Don't have an account?{' '}
          <button onClick={navigateToRegister} className="switch-button">
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;