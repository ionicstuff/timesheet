import React, { useEffect, useState } from 'react';
import taskService, { Task } from '../../services/task.service';

const formatMinutes = (seconds?: number) => {
  const s = Math.floor((seconds || 0) / 60);
  const h = Math.floor(s / 60);
  const m = s % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await taskService.getMyTasks(status ? { status } : undefined);
      setTasks(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const run = async (id: number, op: 'start'|'pause'|'resume'|'stop'|'complete') => {
    try {
      setActionLoading(id);
      const api = {
        start: () => taskService.start(id),
        pause: () => taskService.pause(id),
        resume: () => taskService.resume(id),
        stop: () => taskService.stop(id),
        complete: () => taskService.complete(id)
      }[op];
      await api();
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message || `Failed to ${op} task`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">My Tasks</h3>
        <div>
          <select className="form-select" style={{ width: 200 }} value={status} onChange={(e)=>setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="alert alert-info">No tasks found.</div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const isRunning = t.status === 'in_progress' && (t as any).activeTimerStartedAt;
                return (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.project?.projectCode || t.project?.projectName || t.projectId}</td>
                    <td>{t.status}</td>
                    <td>{formatMinutes((t as any).totalTrackedSeconds)}</td>
                    <td>
                      {t.status === 'pending' || t.status === 'paused' ? (
                        <button disabled={actionLoading===t.id} className="btn btn-sm btn-primary me-2" onClick={()=>run(t.id!, 'start')}>Start</button>
                      ) : null}
                      {isRunning ? (
                        <>
                          <button disabled={actionLoading===t.id} className="btn btn-sm btn-warning me-2" onClick={()=>run(t.id!, 'pause')}>Pause</button>
                          <button disabled={actionLoading===t.id} className="btn btn-sm btn-secondary me-2" onClick={()=>run(t.id!, 'stop')}>Stop</button>
                        </>
                      ) : null}
                      {t.status === 'paused' ? (
                        <button disabled={actionLoading===t.id} className="btn btn-sm btn-success me-2" onClick={()=>run(t.id!, 'resume')}>Resume</button>
                      ) : null}
                      <button disabled={actionLoading===t.id} className="btn btn-sm btn-outline-success" onClick={()=>run(t.id!, 'complete')}>Complete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyTasks;

