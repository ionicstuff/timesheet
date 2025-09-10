import React from 'react'
import Button from '../../ui/Button'
import { Settings, LogOut } from 'lucide-react'

export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" className="h-9">New</Button>
        <div className="relative">
          <input className="w-[280px] h-9 rounded-md bg-muted pl-3 pr-3 text-sm placeholder:text-muted-foreground" placeholder="Search tasks, projects, docs..." />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Notifications</Button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">JD</div>
          <span className="text-sm">John Doe</span>
          <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
  )
}
