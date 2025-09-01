import React from 'react'
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import { Calendar } from 'lucide-react'

export default function TaskSchedulerWidget() {
  return (
    <Card title="Task Scheduler">
      <div className="flex items-center justify-center h-40">
        <div className="text-center text-muted-foreground text-sm">
          <Calendar className="mx-auto mb-3 h-6 w-6" />
          <div className="mb-2 text-foreground">No events scheduled</div>
          <div>Your calendar is empty for the next 7 days</div>
          <Button className="mt-3" size="sm"><i className="fas fa-plus mr-2"/>Schedule Event</Button>
        </div>
      </div>
    </Card>
  )
}

