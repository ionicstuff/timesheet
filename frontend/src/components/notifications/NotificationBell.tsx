import React, { useEffect, useRef, useState } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import notificationService, { NotificationItem } from '../../services/notification.service'
import Button from '../../ui/Button'
import { useNavigate } from 'react-router-dom'

const MAX_COUNT_DISPLAY = 99

function fromNow(iso?: string | null): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (!t) return ''
  const diff = Math.max(0, Date.now() - t)
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const refreshCount = async () => {
    try {
      const { count } = await notificationService.unreadCount()
      setCount(count || 0)
    } catch (e) {
      // ignore
    }
  }

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await notificationService.list({ limit: 10 })
      const arr = Array.isArray(res?.items) ? res.items : []
      setItems(arr)
    } catch (e) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next) await loadList()
  }

  const onItemClick = async (n: NotificationItem) => {
    try {
      if (!n.isRead) {
        await notificationService.markRead(n.id)
        setItems(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
        setCount(c => Math.max(0, c - 1))
      }
    } catch {
      // ignore
    } finally {
      setOpen(false)
      if (n.link) navigate(n.link)
    }
  }

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setItems(prev => prev.map(x => ({ ...x, isRead: true })))
      setCount(0)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshCount()
    const timer = setInterval(refreshCount, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" className="w-9 h-9 p-0 relative" title="Notifications" onClick={toggle}>
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center">
            {count > MAX_COUNT_DISPLAY ? `${MAX_COUNT_DISPLAY}+` : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
            <div className="text-sm font-medium">Notifications</div>
            <button
              className="text-xs text-primary hover:underline disabled:text-muted-foreground"
              onClick={markAllRead}
              disabled={count === 0}
            >
              <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" />Mark all as read</span>
            </button>
          </div>

          <div className="max-h-96 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No notifications</div>
            ) : (
              <ul className="divide-y divide-[var(--border-color)]">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      className={[
                        'w-full text-left px-3 py-2 hover:bg-[var(--secondary-bg)]',
                        !n.isRead ? 'bg-yellow-50/30' : ''
                      ].join(' ')}
                      onClick={() => onItemClick(n)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={[!n.isRead ? 'text-primary' : 'text-muted-foreground', 'pt-0.5'].join(' ')}>
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{n.title}</div>
                          {n.body ? (
                            <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                          ) : null}
                          <div className="text-[10px] text-muted-foreground mt-0.5">{fromNow(n.createdAt || n.created_at || null)}</div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

