import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle success messages from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state to prevent the message from showing on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      setForgotPasswordError('Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    setForgotPasswordMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotPasswordMessage(data.message);
        setForgotPasswordEmail('');
      } else {
        setForgotPasswordError(data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      setForgotPasswordError('Network error. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const openForgotPasswordModal = () => {
    setShowForgotPassword(true);
    setForgotPasswordEmail(email); // Pre-fill with login email if available
    setForgotPasswordError('');
    setForgotPasswordMessage('');
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordError('');
    setForgotPasswordMessage('');
  };

  return (
    <div className="container-fluid" style={{ minHeight: '100vh' }}>
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
              <i className="fas fa-clock" style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.9 }}></i>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>TimeSheet Pro</h1>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '400px' }}>
                Streamline your workforce management with our comprehensive timesheet solution
              </p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem' }}>
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-users" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.8 }}></i>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Team Management</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-chart-line" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.8 }}></i>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Analytics</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <i className="fas fa-shield-alt" style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.8 }}></i>
                <p style={{ fontSize: '0.9rem', margin: 0 }}>Secure</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Login form */}
        <div className="col-md-4 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="w-100" style={{ maxWidth: '380px', padding: '2rem' }}>
            <div className="text-center mb-4">
              <div style={{ marginBottom: '1.5rem' }}>
                <i className="fas fa-clock" style={{ fontSize: '2.5rem', color: '#273C63', marginBottom: '0.5rem' }}></i>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#273C63', marginBottom: '0.25rem' }}>TimeSheet Pro</h2>
                <p style={{ fontSize: '0.85rem', color: '#6c757d', margin: 0 }}>Evolute Global</p>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#495057', marginBottom: '0.5rem' }}>Welcome Back</h3>
              <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: 0 }}>Sign in to your account</p>
            </div>
            
            {successMessage && (
              <div className="alert alert-success" role="alert">
                <i className="fas fa-check-circle me-2"></i>
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-circle me-2"></i>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da' }}>
                    <i className="fas fa-envelope" style={{ color: '#6c757d', fontSize: '0.9rem' }}></i>
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email or Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ fontSize: '0.95rem', padding: '0.75rem' }}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: '#f8f9fa', border: '1px solid #ced4da' }}>
                    <i className="fas fa-lock" style={{ color: '#6c757d', fontSize: '0.9rem' }}></i>
                  </span>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ fontSize: '0.95rem', padding: '0.75rem' }}
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="btn w-100 mb-3"
                style={{ 
                  backgroundColor: '#37b9c2ff', 
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>
            
            <div className="text-center mt-4">
              <div className="d-flex align-items-center mb-3">
                <hr className="flex-grow-1" style={{ height: '1px', backgroundColor: '#dee2e6', border: 'none' }} />
                <span className="px-3 text-muted" style={{ fontSize: '0.85rem' }}>Or continue with</span>
                <hr className="flex-grow-1" style={{ height: '1px', backgroundColor: '#dee2e6', border: 'none' }} />
              </div>
              
              <div className="d-grid gap-2">
                <button className="btn btn-outline-secondary mb-2" style={{ fontSize: '0.9rem', padding: '0.6rem' }}>
                  <i className="fas fa-mobile-alt me-2" style={{ fontSize: '0.85rem' }}></i> Continue with Mobile
                </button>
                
                <button className="btn btn-outline-secondary mb-2" style={{ fontSize: '0.9rem', padding: '0.6rem' }}>
                  <i className="fab fa-microsoft me-2" style={{ fontSize: '0.85rem' }}></i> Continue with Microsoft
                </button>
                
                <button className="btn btn-outline-secondary mb-2" style={{ fontSize: '0.9rem', padding: '0.6rem' }}>
                  <i className="fab fa-google me-2" style={{ fontSize: '0.85rem' }}></i> Continue with Google
                </button>
                
                <button className="btn btn-outline-secondary mb-2" style={{ fontSize: '0.9rem', padding: '0.6rem' }}>
                  <i className="fas fa-id-card me-2" style={{ fontSize: '0.85rem' }}></i> Continue with Employee ID
                </button>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="d-flex justify-content-center mb-3">
                <a href="#" className="me-3">
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" style={{ height: '32px' }} />
                </a>
                <a href="#">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" style={{ height: '32px' }} />
                </a>
              </div>
              
              <p style={{ fontSize: '0.75rem', color: '#6c757d', lineHeight: '1.4' }}>
                <i className="fas fa-clock me-1" style={{ fontSize: '0.7rem', color: '#273C63' }}></i>
                <strong>TimeSheet Pro</strong> by Evolute Global<br/>
                By signing in, you agree to our <a href="#" className="text-decoration-none" style={{ color: '#273C63' }}>Terms of Service</a> and <a href="#" className="text-decoration-none" style={{ color: '#273C63' }}>Privacy Policy</a>
              </p>
              
              <div className="mt-3">
                <button 
                  type="button" 
                  onClick={openForgotPasswordModal}
                  className="btn btn-link p-0 me-3 text-decoration-none" 
                  style={{ fontSize: '0.8rem', color: '#6c757d', border: 'none' }}
                >
                  Forgot Password?
                </button>
                <a href="#" className="text-decoration-none" style={{ fontSize: '0.8rem', color: '#273C63' }}>Need Help?</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <div className="w-100 text-center">
                  <i className="fas fa-key" style={{ fontSize: '2.5rem', color: '#273C63', marginBottom: '1rem' }}></i>
                  <h4 className="modal-title" style={{ color: '#273C63', fontWeight: 'bold' }}>Reset Password</h4>
                  <p className="text-muted mb-0">Enter your email to receive reset instructions</p>
                </div>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeForgotPasswordModal}
                  aria-label="Close"
                ></button>
              </div>
              
              <div className="modal-body pt-3">
                {forgotPasswordMessage && (
                  <div className="alert alert-success" role="alert">
                    <i className="fas fa-check-circle me-2"></i>
                    {forgotPasswordMessage}
                  </div>
                )}
                
                {forgotPasswordError && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {forgotPasswordError}
                  </div>
                )}
                
                {!forgotPasswordMessage && (
                  <form onSubmit={handleForgotPassword}>
                    <div className="mb-3">
                      <label htmlFor="forgotPasswordEmail" className="form-label">
                        <i className="fas fa-envelope me-2"></i>Email Address
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="forgotPasswordEmail"
                        placeholder="Enter your registered email address"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        required
                        autoFocus
                        style={{ fontSize: '0.95rem', padding: '0.75rem' }}
                      />
                    </div>
                    
                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={forgotPasswordLoading}
                        style={{ 
                          backgroundColor: '#dc3545', 
                          borderColor: '#dc3545',
                          padding: '0.75rem',
                          fontSize: '0.95rem',
                          fontWeight: '500'
                        }}
                      >
                        {forgotPasswordLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending Reset Link...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Send Reset Link
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={closeForgotPasswordModal}
                        disabled={forgotPasswordLoading}
                      >
                        <i className="fas fa-times me-2"></i>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                
                {forgotPasswordMessage && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={closeForgotPasswordModal}
                    >
                      <i className="fas fa-check me-2"></i>
                      Close
                    </button>
                  </div>
                )}
              </div>
              
              <div className="modal-footer border-0 pt-0">
                <div className="w-100 text-center">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    You will receive an email with password reset instructions if an account with this email exists.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
