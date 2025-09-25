import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RegisterRequest } from '../types/auth.types';
import './Register.css';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    username: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
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

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Username validation (optional but if provided, should be valid)
    if (formData.username && formData.username.trim().length < 2) {
      errors.username = 'Username must be at least 2 characters';
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
      // Remove empty optional fields
      const registrationData: RegisterRequest = {
        email: formData.email,
        password: formData.password,
        ...(formData.username?.trim() && { username: formData.username.trim() }),
      };

      await register(registrationData);
      // Registration successful - show success message
      setRegistrationSuccess(true);
      // User will need to manually click "Sign In" to go to login
    } catch (error) {
      // Error is already handled by AuthContext
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create Account</h1>
          <p>Join MyAssistant to get started</p>
        </div>

        {/* Success Message */}
        {registrationSuccess && (
          <div className="success-message">
            <h3>🎉 Account Created Successfully!</h3>
            <p>Your account has been created. Please log in to continue.</p>
            <button 
              type="button" 
              className="switch-button"
              onClick={onSwitchToLogin}
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* Registration Form - only show if not successful */}
        {!registrationSuccess && (
          <form onSubmit={handleSubmit} className="register-form">
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username || ''}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.username ? 'error' : ''}`}
              placeholder="Username (optional)"
              disabled={loading}
            />
            {validationErrors.username && (
              <span className="error-message">{validationErrors.username}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address *
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
              required
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.password ? 'error' : ''}`}
              placeholder="Create a password (min. 6 characters)"
              disabled={loading}
              required
            />
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              disabled={loading}
              required
            />
            {validationErrors.confirmPassword && (
              <span className="error-message">{validationErrors.confirmPassword}</span>
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
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        )}

        {/* Switch to Login */}
        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}