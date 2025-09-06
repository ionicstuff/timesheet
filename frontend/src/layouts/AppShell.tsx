import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../ui/Button'
import { Menu, Search, Plus, Sun, Moon, Clock as ClockIcon, Home, Folder, Building2, ListChecks, User, Settings, LogOut } from 'lucide-react'

interface NavItem { label: string; to: string; icon: React.ReactNode }

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/app/dashboard', icon: <Home className="h-4 w-4" /> },
  { label: 'Projects', to: '/projects', icon: <Folder className="h-4 w-4" /> },
  { label: 'Clients', to: '/clients', icon: <Building2 className="h-4 w-4" /> },
  { label: 'My Tasks', to: '/tasks', icon: <ListChecks className="h-4 w-4" /> },
  { label: 'Timesheet', to: '/timesheet/view', icon: <ClockIcon className="h-4 w-4" /> },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
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
    // Default to light theme
    document.body.setAttribute('data-theme', 'light')
    setIsDark(false)
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
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center"><ClockIcon className="h-4 w-4" /></div>
            <div className="font-semibold">TimeSheet Pro</div>
          </div>

          {/* Center search */}
          <div className="hidden md:flex items-center mx-4 flex-1 justify-center">
            <div className="relative w-full max-w-[520px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="w-full h-9 rounded-md bg-background border border-[var(--border-color)] pl-9 pr-3 text-sm placeholder:text-muted-foreground"
                placeholder="Search tasks, projects, docs..."
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="w-9 h-9 p-0 hidden sm:inline-flex" title="Timer">
              <ClockIcon className="h-4 w-4" />
            </Button>
            <Button variant="primary" size="sm" className="hidden sm:inline-flex" leftIcon={<Plus className="h-4 w-4" />}>New Task</Button>
            <Button variant="outline" size="sm" onClick={toggleTheme} title={isDark ? 'Switch to light' : 'Switch to dark'}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--secondary-bg)]"><User className="mr-2 inline-block h-4 w-4" />Profile</button>
                  <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--secondary-bg)]"><Settings className="mr-2 inline-block h-4 w-4" />Settings</button>
                  <div className="h-px bg-[var(--border-color)] my-1" />
                  <button className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-[var(--secondary-bg)]" onClick={doLogout}><LogOut className="mr-2 inline-block h-4 w-4" />Logout</button>
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
                  <span className="text-muted-foreground">{item.icon}</span>
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

