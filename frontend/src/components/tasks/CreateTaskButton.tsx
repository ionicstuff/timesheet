import React from 'react'
import Button from '../../ui/Button'
import { Plus } from 'lucide-react'

export default function CreateTaskButton() {
  return (
    <Button size="sm" onClick={() => alert('Create Task coming soon')}>
      <Plus className="mr-2 h-4 w-4"/> New Task
    </Button>
  )
}

