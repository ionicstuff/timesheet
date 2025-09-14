import React from 'react'
import { CheckCircle, MessageSquare, FileText, Calendar, UserPlus } from 'lucide-react'

export default function RecentActivity() {
  const activities = [
    { 
      icon: <CheckCircle className="h-4 w-4 text-green-600" />, 
      text: 'Alex Johnson completed task Design homepage', 
      time: '2 minutes ago',
      avatar: 'AJ'
    },
    { 
      icon: <MessageSquare className="h-4 w-4 text-blue-600" />, 
      text: 'Sam Smith commented on Meeting notes', 
      time: '15 minutes ago',
      avatar: 'SS'
    },
    { 
      icon: <FileText className="h-4 w-4 text-purple-600" />, 
      text: 'Taylor Brown uploaded document User research.pdf', 
      time: '1 hour ago',
      avatar: 'TB'
    },
    { 
      icon: <Calendar className="h-4 w-4 text-orange-600" />, 
      text: 'Jordan Lee scheduled event Team meeting', 
      time: '2 hours ago',
      avatar: 'JL'
    },
    { 
      icon: <UserPlus className="h-4 w-4 text-pink-600" />, 
      text: 'Admin invited Michael Chen', 
      time: '3 hours ago',
      avatar: 'A'
    },
  ]

  return (
    <div className="rounded-lg border border-border bg-card p-6 h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">What's happening in your workspace</p>
      </div>
      <ul className="space-y-4">
        {activities.map((activity, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-medium">{activity.text.split(' ')[0]} {activity.text.split(' ')[1]}</span>
                <span className="text-muted-foreground"> {activity.text.split(' ').slice(2).join(' ')}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              {activity.avatar}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

