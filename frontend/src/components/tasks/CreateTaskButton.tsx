import React from 'react'
import Button from '../../ui/Button'

export default function CreateTaskButton() {
  return (
    <Button size="sm" onClick={() => alert('Create Task coming soon')}>\
      <i className="fas fa-plus mr-2"/> New Task
    </Button>
  )
}

