import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { authAPI, apiHelpers } from '../../utils/api.js';
import './AuthPages.css';

const Register = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [userRole, setUserRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Basic validation
    if (!phoneNumber || phoneNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      setLoading(false);
      return;
    }

    if (!email || !password) {
      setError('Email and password are required');
      setLoading(false);
      return;
    }

    try {
      const mobile_number = `+91${phoneNumber}`;
      const response = await authAPI.register(email, password, mobile_number, userRole);
      
      setSuccessMessage('Registration successful! You can now login.');
      
      // Auto-redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      setError(apiHelpers.handleError(error));
    } finally {
      setLoading(false);
    }
  };

    const navigateToLogin = () => {
    navigate('/login');
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
           <div className="auth-icon-wrapper">
             {/* Smartphone Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="auth-icon"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the Partner community</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
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

          {successMessage && (
            <div className="success-message" style={{
              color: '#059669',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '4px',
              padding: '8px 12px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {successMessage}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="register-phone">Enter Mobile Number</label>
            <div className="input-prefix-container">
              <span className="input-prefix">+91</span>
              <input
                id="register-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="input-field with-prefix"
                placeholder="1234567890"
                maxLength="10"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="********"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="register-address">Address (Optional)</label>
            <input
              id="register-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
              placeholder="123 Main St, Anytown"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="register-pincode">Pincode (Optional)</label>
            <input
              id="register-pincode"
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="input-field"
              placeholder="123456"
              maxLength="6"
            />
          </div>

          <div className="input-group">
              <label htmlFor="register-usertype">User Type</label>
              <select
                name="role"
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="input-field"
                required
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="both">Both (Buyer & Seller)</option>
              </select>
            </div>    

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-switcher">
          Already have an account?{' '}
          <button onClick={navigateToLogin} className="switch-button">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};
export default Register;