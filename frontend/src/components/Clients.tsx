import React, { useState, useEffect } from 'react';
import ClientService, { Client } from '../services/client.service';

interface ClientsProps {
  onNavigateToOnboard: () => void;
}

const Clients: React.FC<ClientsProps> = ({ onNavigateToOnboard }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const userClients = await ClientService.getUserClients();
        setClients(userClients);
      } catch (err) {
        setError('Error fetching clients. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">My Clients</h2>
        <button 
          className="btn btn-primary"
          onClick={onNavigateToOnboard}
        >
          Add New Client
        </button>
      </div>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="row">
          {clients.length > 0 ? clients.map(client => (
            <div key={client.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100 border-0" style={{ transition: 'all 0.3s ease' }}>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0 text-primary">{client.clientName}</h5>
                    <span className={`badge ${client.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                      {client.status}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <small className="text-muted d-block"><strong>Code:</strong> {client.clientCode}</small>
                    {client.companyName && (
                      <small className="text-muted d-block"><strong>Company:</strong> {client.companyName}</small>
                    )}
                    <small className="text-muted d-block">
                      <strong>Created:</strong> {new Date(client.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <i className="fas fa-project-diagram me-1"></i>
                        {client.projects?.length || 0} Projects
                      </small>
                      <div>
                        <button className="btn btn-outline-primary btn-sm me-2" title="View Details">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="btn btn-outline-secondary btn-sm" title="Edit">
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {client.notes && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="fas fa-sticky-note me-1"></i>
                        {client.notes.length > 50 ? `${client.notes.substring(0, 50)}...` : client.notes}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-12">
              <div className="alert alert-info">No clients found. Click "Add New Client" to onboard a new client.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Clients;
