import React, { useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try { document.body.setAttribute('data-theme', 'light') } catch {}
  }, [])
  return (
    <div className="flex h-screen">
      <div className="w-64 border-r border-border bg-card">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

