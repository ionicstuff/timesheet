import React, { useState, useEffect } from 'react';
import ClientService, { Client } from '../services/client.service';

// Dark theme styles for onboard client form
const onboardFormStyle = document.createElement('style');
onboardFormStyle.textContent = `
  .onboard-container {
    background-color: var(--primary-bg);
    min-height: 100vh;
    color: var(--text-primary);
  }
  
  .onboard-card {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .onboard-form-control {
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    border-radius: 8px;
  }
  
  .onboard-form-control:focus {
    background-color: var(--secondary-bg);
    border-color: var(--accent-blue);
    color: var(--text-primary);
    box-shadow: 0 0 0 0.2rem rgba(79, 123, 255, 0.25);
  }
  
  .onboard-form-control::placeholder {
    color: var(--text-secondary);
  }
  
  .onboard-form-label {
    color: var(--text-primary);
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .onboard-btn-primary {
    background-color: var(--accent-blue);
    border-color: var(--accent-blue);
    color: white;
    border-radius: 8px;
    padding: 10px 24px;
    font-weight: 600;
  }
  
  .onboard-btn-primary:hover {
    background-color: #3d6aff;
    border-color: #3d6aff;
  }
  
  .onboard-btn-primary:disabled {
    background-color: #6c757d;
    border-color: #6c757d;
  }
  
  .onboard-nav-tabs {
    border-bottom: 1px solid var(--border-color);
  }
  
  .onboard-nav-tabs .nav-link {
    color: var(--text-secondary);
    border: none;
    background: transparent;
  }
  
  .onboard-nav-tabs .nav-link.active {
    color: var(--text-primary);
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-bottom-color: var(--card-bg);
  }
  
  .onboard-alert-success {
    background-color: rgba(40, 167, 69, 0.1);
    border-color: #28a745;
    color: #28a745;
  }
  
  .onboard-alert-error {
    background-color: rgba(220, 53, 69, 0.1);
    border-color: #dc3545;
    color: #dc3545;
  }
  
  /* Existing clients table styling */
  .existing-clients-card {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .existing-clients-table {
    background-color: var(--card-bg);
  }
  
  .existing-clients-table th {
    background-color: var(--secondary-bg) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
    font-weight: 600;
    font-size: 12px;
    padding: 12px;
  }
  
  .existing-clients-table td {
    background-color: var(--card-bg) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
    padding: 12px;
  }
  
  .existing-clients-table tbody tr:hover {
    background-color: var(--secondary-bg) !important;
  }
  
  .client-name {
    color: var(--text-primary);
    font-weight: 600;
  }
  
  .client-code {
    color: var(--text-secondary);
    font-size: 11px;
  }
  
  .industry-badge {
    background-color: var(--secondary-bg);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 6px;
  }
  
  .project-count {
    color: var(--accent-blue);
  }
  
  .select-btn {
    background-color: var(--accent-blue);
    border-color: var(--accent-blue);
    color: white;
    border-radius: 6px;
    font-size: 12px;
    padding: 6px 16px;
    font-weight: 600;
  }
  
  .select-btn:hover {
    background-color: #3d6aff;
    border-color: #3d6aff;
  }
  
  .filter-card {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .search-input {
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    border-radius: 8px;
  }
  
  .search-input:focus {
    background-color: var(--secondary-bg);
    border-color: var(--accent-blue);
    color: var(--text-primary);
    box-shadow: 0 0 0 0.2rem rgba(79, 123, 255, 0.25);
  }
  
  .search-input::placeholder {
    color: var(--text-secondary);
  }
  
  .input-group-text {
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
  }
  
  .filter-select {
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    border-radius: 8px;
  }
  
  .filter-select:focus {
    background-color: var(--secondary-bg);
    border-color: var(--accent-blue);
    color: var(--text-primary);
    box-shadow: 0 0 0 0.2rem rgba(79, 123, 255, 0.25);
  }
  
  .filter-label {
    color: var(--text-secondary);
    font-size: 11px;
    font-weight: 600;
  }
  
  .no-clients-found {
    color: var(--text-secondary);
  }
  
  .no-clients-icon {
    color: var(--text-secondary);
  }
`;
document.head.appendChild(onboardFormStyle);

interface OnboardClientProps {
  onNavigateToClients?: () => void;
}

