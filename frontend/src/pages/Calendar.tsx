import React, { useState } from 'react'
import AppShell from '../layouts/AppShell'
import Button from '../ui/Button'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay()

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const today = new Date()
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()

  const renderCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    const cells: React.ReactNode[] = []

    // Leading blanks for first week
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[80px] md:min-h-[110px] border-t border-l border-[var(--border-color)]" />)
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
      cells.push(
        <div
          key={day}
          className={[
            'min-h-[80px] md:min-h-[110px] border-t border-l border-[var(--border-color)] p-2',
            isToday ? 'bg-[var(--accent-blue)]/10' : ''
          ].join(' ')}
        >
          <div className={['text-right text-sm', isToday ? 'font-semibold text-[var(--accent-blue)]' : 'text-sub'].join(' ')}>
            {day}
          </div>
          <div className="text-xs space-y-1 mt-2">
            {day === 15 && (
              <div className="px-2 py-1 rounded-md truncate border border-blue-500/30 bg-blue-500/15 text-blue-400">
                Team Meeting
              </div>
            )}
            {day === 20 && (
              <div className="px-2 py-1 rounded-md truncate border border-green-500/30 bg-green-500/15 text-green-400">
                Project Deadline
              </div>
            )}
          </div>
        </div>
      )
    }

    return cells
  }

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Title + primary action */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" leftIcon={<Plus className="h-4 w-4" />}>New Event</Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="w-9 h-9 p-0" onClick={prevMonth} leftIcon={<ChevronLeft className="h-4 w-4" />} />
            <h2 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" className="w-9 h-9 p-0" onClick={nextMonth} leftIcon={<ChevronRight className="h-4 w-4" />} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} disabled={isCurrentMonth}>Today</Button>
            <Button variant="outline" size="sm" leftIcon={<CalendarIcon className="h-4 w-4" />}>Month</Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--card-bg)] mx-auto max-w-[1100px]">
          <div
            className="bg-[var(--secondary-bg)] border-b border-[var(--border-color)]"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
          >
            {dayNames.map((d) => (
              <div key={d} className="py-3 px-2 text-center font-medium text-sm text-sub">{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
            {renderCalendar()}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

