import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { Project } from '../../services/project.service';
import ProjectService from '../../services/project.service';
import UserService, { TeamMember } from '../../services/user.service';
import TaskService from '../../services/task.service';
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
  const [details, setDetails] = useState<Project | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load full project details (with tasks, members, docs) when modal opens
  useEffect(() => {
    const loadDetails = async () => {
      if (!isOpen || !project?.id) return;
      try {
        setLoadingDetails(true);
        const full = await ProjectService.getProject(project.id);
        setDetails(full);
      } catch (e) {
        console.error('Failed to load project details', e);
        // fall back to passed-in project
        setDetails(project);
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [isOpen, project?.id]);

  // Load team picker data
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

  // Fetch search results when query changes (debounced)
  useEffect(() => {
    let active = true;
    const doSearch = async () => {
      if (!showAddMember) return;
      if (!searchQuery || searchQuery.trim().length < 2) {
        if (active) {
          setSearchResults([]);
          setSearchError(null);
        }
        return;
      }
      try {
        setSearchLoading(true);
        setSearchError(null);
        const results = await UserService.searchUsers({ q: searchQuery.trim(), limit: 10 });
        if (active) setSearchResults(results);
      } catch (e: any) {
        if (active) setSearchError(e?.message || 'Failed to search users');
      } finally {
        if (active) setSearchLoading(false);
      }
    };

    const id = setTimeout(doSearch, 300);
    return () => { active = false; clearTimeout(id); };
  }, [searchQuery, showAddMember]);

  if (!isOpen || !project) return null;

  const view = details || project;
  const status = (view.status || (view.isActive ? 'active' : 'archived')).toString();
  const statusLabel = status.replace('in_progress', 'in progress').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
  const created = new Date((view as any).createdAt || (view as any).created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const members = view.teamMembers || [];
  const tasks = (view as any).tasks as any[] | string[] | undefined;
  const attachments = view.attachments || (view as any).documents || [];
  const tags = view.tags || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Project Details`} size="lg">
      <div>
        {/* Header summary */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h5 className="mb-1" style={{ color: 'var(--text-primary)' }}>{view.name}</h5>
            <div className="text-muted" style={{ fontSize: 12 }}>Code: <strong>{view.projectCode || '—'}</strong></div>
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
            <div className="mb-2"><strong>Client:</strong> <span className="text-muted">{view.client?.name || '—'}</span></div>
            <div className="mb-2"><strong>Created:</strong> <span className="text-muted">{created}</span></div>
            {view.endDate && (
              <div className="mb-2"><strong>Delivery Date:</strong> <span className="text-muted">{view.endDate}</span></div>
            )}
            {view.briefReceivedOn && (
              <div className="mb-2"><strong>Brief Received:</strong> <span className="text-muted">{view.briefReceivedOn}</span></div>
            )}
            {typeof view.estimatedTime !== 'undefined' && (
              <div className="mb-2"><strong>Est. Time:</strong> <span className="text-muted">{view.estimatedTime} hrs</span></div>
            )}
            {view.manager && (
              <div className="mb-2"><strong>Manager:</strong> <span className="text-muted">{view.manager.firstName} {view.manager.lastName}</span></div>
            )}
          </div>

          <div className="col-md-6">
            <SectionTitle icon="fas fa-align-left" title="Description" />
            <div className="text-muted" style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>
              {view.description || '—'}
            </div>
          </div>
        </div>

{/* Team */}
        <Divider />
       <div className="d-flex align-items-center justify-content-between">
  <SectionTitle icon="fas fa-users" title="Team Members" />

  <button
    type="button"
    className="btn btn-sm btn-outline-primary"
    onClick={() => setShowAddMember(true)}
  >
    <i className="fas fa-plus" /> Add
  </button>
</div>
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
                <button key={tm.id} type="button" title={`Add ${tm.firstName} ${tm.lastName} via task`}
                  onClick={() => { setPreselectedAssigneeId(tm.id); setShowAddTask(true); }}
                  style={{ display:'flex', alignItems:'center', gap:8, border: '1px solid var(--border-color)', borderRadius: 999, padding: '4px 10px', background:'var(--card-bg)', color:'var(--text-primary)' }}>
                  <span className="d-inline-flex align-items-center justify-content-center"
                        style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-blue)', color: '#fff', fontSize: 12 }}>
                    {initials || <i className="fas fa-user" />}
                  </span>
                  <span style={{ fontSize: 12 }}>{tm.firstName} {tm.lastName}</span>
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
      {/* Add Team Member modal */}
      {showAddMember && (
        <Modal
          isOpen={showAddMember}
          onClose={() => { setShowAddMember(false); setSearchQuery(''); setSearchResults([]); setSelectedUserId(null); setSearchError(null); }}
          title="Add team member"
          size="md"
        >
          <div>
            <div className="mb-3">
              <label className="form-label">Search users</label>
              <input
                type="text"
                className="form-control"
                placeholder="Type a name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="form-text">Search globally across all users. Minimum 2 characters.</div>
            </div>

            {searchError && <div className="alert alert-danger">{searchError}</div>}

            <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
              {searchLoading ? (
                <div className="p-3 text-muted" style={{ fontSize: 13 }}>Searching…</div>
              ) : searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
                <div className="p-3 text-muted" style={{ fontSize: 13 }}>No results</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {searchResults.map((u) => (
                    <li
                      key={u.id}
                      className="list-group-item d-flex align-items-center"
                      style={{ cursor: 'pointer', background: selectedUserId === u.id ? 'var(--hover-bg)' : 'transparent' }}
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      <span className="badge rounded-circle me-2 d-inline-flex align-items-center justify-content-center" style={{ width: 28, height: 28, background: 'var(--accent-blue)', color: '#fff' }}>
                        <i className="fas fa-user" />
                      </span>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</div>
                        <small className="text-muted">{u.email}{u.department ? ` • ${u.department}` : ''}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowAddMember(false); setSearchQuery(''); setSearchResults([]); setSelectedUserId(null); setSearchError(null); }}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedUserId || searchLoading}
                onClick={async () => {
                  if (!selectedUserId) return;
                  try {
                    // Create onboarding task to trigger acceptance flow
                    await TaskService.createTask({
                      projectId: (details || project).id,
                      name: `Onboard to ${view.name}`,
                      description: `Auto-generated onboarding task to add to project ${view.name}`,
                      assignedTo: selectedUserId,
                      estimatedTime: 1
                    });

                    // Refresh project details to reflect pending member task
                    try {
                      const full = await ProjectService.getProject((details || project).id);
                      setDetails(full);
                    } catch (err) {
                      console.error('Failed to refresh project after adding member', err);
                    }

                    setShowAddMember(false);
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedUserId(null);
                    setSearchError(null);
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || err?.message || 'Failed to create onboarding task';
                    setSearchError(msg);
                  }
                }}
              >
                <i className="fas fa-user-plus me-2"></i>
                Add
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Task modal, optionally preselecting assignee */}
      <AddTaskModal
        show={showAddTask}
        onHide={() => setShowAddTask(false)}
        projectId={(details || project).id}
        onTaskCreated={async () => {
          // Refresh details so new task appears immediately
          try {
            const full = await ProjectService.getProject((details || project).id);
            setDetails(full);
          } catch (e) {
            console.error('Failed to refresh project details after task creation', e);
          }
        }}
        preselectedAssigneeId={preselectedAssigneeId}
      />
    </Modal>
  );
};

export default ViewProjectModal;

