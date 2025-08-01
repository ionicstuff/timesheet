import React, { useState, useEffect } from 'react';
import ClientService, { Client } from '../services/client.service';

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
        status: 'active' as const,
        currency: 'USD',
        notes: formData.notes
      };

      await ClientService.createClient(clientData);
      setSubmitMessage({ type: 'success', text: 'Client onboarded successfully!' });
      setFormData({ clientName: '', notes: '' });

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
    <div className="container-fluid px-4 py-4">
      <h2 className="fw-bold mb-4">Clients</h2>
      
      <ul className="nav nav-tabs mb-4">
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
          <div className="card shadow-sm" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card-body p-4">
              <h4 className="card-title mb-4">Onboard New Client</h4>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="clientName" className="form-label">Client Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    placeholder="Enter client name"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">Notes</label>
                  <textarea 
                    className="form-control"
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter any relevant notes"
                  ></textarea>
                </div>

                {submitMessage && (
                  <div className={`alert alert-${submitMessage.type} mt-3`}>
                    {submitMessage.text}
                  </div>
                )}

                <div className="d-flex justify-content-end">
                  <button 
                    type="submit" 
                    className="btn btn-primary mt-3"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Onboarding...' : 'Onboard Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'existing' && (
          <div>
            {/* Filter Form */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="row g-3">
                  {/* Search Field */}
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by name, company, or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Industry Filter */}
                  <div className="col-md-4">
                    <div>
                      <label className="form-label text-muted small mb-1">Industry</label>
                      <select
                        className="form-select"
                        value={selectedIndustry}
                        onChange={(e) => setSelectedIndustry(e.target.value)}
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
                      <label className="form-label text-muted small mb-1">Status</label>
                      <select
                        className="form-select"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
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
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <div className="card shadow-sm">
                <div className="card-body p-0">
                  {clients.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
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
                                    <div className="fw-semibold">{client.clientName}</div>
                                    <small className="text-muted">{client.clientCode}</small>
                                  </div>
                                </td>
                                <td>
                                  {client.accountManager ? (
                                    <div>
                                      <div>{client.accountManager.firstName} {client.accountManager.lastName}</div>
                                      <small className="text-muted">{client.accountManager.email}</small>
                                    </div>
                                  ) : (
                                    <span className="text-muted">Not assigned</span>
                                  )}
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark">
                                    {client.industry || 'Not specified'}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <i className="fas fa-project-diagram me-2 text-primary"></i>
                                    {client.projects?.length || 0}
                                  </div>
                                </td>
                                <td>
                                  {lastProjectDate && lastProjectDate.getTime() > 0 ? (
                                    lastProjectDate.toLocaleDateString()
                                  ) : (
                                    <span className="text-muted">No projects</span>
                                  )}
                                </td>
                                <td>
                                  <button className="btn btn-primary btn-sm">
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
                      <i className="fas fa-users fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">No clients found</h5>
                      <p className="text-muted">Try adjusting your search criteria or filters.</p>
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
