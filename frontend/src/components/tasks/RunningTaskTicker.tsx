import React, { useEffect, useMemo, useRef, useState } from 'react';
import taskService, { Task } from '../../services/task.service';
import TimesheetService, { TimesheetStatus } from '../../services/timesheet.service';
import Toast from '../Toast';
import { Pause, Check, Play } from 'lucide-react';

const formatHMS = (totalSeconds: number) => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const hStr = hrs.toString();
  const mStr = mins.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');
  return `${hStr}:${mStr}:${sStr}`;
};

const RunningTaskTicker: React.FC = () => {
  const [running, setRunning] = useState<Task | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; isVisible: boolean }>({ message: '', type: 'info', isVisible: false });
  const tickRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);
  const tsPollRef = useRef<number | null>(null);

  // Timesheet status for gating start/resume
  const [tsStatus, setTsStatus] = useState<TimesheetStatus | null>(null);

  // Task picker state
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [pickerLoading, setPickerLoading] = useState<boolean>(false);
  const [candidateTasks, setCandidateTasks] = useState<Task[]>([]);

  const handleToastClose = () => setToast(prev => ({ ...prev, isVisible: false }));

  const fetchRunning = async () => {
    try {
      const data = await taskService.getMyTasks({ status: 'in_progress' });
      const task = Array.isArray(data) && data.length > 0 ? data[0] : null;
      setRunning(task || null);
      if (task) {
        const startedAt = (task as any).activeTimerStartedAt || task.startedAt || task.updatedAt || task.createdAt;
        const base = Math.floor((task as any).totalTrackedSeconds || 0);
        if (startedAt) {
          const delta = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
          setDisplaySeconds(base + delta);
        } else {
          setDisplaySeconds(base);
        }
      } else {
        setDisplaySeconds(0);
      }
    } catch (e: any) {
      // Non-blocking: just notify
      const msg = e?.response?.data?.message || 'Failed to fetch running task';
      setToast({ message: msg, type: 'error', isVisible: true });
    }
  };

  const fetchTimesheet = async () => {
    try {
      const status = await TimesheetService.getTimesheetStatus();
      setTsStatus(status);
    } catch (e: any) {
      // Silence errors; widget remains usable for pause/complete
    }
  };

  const loadCandidateTasks = async () => {
    try {
      setPickerLoading(true);
      const tasks = await taskService.getMyTasks();
      // Filter pending or paused tasks
      const filtered = (tasks || []).filter(t => t.status === 'pending' || t.status === 'paused');
      // Sort by updatedAt or createdAt desc
      filtered.sort((a:any,b:any) => new Date(b.updatedAt || b.createdAt || '').getTime() - new Date(a.updatedAt || a.createdAt || '').getTime());
      setCandidateTasks(filtered.slice(0, 10));
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to load tasks';
      setToast({ message: msg, type: 'error', isVisible: true });
    } finally {
      setPickerLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    fetchRunning();
    fetchTimesheet();
    // polling every 15s for running task
    pollRef.current = window.setInterval(fetchRunning, 15000);
    // polling every 60s for timesheet status
    tsPollRef.current = window.setInterval(fetchTimesheet, 60000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (tsPollRef.current) window.clearInterval(tsPollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // clear any previous ticker
    if (tickRef.current) window.clearInterval(tickRef.current);
    if (running && running.status === 'in_progress') {
      tickRef.current = window.setInterval(() => {
        setDisplaySeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running?.id, running?.status]);

  const onPause = async () => {
    if (!running?.id) return;
    try {
      setLoading(true);
      await taskService.pause(running.id);
      setToast({ message: 'Task paused', type: 'success', isVisible: true });
      await fetchRunning();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to pause task';
      setToast({ message: msg, type: 'error', isVisible: true });
    } finally {
      setLoading(false);
    }
  };

  const onComplete = async () => {
    if (!running?.id) return;
    try {
      setLoading(true);
      await taskService.complete(running.id);
      setToast({ message: 'Task completed', type: 'success', isVisible: true });
      await fetchRunning();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to complete task';
      setToast({ message: msg, type: 'error', isVisible: true });
    } finally {
      setLoading(false);
    }
  };

  const onStartSelected = async (task: Task) => {
    if (!task?.id) return;
    if (tsStatus?.status !== 'clocked_in') {
      setToast({ message: 'Please clock in to start tasks.', type: 'warning', isVisible: true });
      return;
    }
    try {
      setLoading(true);
      const resp = await taskService.start(task.id);
      setToast({ message: resp.message || 'Task started', type: 'success', isVisible: true });
      setPickerOpen(false);
      await fetchRunning();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to start task';
      setToast({ message: msg, type: 'error', isVisible: true });
    } finally {
      setLoading(false);
    }
  };

  const onResumeSelected = async (task: Task) => {
    if (!task?.id) return;
    if (tsStatus?.status !== 'clocked_in') {
      setToast({ message: 'Please clock in to resume tasks.', type: 'warning', isVisible: true });
      return;
    }
    try {
      setLoading(true);
      const resp = await taskService.resume(task.id);
      setToast({ message: resp.message || 'Task resumed', type: 'success', isVisible: true });
      setPickerOpen(false);
      await fetchRunning();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to resume task';
      setToast({ message: msg, type: 'error', isVisible: true });
    } finally {
      setLoading(false);
    }
  };

  const onClockIn = async () => {
    try {
      setLoading(true);
      const resp = await TimesheetService.clockIn();
      setTsStatus(resp.data);
      setToast({ message: resp.message || 'Clocked in', type: 'success', isVisible: true });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to clock in';
      setToast({ message: msg, type: 'error', isVisible: true });
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = useMemo(() => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTop: '1px solid var(--border-color)',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    padding: '10px 12px',
  }), []);

  const panelStyle: React.CSSProperties = useMemo(() => ({
    marginBottom: 8,
    border: '1px solid var(--border-color)',
    borderRadius: 8,
    padding: 8,
    background: 'var(--card-bg)',
    maxHeight: 220,
    overflowY: 'auto'
  }), []);

  const titleStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-secondary)'
  };

  const buttonBase: React.CSSProperties = {
    fontSize: 12,
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-primary)'
  };

  return (
    <div style={containerStyle} aria-live="polite" aria-label="Running task ticker">
      {/* Task picker panel */}
      {pickerOpen && !running && (
        <div style={panelStyle}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="fw-semibold" style={{ fontSize: 12 }}>Select a task to {tsStatus?.status === 'clocked_in' ? 'start' : 'start (requires Clock In)'}</div>
            <button
              className="btn btn-sm btn-outline-secondary"
              style={{ ...buttonBase, fontSize: 11, padding: '2px 6px' }}
              onClick={() => setPickerOpen(false)}
            >Close</button>
          </div>
          {pickerLoading ? (
            <div className="text-muted small">Loading tasks...</div>
          ) : candidateTasks.length === 0 ? (
            <div className="text-muted small">No pending or paused tasks.</div>
          ) : (
            <ul className="list-unstyled mb-0">
              {candidateTasks.map(t => (
                <li key={t.id} className="d-flex align-items-center justify-content-between mb-2">
                  <div className="text-truncate" style={{ maxWidth: '70%' }} title={`${t.name} · ${(t.project?.projectCode || t.project?.projectName || `Project #${t.projectId}`)}`}>
                    <span className="fw-semibold">{t.name}</span>
                    <span className="text-muted"> · {t.project?.projectCode || t.project?.projectName || `Project #${t.projectId}`}</span>
                  </div>
                  {t.status === 'paused' ? (
                    <button className="btn btn-sm btn-outline-primary" disabled={loading || tsStatus?.status !== 'clocked_in'} onClick={() => onResumeSelected(t)}>
                      {loading ? <span className="spinner-border spinner-border-sm"/> : 'Resume'}
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-outline-success" disabled={loading || tsStatus?.status !== 'clocked_in'} onClick={() => onStartSelected(t)}>
                      {loading ? <span className="spinner-border spinner-border-sm"/> : 'Start'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div className="d-flex align-items-center justify-content-between">
        <div className="me-2 flex-grow-1" style={{ minWidth: 0 }}>
          <div style={titleStyle}>Running Task</div>
          {running ? (
            <div className="text-truncate" title={`${running.name} · ${(running.project?.projectCode || running.project?.projectName || `Project #${running.projectId}`)}`}>
              <span className="fw-semibold">{running.name}</span>
              <span className="text-muted"> · {running.project?.projectCode || running.project?.projectName || `Project #${running.projectId}`}</span>
            </div>
          ) : (
            <div className="text-muted">No task running</div>
          )}
          {running && (
            <div className="small" style={{ color: 'var(--text-secondary)' }}>
              {formatHMS(displaySeconds)}
            </div>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 ms-2">
          {running ? (
            <>
              <button
                disabled={loading}
                onClick={onPause}
                title="Pause task"
                style={{ ...buttonBase }}
              >
                {loading ? <span className="spinner-border spinner-border-sm"/> : <Pause className="h-4 w-4"/>}
              </button>
              <button
                disabled={loading}
                onClick={onComplete}
                title="Complete task"
                style={{ ...buttonBase, borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
              >
                {loading ? <span className="spinner-border spinner-border-sm"/> : <Check className="h-4 w-4"/>}
              </button>
            </>
          ) : (
            tsStatus?.status === 'clocked_in' ? (
              <button
                disabled={loading}
                onClick={async () => { setPickerOpen(prev => { const next = !prev; if (next) void loadCandidateTasks(); return next; }); }}
                title="Start task"
                style={{ ...buttonBase, borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
              >
                <Play className="h-4 w-4 me-1"/> Start Task
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={onClockIn}
                title="Clock In to start tasks"
                style={{ ...buttonBase }}
              >
                {loading ? <span className="spinner-border spinner-border-sm"/> : 'Clock In'}
              </button>
            )
          )}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={handleToastClose} />
    </div>
  );
};

export default RunningTaskTicker;

