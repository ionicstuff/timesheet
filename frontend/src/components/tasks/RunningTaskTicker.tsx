import React, { useEffect, useMemo, useRef, useState } from 'react';
import taskService, { Task } from '../../services/task.service';
import Toast from '../Toast';

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

  useEffect(() => {
    // initial fetch
    fetchRunning();
    // polling every 15s
    pollRef.current = window.setInterval(fetchRunning, 15000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
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
                {loading ? <span className="spinner-border spinner-border-sm"/> : <i className="fas fa-pause"/>}
              </button>
              <button
                disabled={loading}
                onClick={onComplete}
                title="Complete task"
                style={{ ...buttonBase, borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
              >
                {loading ? <span className="spinner-border spinner-border-sm"/> : <i className="fas fa-check"/>}
              </button>
            </>
          ) : (
            <div className="small text-muted">—</div>
          )}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={handleToastClose} />
    </div>
  );
};

export default RunningTaskTicker;

