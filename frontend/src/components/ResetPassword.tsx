import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const token = searchParams.get('token');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setError('Invalid or missing reset token.');
      return;
    }

    // For now, assume token is valid
    // In a real app, you might want to validate the token with the server
    setIsValidToken(true);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setPassword('');
        setConfirmPassword('');
        
        // Redirect to login after successful reset
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successful! You can now log in with your new password.' 
            }
          });
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isValidToken === null) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <div className="card shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
          <div className="card-body p-5 text-center">
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '4rem', color: '#dc3545', marginBottom: '1.5rem' }}></i>
            <h2 style={{ color: '#273C63', fontWeight: 'bold', marginBottom: '1rem' }}>Invalid Reset Link</h2>
            <p className="text-muted mb-4">
              This password reset link is invalid or has expired. Please request a new password reset.
            </p>
            <button
              onClick={handleBackToLogin}
              className="btn btn-primary"
              style={{ 
                backgroundColor: '#dc3545', 
                borderColor: '#dc3545',
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                fontWeight: '500'
              }}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="row h-100">
        {/* Left side - Background image */}
        <div 
          className="col-md-8 d-none d-md-block"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(39,60,99,0.85) 0%, rgba(102,105,131,0.75) 100%)'
            }}
          ></div>
          
          {/* Overlay content */}
          <div 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'white',
              zIndex: 1
            }}
          >
            <div style={{ marginBottom: '2rem' }}>
              <i className="fas fa-shield-alt" style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.9 }}></i>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Reset Your Password</h1>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '400px' }}>
                Create a new secure password for your TimeSheet Pro account
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem' }}>
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-lock" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.8 }}></i>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Secure</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-key" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.8 }}></i>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Encrypted</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-user-shield" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.8 }}></i>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Protected</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Reset form */}
        <div className="col-md-4 d-flex align-items-center justify-content-center">
          <div className="w-100" style={{ maxWidth: '400px', padding: '2rem' }}>
            <div className="text-center mb-4">
              <div style={{ marginBottom: '1.5rem' }}>
                <i className="fas fa-key" style={{ fontSize: '2.5rem', color: '#273C63', marginBottom: '0.5rem' }}></i>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#273C63', marginBottom: '0.25rem' }}>Reset Password</h2>
                <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: 0 }}>TimeSheet Pro</p>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#495057', marginBottom: '0.5rem' }}>Create New Password</h3>
              <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>Enter your new secure password</p>
            </div>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success" role="alert">
                <i className="fas fa-check-circle me-2"></i>
                {success}
                <br />
                <small>Redirecting to login page...</small>
              </div>
            )}
            
            {!success && (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <div className="input-group">
                    <span className="input-group-text" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da' }}>
                      <i className="fas fa-lock" style={{ color: '#6c757d', fontSize: '0.9rem' }}></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ fontSize: '0.95rem', padding: '0.75rem' }}
                    />
                  </div>
                  <small className="text-muted">
                    Must contain at least 6 characters with uppercase, lowercase, and numbers
                  </small>
                </div>
                
                <div className="mb-4">
                  <div className="input-group">
                    <span className="input-group-text" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da' }}>
                      <i className="fas fa-lock" style={{ color: '#6c757d', fontSize: '0.9rem' }}></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{ fontSize: '0.95rem', padding: '0.75rem' }}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="btn w-100 mb-3"
                  style={{ 
                    backgroundColor: '#dc3545', 
                    border: 'none',
                    color: 'white',
                    padding: '0.75rem',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    borderRadius: '0.375rem'
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check me-2"></i>
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            )}
            
            <div className="text-center mt-4">
              <button
                onClick={handleBackToLogin}
                className="btn btn-link text-decoration-none"
                style={{ fontSize: '0.9rem', color: '#6c757d' }}
              >
                <i className="fas fa-arrow-left me-2"></i>
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
