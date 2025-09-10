import React from 'react'
import { Calendar as CalendarIcon, FileText, Users, MessageSquare, BarChart3, Plus } from 'lucide-react'
import { CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card'
import Card from '../../ui/Card'
import Button from '../../ui/Button'

export default function QuickActions() {
  const actions = [
    { title: 'Create Task', description: 'Add a new task to your list', icon: <Plus className="h-5 w-5" />, color: 'bg-blue-500' },
    { title: 'Schedule Event', description: 'Plan a meeting or event', icon: <CalendarIcon className="h-5 w-5" />, color: 'bg-green-500' },
    { title: 'New Document', description: 'Create a new document', icon: <FileText className="h-5 w-5" />, color: 'bg-purple-500' },
    { title: 'Invite Member', description: 'Add someone to your team', icon: <Users className="h-5 w-5" />, color: 'bg-orange-500' },
    { title: 'Send Message', description: 'Communicate with your team', icon: <MessageSquare className="h-5 w-5" />, color: 'bg-pink-500' },
    { title: 'View Reports', description: 'Check your progress analytics', icon: <BarChart3 className="h-5 w-5" />, color: 'bg-indigo-500' },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Get started with common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((a, i) => (
            <Button key={i} variant="outline" className="h-auto flex flex-col items-center justify-center p-4 gap-2">
              <div className={`p-2 rounded-full ${a.color} text-white`}>{a.icon}</div>
              <div className="font-medium text-sm">{a.title}</div>
              <div className="text-xs text-muted-foreground text-center">{a.description}</div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
