import React, { useEffect, useMemo, useState } from 'react';
import timesheetEntryService, { TimesheetEntry } from '../../services/timesheetEntry.service';
import projectService from '../../services/project.service';
import taskService from '../../services/task.service';

interface ProjectOption { id: number; name: string; is_billable?: boolean; }
interface TaskOption { id: number; name: string; }

const todayISO = () => new Date().toISOString().split('T')[0];

const MinutesInput: React.FC<{value:number; onChange:(v:number)=>void; className?: string }> = ({value,onChange, className }) => {
  return (
    <input
      type="number"
      min={1}
      className={className ?? "form-control"} 
      value={value}
      onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
    />
  );
};

const TimesheetView: React.FC = () => {
  const [date, setDate] = useState<string>(todayISO());
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [selectedTask, setSelectedTask] = useState<number | ''>('');
  const [minutes, setMinutes] = useState<number>(60);
  const [description, setDescription] = useState<string>('');

  const totalMinutes = useMemo(() => entries.reduce((s,e)=>s+e.minutes,0), [entries]);

  useEffect(() => {
    // Load initial data
    timesheetEntryService.list(date).then(res => {
      setEntries(res.data.entries);
    });
    projectService.getProjects().then((res: any) => {
  setProjects(Array.isArray(res) ? res : (res?.data ?? []));
});
  }, [date]);

  useEffect(() => {
    if (selectedProject) {
      taskService.getTasksByProject(Number(selectedProject)).then((res: any) => {
  setTasks(Array.isArray(res) ? res : (res?.data ?? []));
});
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  const addEntry = async () => {
    if (!selectedProject || !minutes) return;
    const payload:any = {
      date,
      projectId: Number(selectedProject),
      minutes,
      description: description?.trim() || undefined
    };
    if (selectedTask) payload.taskId = Number(selectedTask);
    const res = await timesheetEntryService.create(payload);
    setEntries(prev => [...prev, res.data]);
    // reset quick add
    setSelectedProject('');
    setSelectedTask('');
    setMinutes(60);
    setDescription('');
  };

  const deleteEntry = async (id:number) => {
    await timesheetEntryService.remove(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const submitDay = async () => {
    await timesheetEntryService.submitDay(date);
    alert('Submitted!');
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">My Timesheet</h2>
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm">Date</label>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={date}
          onChange={(e)=>setDate(e.target.value)}
        />
        <div className="ml-auto text-sm">
          <span className="font-medium">Total:</span> {(totalMinutes/60).toFixed(2)} hrs
        </div>
      </div>

      {/* Quick Add Row */}
      <div className="grid grid-cols-12 gap-2 items-center mb-3">
        <select className="col-span-3 border rounded px-2 py-1 form-select" value={selectedProject} onChange={(e)=>setSelectedProject(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name || (p as any).project_name || `Project #${p.id}`}</option>
          ))}
        </select>

        <select className="col-span-3 border rounded px-2 py-1 form-select" value={selectedTask} onChange={(e)=>setSelectedTask(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Task (optional)</option>
          {tasks.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <div className="col-span-2">
          <MinutesInput value={minutes} onChange={setMinutes} />
        </div>

        <input
          className="col-span-2 border rounded px-2 py-1"
          placeholder="Short description"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />

        <button onClick={addEntry} className="col-span-1 bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700">
          Add
        </button>
      </div>

      {/* Entries List */}
      <div className="border rounded">
        <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 text-sm font-medium">
          <div className="col-span-4">Project</div>
          <div className="col-span-3">Task</div>
          <div className="col-span-2">Minutes</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-1">Actions</div>
        </div>

        {entries.length === 0 ? (
          <div className="p-3 text-sm text-gray-500">No entries yet.</div>
        ) : entries.map(e => (
          <div key={e.id} className="grid grid-cols-12 gap-2 p-2 border-t items-center">
            <div className="col-span-4">{projects.find(p => p.id === e.projectId)?.name || e.projectId}</div>
            <div className="col-span-3">{tasks.find(t => t.id === (e.taskId ?? -1))?.name || (e.taskId ?? '-')}</div>
            <div className="col-span-2">{e.minutes}</div>
            <div className="col-span-2 truncate">{e.description || '-'}</div>
            <div className="col-span-1">
              <button onClick={()=>deleteEntry(e.id)} className="text-red-600 hover:underline text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button onClick={submitDay} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Submit Day
        </button>
      </div>
    </div>
  );
};

export default TimesheetView;
