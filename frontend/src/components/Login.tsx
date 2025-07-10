import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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

  return (
    <div className="container-fluid" style={{ minHeight: '100vh' }}>
      <div className="row h-100">
        {/* Left side - Background image */}
        <div 
          className="col-md-8 d-none d-md-block"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
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
              background: 'linear-gradient(135deg, rgba(0,123,255,0.8) 0%, rgba(108,117,125,0.6) 100%)'
            }}
          ></div>
        </div>
        
        {/* Right side - Login form */}
        <div className="col-md-4 d-flex align-items-center justify-content-center">
          <div className="w-100" style={{ maxWidth: '400px', padding: '2rem' }}>
            <div className="text-center mb-4">
              <h2 className="h3 mb-3 font-weight-normal">Login to Keka</h2>
            </div>
            
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control form-control-lg"
                  placeholder="Email or Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <input
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 mb-3"
                style={{ backgroundColor: '#007bff', border: 'none' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
            
            <div className="text-center mt-4">
              <p className="text-muted mb-3">Or</p>
              
              <div className="d-grid gap-2">
                <button className="btn btn-outline-secondary btn-lg mb-2">
                  <i className="fab fa-mobile-alt me-2"></i> Continue with Mobile
                </button>
                
                <button className="btn btn-outline-secondary btn-lg mb-2">
                  <i className="fab fa-microsoft me-2"></i> Continue with Microsoft
                </button>
                
                <button className="btn btn-outline-secondary btn-lg mb-2">
                  <i className="fab fa-google me-2"></i> Continue with Google
                </button>
                
                <button className="btn btn-outline-secondary btn-lg mb-2">
                  <i className="fas fa-user me-2"></i> Continue with Username
                </button>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="d-flex justify-content-center mb-3">
                <img src="https://via.placeholder.com/120x40/000000/FFFFFF?text=App+Store" alt="App Store" className="me-2" style={{ height: '40px' }} />
                <img src="https://via.placeholder.com/120x40/000000/FFFFFF?text=Google+Play" alt="Google Play" style={{ height: '40px' }} />
              </div>
              
              <p className="small text-muted">
                <img src="https://via.placeholder.com/60x20/000000/FFFFFF?text=keka" alt="Keka" className="me-2" />
                By logging in, you agree to Keka <a href="#" className="text-decoration-none">Terms of Use</a> and <a href="#" className="text-decoration-none">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
