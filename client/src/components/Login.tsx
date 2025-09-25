import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export default function Login({ onSwitchToRegister }: LoginProps) {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear auth error when user makes changes
    if (error) {
      clearError();
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      // Login success will be handled by AuthContext and App.tsx
    } catch (error) {
      // Error is already handled by AuthContext
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your MyAssistant account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              disabled={loading}
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.password ? 'error' : ''}`}
              placeholder="Enter your password"
              disabled={loading}
            />
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
          </div>

          {/* Auth Error Display */}
          {error && (
            <div className="auth-error">
              <span className="error-message">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">
                Signing In...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}