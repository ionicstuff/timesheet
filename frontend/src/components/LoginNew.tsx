import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { useAuth } from '../context/AuthContext'
import { Clock, Users, BarChart2, Shield, Mail, Lock, LogIn, Smartphone, Globe, BadgeCheck, CheckCircle, AlertCircle, Info, Key, Send, X, Check } from 'lucide-react'

const heroUrl = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2069&q=80'

export default function LoginNew() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotInfo, setForgotInfo] = useState('')

  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if ((location.state as any)?.message) {
      setSuccessMessage((location.state as any).message)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const apiBase = (import.meta as any).env?.VITE_API_URL || (window as any).process?.env?.REACT_APP_API_URL || '/api'
  const submitForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return setForgotError('Please enter your email address')
    setForgotLoading(true)
    setForgotError('')
    setForgotInfo('')
    try {
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setForgotInfo(data?.message || 'If an account exists, we have sent you a reset link.')
        setForgotEmail('')
      } else {
        setForgotError(data?.message || 'Failed to send reset email')
      }
    } catch {
      setForgotError('Network error. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background text-foreground">
      {/* Left hero */}
      <div className="relative hidden md:block">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${heroUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-slate-600/70" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white p-8">
          <div>
            <Clock className="mb-4 opacity-90 w-16 h-16" />
            <h1 className="text-3xl font-bold mb-2">TimeSheet Pro</h1>
            <p className="max-w-md mx-auto text-sm opacity-90">Streamline your workforce management with our comprehensive timesheet solution</p>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <Users className="w-5 h-5 mb-1 opacity-90" />
                <p>Team Management</p>
              </div>
              <div className="text-center">
                <BarChart2 className="w-5 h-5 mb-1 opacity-90" />
                <p>Analytics</p>
              </div>
              <div className="text-center">
                <Shield className="w-5 h-5 mb-1 opacity-90" />
                <p>Secure</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right pane */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <Clock className="w-10 h-10 mb-2" style={{ color: '#273C63' }} />
            <h2 className="text-xl font-bold" style={{ color: '#273C63' }}>TimeSheet Pro</h2>
            <p className="text-xs text-muted-foreground">Evolute Global</p>
          </div>

          <div className="text-center mb-5">
            <h3 className="text-lg font-semibold text-foreground">Welcome Back</h3>
            <p className="text-sm text-muted-foreground">Sign in to your account</p>
          </div>

          {successMessage && (
            <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle className="mr-2 inline h-4 w-4" />{successMessage}
            </div>
          )}
          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="mr-2 inline h-4 w-4" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              required
            />
            <Button type="submit" className="w-full" loading={isLoading} leftIcon={<LogIn className="h-4 w-4" />}>
              Sign In
            </Button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3 text-muted-foreground text-xs mb-3">
              <div className="flex-1 h-px bg-[var(--border-color)]" />
              <span>Or continue with</span>
              <div className="flex-1 h-px bg-[var(--border-color)]" />
            </div>
            <div className="grid gap-2">
              <Button variant="outline" leftIcon={<Smartphone className="h-4 w-4" />}>Continue with Mobile</Button>
              <Button variant="outline" leftIcon={<Globe className="h-4 w-4" />}>Continue with Microsoft</Button>
              <Button variant="outline" leftIcon={<Globe className="h-4 w-4" />}>Continue with Google</Button>
              <Button variant="outline" leftIcon={<BadgeCheck className="h-4 w-4" />}>Continue with Employee ID</Button>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-muted-foreground">
            <div className="mt-2">
              <button type="button" className="text-primary underline underline-offset-4 mr-4" onClick={() => { setShowForgot(true); setForgotEmail(email) }}>Forgot Password?</button>
              <a className="text-primary underline underline-offset-4" href="#">Need Help?</a>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && createPortal(
        <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForgot(false)} role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-white text-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 text-center">
              <Key className="w-10 h-10 mb-3" style={{ color: '#273C63' }} />
              <h4 className="text-lg font-bold" style={{ color: '#273C63' }}>Reset Password</h4>
              <p className="text-sm text-slate-600">Enter your email to receive reset instructions</p>
            </div>
            <div className="px-5 pb-3">
              {forgotInfo && (
                <div className="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <CheckCircle className="mr-2 inline h-4 w-4" />{forgotInfo}
                </div>
              )}
              {forgotError && (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertCircle className="mr-2 inline h-4 w-4" />{forgotError}
                </div>
              )}
              {!forgotInfo && (
                <form onSubmit={submitForgot} className="space-y-3">
                  <Input
                    label="Email Address"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                    autoFocus
                    required
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button type="submit" variant="danger" loading={forgotLoading} leftIcon={<Send className="h-4 w-4" />}>
                      Send Reset Link
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForgot(false)} disabled={forgotLoading} leftIcon={<X className="h-4 w-4" />}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
              {forgotInfo && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => setShowForgot(false)} leftIcon={<Check className="h-4 w-4" />}>
                    Close
                  </Button>
                </div>
              )}
            </div>
            <div className="px-5 pb-5 text-center text-xs text-slate-500">
              <Info className="mr-1 inline h-4 w-4" /> You will receive an email with password reset instructions if an account with this email exists.
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

