import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge } from 'react-bootstrap';
import timesheetEntryService, { TimesheetEntry } from '../../services/timesheetEntry.service';
import projectService from '../../services/project.service';
import taskService from '../../services/task.service';
import styles from './TimesheetView.module.css';

interface ProjectOption { id: number; name: string; is_billable?: boolean; }
interface TaskOption { id: number; name: string; }

const todayISO = () => new Date().toISOString().split('T')[0];

const TimesheetView: React.FC = () => {
  const [date, setDate] = useState<string>(todayISO());
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | ''>('');
  const [selectedTask, setSelectedTask] = useState<number | ''>('');
  const [minutes, setMinutes] = useState<number>(60);
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const totalMinutes = useMemo(() => entries.reduce((s, e) => s + e.minutes, 0), [entries]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      timesheetEntryService.list(date),
      projectService.getProjects()
    ]).then(([ts, prj]: any[]) => {
      if (!alive) return;
      setEntries(ts?.data?.entries ?? []);
      const prjData = Array.isArray(prj) ? prj : (prj?.data ?? []);
      setProjects(prjData);
    }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
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
    const payload: any = {
      date,
      projectId: Number(selectedProject),
      minutes: Math.max(1, Number(minutes)),
      description: description?.trim() || undefined,
      ...(selectedTask ? { taskId: Number(selectedTask) } : {})
    };
    const res = await timesheetEntryService.create(payload);
    setEntries(prev => [...prev, res.data]);
    // reset quick add
    setSelectedProject('');
    setSelectedTask('');
    setMinutes(60);
    setDescription('');
  };

  const deleteEntry = async (id: number) => {
    await timesheetEntryService.remove(id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const submitDay = async () => {
    await timesheetEntryService.submitDay(date);
    // In a real app, replace alert with a toast/notification
    alert('Timesheet submitted for ' + date);
  };

  return (
    <Container fluid className={styles.pageWrap}>
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <div className={styles.headerRow}>
            <div>
              <h3 className={styles.title}>My Timesheet</h3>
              <div className={styles.subtle}>Track your work for the selected day</div>
            </div>
            <div className="d-flex align-items-center gap-3 ms-auto">
              <Form.Group controlId="timesheet-date" className="mb-0">
                <Form.Label className="mb-1 small text-muted">Date</Form.Label>
                <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Form.Group>
              <div className="text-nowrap">
                <div className="mb-1 small text-muted">Total</div>
                <Badge bg="primary" className="fs-6">
                  {(totalMinutes / 60).toFixed(2)} hrs
                </Badge>
              </div>
            </div>
          </div>

          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Form>
                <Row className="g-3 align-items-end">
                  <Col md={5}>
                    <Form.Group controlId="project">
                      <Form.Label>Project</Form.Label>
                      <Form.Select
                        aria-label="Select project"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : '')}
                      >
                        <option value="">Select a project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || (p as any).project_name || `Project #${p.id}`}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group controlId="task">
                      <Form.Label>Task (optional)</Form.Label>
                      <Form.Select
                        aria-label="Select task"
                        value={selectedTask}
                        onChange={(e) => setSelectedTask(e.target.value ? Number(e.target.value) : '')}
                        disabled={!selectedProject}
                      >
                        <option value="">Select a task</option>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={2}>
                    <Form.Group controlId="minutes">
                      <Form.Label>Minutes</Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        step={5}
                        value={minutes}
                        onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={1} className="d-grid">
                    <Button
                      variant="primary"
                      className="mt-2 mt-md-0"
                      onClick={addEntry}
                      disabled={!selectedProject || !minutes || loading}
                    >
                      Add
                    </Button>
                  </Col>
                </Row>

                <Row className="g-3 mt-1">
                  <Col md={12}>
                    <Form.Group controlId="description">
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        placeholder="Short description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="bg-body-tertiary">
              <strong>Entries</strong>
            </Card.Header>
            <Card.Body className="p-0">
              {entries.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className="text-muted">No entries yet. Add your first entry above.</div>
                </div>
              ) : (
                <Table responsive hover bordered className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Project</th>
                      <th style={{ width: '25%' }}>Task</th>
                      <th style={{ width: '10%' }}>Minutes</th>
                      <th style={{ width: '22%' }}>Description</th>
                      <th style={{ width: '8%' }} className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id}>
                        <td>{projects.find((p) => p.id === e.projectId)?.name || e.projectId}</td>
                        <td>{tasks.find((t) => t.id === (e.taskId ?? -1))?.name || (e.taskId ?? '-')}</td>
                        <td>{e.minutes}</td>
                        <td className={styles.truncate}>{e.description || '-'}</td>
                        <td className="text-center">
                          <Button variant="outline-danger" size="sm" onClick={() => deleteEntry(e.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
            <Card.Footer className="d-flex justify-content-end">
              <Button variant="success" onClick={submitDay} disabled={entries.length === 0}>
                Submit Day
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TimesheetView;
