import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { Project } from '../../services/project.service';
import ProjectService from '../../services/project.service';
import UserService, { TeamMember } from '../../services/user.service';
import AddTaskModal from '../AddTaskModal';

interface ViewProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const SectionTitle: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div className="d-flex align-items-center mb-2" style={{ color: 'var(--text-primary)' }}>
    <i className={`${icon} me-2`} />
    <h6 className="mb-0" style={{ fontWeight: 700 }}>{title}</h6>
  </div>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid var(--border-color)',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    color: 'var(--text-primary)',
    background: 'var(--card-bg)'
  }}>{children}</span>
);

const Divider = () => <hr style={{ borderColor: 'var(--border-color)', opacity: 0.6, margin: '12px 0' }} />;

const ViewProjectModal: React.FC<ViewProjectModalProps> = ({ project, isOpen, onClose }) => {
  const [teamPicker, setTeamPicker] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [preselectedAssigneeId, setPreselectedAssigneeId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const loadTeam = async () => {
      if (!isOpen) return;
      try {
        setLoadingTeam(true);
        let team = await UserService.getMyTeamMembers({ includeSubordinates: true, limit: 100 });
        if (!team || team.length === 0) {
          const allUsers = await ProjectService.getUsers();
          team = allUsers.map((u: any) => ({
            id: u.id,
            firstName: u.firstName || u.firstname || '',
            lastName: u.lastName || u.lastname || '',
            email: u.email,
            department: u.department,
            designation: u.designation,
          }));
        }
        setTeamPicker(team);
      } catch (e) {
        console.error('Failed to load team members for picker', e);
      } finally {
        setLoadingTeam(false);
      }
    };
    loadTeam();
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const status = (project.status || (project.isActive ? 'active' : 'archived')).toString();
  const statusLabel = status.replace('in_progress', 'in progress').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const created = new Date((project as any).createdAt || (project as any).created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const members = project.teamMembers || [];
  const tasks = (project as any).tasks as any[] | string[] | undefined;
  const attachments = project.attachments || (project as any).documents || [];
  const tags = project.tags || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Project Details`} size="lg">
      <div>
        {/* Header summary */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 className="mb-1" style={{ color: 'var(--text-primary)' }}>{project.name}</h5>
            <div className="text-muted" style={{ fontSize: 12 }}>Code: <strong>{project.projectCode || '—'}</strong></div>
          </div>
          <div className="d-flex flex-wrap gap-2" style={{ gap: 8 }}>
            <Chip><i className="fas fa-clipboard-list" /> {Array.isArray(tasks) ? tasks.length : 0} Tasks</Chip>
            <Chip><i className="fas fa-users" /> {members.length} Members</Chip>
            <Chip><i className="fas fa-flag" /> {statusLabel}</Chip>
          </div>
        </div>
        <Divider />

        {/* Overview grid */}
        <div className="row g-3">
          <div className="col-md-6">
            <SectionTitle icon="fas fa-info-circle" title="Overview" />
            <div className="mb-2"><strong>Client:</strong> <span className="text-muted">{project.client?.name || '—'}</span></div>
            <div className="mb-2"><strong>Created:</strong> <span className="text-muted">{created}</span></div>
            {project.endDate && (
              <div className="mb-2"><strong>Delivery Date:</strong> <span className="text-muted">{project.endDate}</span></div>
            )}
            {project.briefReceivedOn && (
              <div className="mb-2"><strong>Brief Received:</strong> <span className="text-muted">{project.briefReceivedOn}</span></div>
            )}
            {typeof project.estimatedTime !== 'undefined' && (
              <div className="mb-2"><strong>Est. Time:</strong> <span className="text-muted">{project.estimatedTime} hrs</span></div>
            )}
            {project.manager && (
              <div className="mb-2"><strong>Manager:</strong> <span className="text-muted">{project.manager.firstName} {project.manager.lastName}</span></div>
            )}
          </div>

          <div className="col-md-6">
            <SectionTitle icon="fas fa-align-left" title="Description" />
            <div className="text-muted" style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
              {project.description || '—'}
            </div>
          </div>
        </div>

{/* Team */}
        <Divider />
        <SectionTitle icon="fas fa-users" title="Team Members" />

        {/* Team member picker (account manager's team) */}
        <div className="mb-2" style={{ overflowX: 'auto' }}>
          <div className="d-flex" style={{ gap: 12 }}>
            {loadingTeam && (
              <div className="text-muted" style={{ fontSize: 12 }}>Loading team…</div>
            )}
            {!loadingTeam && teamPicker.length === 0 && (
              <div className="text-muted" style={{ fontSize: 12 }}>No team members available.</div>
            )}
            {!loadingTeam && teamPicker.map((tm) => {
              const initials = `${(tm.firstName||'').charAt(0)}${(tm.lastName||'').charAt(0)}`.toUpperCase();
              return (
                <button key={tm.id} type="button" className="btn btn-light d-flex align-items-center" title={`Add ${tm.firstName} ${tm.lastName} via task`}
                  onClick={() => { setPreselectedAssigneeId(tm.id); setShowAddTask(true); }}
                  style={{ border: '1px solid var(--border-color)', borderRadius: 999, padding: '4px 10px' }}>
                  <span className="me-2 d-inline-flex align-items-center justify-content-center"
                        style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue)', color: '#fff', fontSize: 12 }}>
                    {initials || <i className="fas fa-user" />}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{tm.firstName} {tm.lastName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Existing project members list */}
        {members.length ? (
          <ul className="list-unstyled mb-2" style={{ maxHeight: 180, overflow: 'auto', paddingRight: 6 }}>
            {members.map((m: any, idx: number) => (
              <li key={idx} className="d-flex align-items-center mb-2">
                <span className="badge rounded-circle me-2 d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28, background: 'var(--accent-blue)', color: '#fff' }}>
                  <i className="fas fa-user" />
                </span>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{m.assignedTo?.firstName || m.firstName || 'Member'} {m.assignedTo?.lastName || m.lastName || ''}</div>
                  <small className="text-muted">{m.assignedTo?.department || m.department || ''}{m.taskName ? ` • ${m.taskName}` : ''}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-muted" style={{ fontSize: 13 }}>No team members added.</div>
        )}

{/* Tasks */}
        <Divider />
        <div className="d-flex align-items-center justify-content-between">
          <SectionTitle icon="fas fa-tasks" title="Tasks" />
          <button type="button" className="btn btn-sm btn-outline-primary" title="Add Task" onClick={() => { setPreselectedAssigneeId(undefined); setShowAddTask(true); }}>
            <i className="fas fa-plus" />
          </button>
        </div>
        {Array.isArray(tasks) && tasks.length ? (
          <ol className="mb-2" style={{ paddingLeft: 18, maxHeight: 180, overflow: 'auto' }}>
            {tasks.map((t: any, i: number) => (
              <li key={i} className="text-muted" style={{ fontSize: 13 }}>{typeof t === 'string' ? t : (t.name || t.title || JSON.stringify(t))}</li>
            ))}
          </ol>
        ) : (
          <div className="text-muted" style={{ fontSize: 13 }}>No tasks available.</div>
        )}

        {/* Attachments */}
        {Array.isArray(attachments) && attachments.length ? (
          <>
            <Divider />
            <SectionTitle icon="fas fa-paperclip" title="Attachments" />
            <div className="d-flex flex-wrap" style={{ gap: 8 }}>
              {attachments.map((f: any, i: number) => (
                <Chip key={i}>
                  <i className="fas fa-file-alt" /> {f.originalName || f.filename}
                </Chip>
              ))}
            </div>
          </>
        ) : null}

        {/* Tags */}
        {Array.isArray(tags) && tags.length ? (
          <>
            <Divider />
            <SectionTitle icon="fas fa-tags" title="Tags" />
            <div className="d-flex flex-wrap" style={{ gap: 6 }}>
              {tags.map((tag: string, i: number) => (
                <Chip key={i}><i className="fas fa-tag" /> {tag}</Chip>
              ))}
            </div>
          </>
        ) : null}
      </div>
      {/* Add Task modal, optionally preselecting assignee */}
      <AddTaskModal
        show={showAddTask}
        onHide={() => setShowAddTask(false)}
        projectId={project.id}
        onTaskCreated={() => { /* Optionally refresh project details upstream */ }}
        preselectedAssigneeId={preselectedAssigneeId}
      />
    </Modal>
  );
};

export default ViewProjectModal;