const OnboardClient: React.FC<OnboardClientProps> = ({ onNavigateToClients }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('onboard'); // 'existing' or 'onboard'
  
  // Filter state for existing clients
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);

  // Form state for onboarding
  const [formData, setFormData] = useState({
    clientName: '',
    spocEmail: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Fetch industries on component mount
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const industriesList = await ClientService.getIndustries();
        setIndustries(industriesList);
      } catch (err) {
        console.error('Error loading industries:', err);
      }
    };
    loadIndustries();
  }, []);

  // Fetch clients when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'existing') {
      fetchFilteredClients();
    }
  }, [activeTab, searchTerm, selectedIndustry, selectedStatus]);

  const fetchFilteredClients = async () => {
    setIsLoading(true);
    try {
      const filters = {
        search: searchTerm || undefined,
        industry: selectedIndustry || undefined,
        status: selectedStatus || undefined
      };
      const userClients = await ClientService.getUserClients(filters);
      setClients(userClients);
      setError(null);
    } catch (err) {
      setError('Error fetching clients. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const clientData = {
        clientName: formData.clientName,
        spocEmail: formData.spocEmail || undefined,
        status: 'active' as const,
        currency: 'USD',
        notes: formData.notes
      };

      await ClientService.createClient(clientData);
      setSubmitMessage({ type: 'success', text: 'Client onboarded successfully!' });
      setFormData({ clientName: '', spocEmail: '', notes: '' });

      if (onNavigateToClients) {
        setTimeout(() => {
          onNavigateToClients();
        }, 1500);
      }
    } catch (err) {
      setSubmitMessage({ type: 'error', text: 'Error onboarding client. Please try again.' });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboard-container container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Clients</h2>
      
      <ul className="onboard-nav-tabs nav nav-tabs mb-4">
        <li className="nav-item">
          <a 
            className={`nav-link ${activeTab === 'onboard' ? 'active' : ''}`}
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('onboard'); }}
          >
            Onboard New Client
          </a>
        </li>
        <li className="nav-item">
          <a 
            className={`nav-link ${activeTab === 'existing' ? 'active' : ''}`}
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('existing'); }}
          >
            Existing Clients
          </a>
        </li>
      </ul>

      <div>
        {activeTab === 'onboard' && (
          <div className="onboard-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '32px', borderRadius: '12px' }}>
            <h4 className="onboard-form-label mb-4" style={{ fontSize: '20px' }}>Onboard New Client</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="clientName" className="onboard-form-label">Client Name</label>
                <input 
                  type="text" 
                  className="onboard-form-control form-control"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  placeholder="Enter client name"
                  required
                  style={{ padding: '12px 16px', fontSize: '14px' }}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="spocEmail" className="onboard-form-label">
                  SPOC Email
                  <span className="text-muted" style={{ fontWeight: 'normal', fontSize: '12px', marginLeft: '8px' }}>(Optional)</span>
                </label>
                <input 
                  type="email" 
                  className="onboard-form-control form-control"
                  id="spocEmail"
                  name="spocEmail"
                  value={formData.spocEmail}
                  onChange={handleInputChange}
                  placeholder="Enter SPOC email address"
                  style={{ padding: '12px 16px', fontSize: '14px' }}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="notes" className="onboard-form-label">Notes</label>
                <textarea 
                  className="onboard-form-control form-control"
                  id="notes"
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter any relevant notes"
                  style={{ padding: '12px 16px', fontSize: '14px' }}
                ></textarea>
              </div>

              {submitMessage && (
                <div className={`onboard-alert-${submitMessage.type} alert mt-3`} style={{ padding: '12px 16px', borderRadius: '8px' }}>
                  {submitMessage.text}
                </div>
              )}

              <div className="d-flex justify-content-end">
                <button 
                  type="submit" 
                  className="onboard-btn-primary btn mt-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Onboarding...' : 'Onboard Client'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'existing' && (
          <div>
            {/* Filter Form */}
            <div className="filter-card mb-4" style={{ padding: '20px' }}>
              <div className="row g-3">
                {/* Search Field */}
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="search-input form-control"
                      placeholder="Search by name, company, or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: '10px 12px', fontSize: '14px' }}
                    />
                  </div>
                </div>
                
                {/* Industry Filter */}
                <div className="col-md-4">
                  <div>
                    <label className="filter-label mb-1">Industry</label>
                    <select
                      className="filter-select form-select"
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      style={{ padding: '10px 12px', fontSize: '14px' }}
                    >
                      <option value="">Select Industry</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="col-md-4">
                  <div>
                    <label className="filter-label mb-1">Status</label>
                    <select
                      className="filter-select form-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      style={{ padding: '10px 12px', fontSize: '14px' }}
                    >
                      <option value="">Select Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="prospect">Prospect</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status" style={{ color: 'var(--accent-blue)' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="onboard-alert-error alert">{error}</div>
            ) : (
              <div className="existing-clients-card">
                <div style={{ padding: '0' }}>
                  {clients.length > 0 ? (
                    <div className="table-responsive">
                      <table className="existing-clients-table table table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Client Name</th>
                            <th>Primary SPOC</th>
                            <th>Industry</th>
                            <th>Total Projects</th>
                            <th>Last Project Date</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clients.map(client => {
                            const lastProjectDate = client.projects && client.projects.length > 0 
                              ? client.projects.reduce((latest, project) => {
                                  const projectDate = new Date(project.endDate || project.startDate || '');
                                  return projectDate > latest ? projectDate : latest;
                                }, new Date(0))
                              : null;
                            
                            return (
                              <tr key={client.id}>
                                <td>
                                  <div>
                                    <div className="client-name">{client.clientName}</div>
                                    <small className="client-code">{client.clientCode}</small>
                                  </div>
                                </td>
                                <td>
                                  {client.accountManager ? (
                                    <div>
                                      <div className="client-name">{client.accountManager.firstName} {client.accountManager.lastName}</div>
                                      <small className="client-code">{client.accountManager.email}</small>
                                    </div>
                                  ) : (
                                    <span className="client-code">Not assigned</span>
                                  )}
                                </td>
                                <td>
                                  <span className="industry-badge">
                                    {client.industry || 'Not specified'}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <i className="fas fa-project-diagram me-2 project-count"></i>
                                    <span className="project-count">{client.projects?.length || 0}</span>
                                  </div>
                                </td>
                                <td>
                                  {lastProjectDate && lastProjectDate.getTime() > 0 ? (
                                    <span className="client-name">{lastProjectDate.toLocaleDateString()}</span>
                                  ) : (
                                    <span className="client-code">No projects</span>
                                  )}
                                </td>
                                <td>
                                  <button className="select-btn btn">
                                    Select
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="no-clients-icon fas fa-users fa-3x mb-3"></i>
                      <h5 className="no-clients-found">No clients found</h5>
                      <p className="no-clients-found">Try adjusting your search criteria or filters.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardClient;
