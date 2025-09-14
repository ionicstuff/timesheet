import React from 'react'
import { Calendar as CalendarIcon, FileText, Users, MessageSquare, BarChart3, Plus } from 'lucide-react'
import { CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card'
import Card from '../../ui/Card'
import Button from '../../ui/Button'

export default function QuickActions() {
  const actions = [
    { title: 'Create Task', description: 'Add a new task to your list', icon: <Plus className="h-4 w-4" />, color: 'bg-blue-500' },
    { title: 'Schedule Event', description: 'Plan a meeting or event', icon: <CalendarIcon className="h-4 w-4" />, color: 'bg-green-500' },
    { title: 'New Document', description: 'Create a new document', icon: <FileText className="h-4 w-4" />, color: 'bg-purple-500' },
    { title: 'Invite Member', description: 'Add someone to your team', icon: <Users className="h-4 w-4" />, color: 'bg-orange-500' },
    { title: 'Send Message', description: 'Communicate with your team', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-pink-500' },
    { title: 'View Reports', description: 'Check your progress analytics', icon: <BarChart3 className="h-4 w-4" />, color: 'bg-indigo-500' },
  ]
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-[24px] font-semibold">Quick Actions</h2>
        <p className="text-sm text-muted-foreground">Get started with common tasks</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {actions.map((a, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer">
            <div className={`w-10 h-10 rounded-full ${a.color} text-white flex items-center justify-center mx-auto mb-3`}>
              {a.icon}
            </div>
            <h3 className="font-medium text-sm mb-1">{a.title}</h3>
            <p className="text-xs text-muted-foreground">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
