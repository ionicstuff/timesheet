import React, { useState } from 'react'
import Button from '../../ui/Button'
import { Calendar as CalendarIcon, CheckCircle, Folder, Home, MessageSquare, Plus, Settings as SettingsIcon, Users, ChevronDown, Search, LayoutGrid, FileText, Moon, Sun, Building2, DollarSign } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

function cn(...cls: (string | undefined | false)[]) { return cls.filter(Boolean).join(' ') }

export default function Sidebar() {
  const location = useLocation()
  const [expandedSections, setExpandedSections] = useState({ projects: true, folders: true })
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [wsOpen, setWsOpen] = useState(false)

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  const isActive = (path: string) => location.pathname === path

  const projects = [
    { id: 1, name: 'Website Redesign', color: 'bg-blue-500' },
    { id: 2, name: 'Product Launch', color: 'bg-green-500' },
    { id: 3, name: 'Marketing Campaign', color: 'bg-purple-500' }
  ]

  const folders = [
    { id: 1, name: 'Design Assets' },
    { id: 2, name: 'Research' },
    { id: 3, name: 'Client Docs' }
  ]

  const toggleSection = (section: keyof typeof expandedSections) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))

  return (
    <div className="flex h-full flex-col border-r border-border bg-background">
      <div className="p-4 border-b bg-card border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">AgencyOS</h1>
          <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Workspace selector dropdown */}
        <div className="mt-4 relative">
          <button
            className="flex items-center gap-2 text-sm font-medium text-foreground"
            onClick={() => setWsOpen(v => !v)}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Personal
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', wsOpen && 'rotate-180')} />
          </button>
          {wsOpen && (
            <div className="absolute mt-2 w-40 rounded-md border border-border bg-card shadow-sm z-10">
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Personal</button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Work</button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Freelance</button>
            </div>
          )}
        </div>

        <div className="mt-5 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search..." className="w-full rounded-md bg-muted pl-8 pr-4 py-2 text-sm" />
        </div>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          <NavLink to="/app/dashboard" className={({ isActive }) => cn('mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'bg-[rgba(15,23,42,0.06)] text-foreground' : 'text-muted-foreground hover:bg-[rgba(15,23,42,0.04)] hover:text-foreground')}>
            <Home className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => cn('mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'bg-[rgba(15,23,42,0.06)] text-foreground' : 'text-muted-foreground hover:bg-[rgba(15,23,42,0.04)] hover:text-foreground')}>
            <CheckCircle className="h-4 w-4" />
            Tasks
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => cn('mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'bg-[rgba(15,23,42,0.06)] text-foreground' : 'text-muted-foreground hover:bg-[rgba(15,23,42,0.04)] hover:text-foreground')}>
            <LayoutGrid className="h-4 w-4" />
            Projects
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => cn('mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'bg-[rgba(15,23,42,0.06)] text-foreground' : 'text-muted-foreground hover:bg-[rgba(15,23,42,0.04)] hover:text-foreground')}>
            <Building2 className="h-4 w-4" />
            My Clients
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => cn('mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'bg-[rgba(15,23,42,0.06)] text-foreground' : 'text-muted-foreground hover:bg-[rgba(15,23,42,0.04)] hover:text-foreground')}>
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </NavLink>
          <NavLink to="/documents" className={({ isActive }) => cn('mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'bg-[rgba(15,23,42,0.06)] text-foreground' : 'text-muted-foreground hover:bg-[rgba(15,23,42,0.04)] hover:text-foreground')}>
            <FileText className="h-4 w-4" />
            Documents
          </NavLink>
          <NavLink to="/teams" className={({ isActive }) => cn('mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'bg-[rgba(15,23,42,0.06)] text-foreground' : 'text-muted-foreground hover:bg-[rgba(15,23,42,0.04)] hover:text-foreground')}>
            <Users className="h-4 w-4" />
            Team
          </NavLink>
          <NavLink to="/billing" className={({ isActive }) => cn('mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'bg-[rgba(15,23,42,0.06)] text-foreground' : 'text-muted-foreground hover:bg-[rgba(15,23,42,0.04)] hover:text-foreground')}>
            <DollarSign className="h-4 w-4" />
            Billings
          </NavLink>
          <a href="#" className="mx-1 mr-2 my-px flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
            <MessageSquare className="h-4 w-4" />
            Messages
          </a>
        </nav>

        <div className="px-3 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Workspaces</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-1">
            <button className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              Personal
            </button>
            <button className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              Work
            </button>
            <button className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              Freelance
            </button>
          </div>
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">Projects</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSection('projects')}>
              <ChevronDown className={cn('h-3 w-3 transition-transform', expandedSections.projects ? 'rotate-180' : '')} />
            </Button>
          </div>
          {expandedSections.projects && (
            <div className="space-y-1 mt-2">
              {projects.map(project => (
                <a key={project.id} href="#" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                  <div className={`h-2 w-2 rounded-full ${project.color}`}></div>
                  {project.name}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">Folders</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSection('folders')}>
              <ChevronDown className={cn('h-3 w-3 transition-transform', expandedSections.folders ? 'rotate-180' : '')} />
            </Button>
          </div>
          {expandedSections.folders && (
            <div className="space-y-1 mt-2">
              {folders.map(folder => (
                <a key={folder.id} href="#" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors">
                  <Folder className="h-3 w-3" />
                  {folder.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <NavLink to="/settings" className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2 transition-all', isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary')}>
            <SettingsIcon className="h-4 w-4" />
            Settings
          </NavLink>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} aria-label="Toggle dark mode">
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <div className="text-center text-xs text-muted-foreground">AgencyOS v1.0</div>
      </div>
    </div>
  )
}
