import React, { useMemo } from 'react'
import AppShell from '../layouts/AppShell'
import Card from '../ui/Card'
import Button from '../ui/Button'
import TaskList from '../components/tasks/TaskList'
import { Edit, Mail, Phone, MapPin, MessageSquare } from 'lucide-react'

export default function TeamMemberDetailNew() {
  // Dummy member
  const member = {
    id: 1,
    name: 'Alex Johnson',
    role: 'Senior Product Designer',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    status: 'online' as 'online'|'away'|'offline',
    tasks: 12,
    projects: 5,
    avatar: 'https://i.pravatar.cc/150?u=alex',
    bio: 'Product designer with 5+ years of experience in creating user-centered designs for SaaS applications. Passionate about accessibility and inclusive design.'
  }

  const initials = (name: string) => name.split(' ').map(n=>n[0]).join('').toUpperCase()
  const statusDot = (s: 'online'|'away'|'offline') => s==='online'?'bg-green-500': s==='away'?'bg-yellow-500':'bg-slate-400'

  const tasks = [
    { id: 1, name: 'Design homepage', projectName: 'Website Redesign', status: 'pending' },
    { id: 2, name: 'Create wireframes', projectName: 'Website Redesign', status: 'pending' },
    { id: 3, name: 'Update design system', projectName: 'Product Launch', status: 'completed' },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={member.avatar} alt={member.name} className="h-20 w-20 rounded-full object-cover border border-[var(--border-color)]" />
              <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[var(--card-bg)] ${statusDot(member.status)}`}></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{member.name}</h1>
              <p className="text-muted-foreground">{member.role}</p>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 mt-1">
                {member.status.charAt(0).toUpperCase()+member.status.slice(1)}
              </span>
            </div>
          </div>
          <Button leftIcon={<Edit className="h-4 w-4" />}>Edit Profile</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Biography" >
              <p className="text-muted-foreground">{member.bio}</p>
            </Card>

            <Card title="Assigned Tasks" actions={<span className="text-sm text-muted-foreground">{member.tasks} tasks</span>}>
              <div className="rounded-lg border border-[var(--border-color)]">
                <div className="border-b border-[var(--border-color)] p-3 text-sm font-medium">Tasks assigned to this member</div>
                <div className="p-3"><TaskList tasks={tasks} /></div>
              </div>
            </Card>

            <Card title="Team Chat" actions={null}>
              <div className="rounded-lg border border-[var(--border-color)] p-3 text-sm text-muted-foreground">Collaboration UI coming soon…</div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Contact Information">
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium text-muted-foreground text-xs">Email</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${member.email}`} className="hover:underline">{member.email}</a>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground text-xs">Phone</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${member.phone}`} className="hover:underline">{member.phone}</a>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-muted-foreground text-xs">Location</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{member.location}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Projects">
              <div className="space-y-3">
                {[{c:'bg-blue-500',n:'Website Redesign',r:'Project Manager'},{c:'bg-green-500',n:'Product Launch',r:'Designer'},{c:'bg-purple-500',n:'Marketing Campaign',r:'Contributor'}].map((p,i)=> (
                  <div key={i} className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${p.c}`}></div>
                      <div>
                        <p className="font-medium text-sm">{p.n}</p>
                        <p className="text-xs text-muted-foreground">{p.r}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">•••</Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Performance" >
              <div className="space-y-4 text-sm">
                {[{label:'Tasks Completed',val:85,c:'bg-green-500'},{label:'On-time Delivery',val:92,c:'bg-blue-500'},{label:'Team Collaboration',val:78,c:'bg-purple-500'}].map((m,i)=> (
                  <div key={i}>
                    <div className="flex justify-between mb-1"><span>{m.label}</span><span>{m.val}%</span></div>
                    <div className="w-full bg-[var(--border-color)] rounded-full h-2"><div className={`${m.c} h-2 rounded-full`} style={{ width: `${m.val}%` }}></div></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
