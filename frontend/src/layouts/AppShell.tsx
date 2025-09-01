import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../ui/Button'

interface NavItem { label: string; to: string; icon: string }

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: 'fa-home' },
  { label: 'Projects', to: '/projects', icon: 'fa-project-diagram' },
  { label: 'Clients', to: '/clients', icon: 'fa-building' },
  { label: 'My Tasks', to: '/tasks', icon: 'fa-tasks' },
  { label: 'Timesheet', to: '/timesheet/view', icon: 'fa-clock' },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  useEffect(() => {
    document.body.removeAttribute('data-theme')
  }, [])

  const toggleTheme = () => {
    const nowLight = document.body.getAttribute('data-theme') === 'light'
    if (nowLight) {
      document.body.removeAttribute('data-theme')
      setIsDark(true)
    } else {
      document.body.setAttribute('data-theme', 'light')
      setIsDark(false)
    }
  }

  const doLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background text-foreground"> 
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
        <div className="px-4 h-14 flex items-center gap-3">
          <button className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <i className="fas fa-bars" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center"><i className="fas fa-clock" /></div>
            <div className="font-semibold">TimeSheet Pro</div>
          </div>

          {/* Center search */}
          <div className="hidden md:flex items-center mx-4 flex-1">
            <div className="relative w-full">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" />
              <input
                className="w-full h-9 rounded-md bg-background border border-[var(--border-color)] pl-8 pr-3 text-sm placeholder:text-muted-foreground"
                placeholder="Search tasks, projects, docs..."
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="hidden sm:inline-flex"><i className="fas fa-plus mr-2" /> New</Button>
            <Button variant="outline" size="sm" onClick={toggleTheme} title={isDark ? 'Switch to light' : 'Switch to dark'}>
              <i className={isDark ? 'fas fa-sun' : 'fas fa-moon'} />
            </Button>
            <div className="relative" ref={menuRef}>
              <button className="ml-1 flex items-center gap-2" onClick={() => setMenuOpen(!menuOpen)}>
                <span className="hidden sm:block text-sm text-muted-foreground text-right">
                  <span className="block font-medium text-foreground">{user ? `${user.firstName} ${user.lastName}` : 'User'}</span>
                  <span className="text-xs">{user?.role || 'Employee'}</span>
                </span>
                <span className="w-9 h-9 rounded-full bg-primary/90 text-white flex items-center justify-center font-bold">
                  {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : 'U'}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg">
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--secondary-bg)]"><i className="fas fa-user mr-2" />Profile</button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--secondary-bg)]"><i className="fas fa-cog mr-2" />Settings</button>
                  <div className="h-px bg-[var(--border-color)] my-1" />
                  <button className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-[var(--secondary-bg)]" onClick={doLogout}><i className="fas fa-sign-out-alt mr-2" />Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={[
          'fixed md:static z-30 inset-y-0 left-0 w-64 transform md:transform-none transition-transform',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        ].join(' ')}>
          <div className="h-full bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] p-3">
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => [
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                  isActive ? 'bg-[var(--secondary-bg)] text-foreground shadow-inner' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                ].join(' ')}>
                  <i className={`fas ${item.icon} w-4`} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 md:ml-0 ml-64 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

