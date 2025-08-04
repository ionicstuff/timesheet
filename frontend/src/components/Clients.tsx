import React, { useState, useEffect } from 'react';
import ClientService, { Client } from '../services/client.service';

// Enhanced CSS for dark theme client cards
const clientCardStyle = document.createElement('style');
clientCardStyle.textContent = `
  .client-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 12px;           /* ✅ adds inner space */
  margin: 10px;            /* ✅ ensures breathing room between cards */
  height: 100%;            /* useful for consistent card height in grid */
}

  
  .client-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
    border-color: var(--accent-white);
  }
  
  .client-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    
  }
  
  .client-title {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
  
  .client-status {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status-active {
    background: #28a745;
    color: white;
  }
  
  .status-inactive {
    background: #6c757d;
    color: white;
  }
  
  .client-info {
    margin-bottom: 18px;
  }
  
  .client-info-item {
    color: var(--text-secondary);
    font-size: 11px;
    margin-bottom: 6px;
  }
  
  .client-info-label {
    font-weight: 600;
  }
  
  .client-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid var(--border-color);
  }
  
  .project-count {
    color: var(--text-secondary);
    font-size: 11px;
    display: flex;
    align-items: center;
  }
  
  .project-count i {
    margin-right: 6px;
    color: var(--accent-blue);
  }
  
  .client-actions {
    display: flex;
    gap: 10px;
  }
  
  .client-action-btn {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .client-action-btn:hover {
    background: var(--accent-blue);
    color: white;
    border-color: var(--accent-blue);
  }
  
  .add-client-btn {
    background: var(--accent-blue);
    color: white;
    border: 1px solid var(--accent-blue);
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  
  .add-client-btn:hover {
    background: #3d6aff;
    border-color: #3d6aff;
    transform: translateY(-1px);
  }
`;
document.head.appendChild(clientCardStyle);

interface ClientsProps {
  onNavigateToOnboard: () => void;
}

const Clients: React.FC<ClientsProps> = ({ onNavigateToOnboard }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format date safely
  const formatDate = (client: Client, field: string): string => {
    // Try multiple possible field names
    const dateValue = client[field as keyof Client] || 
                     client['created_at' as keyof Client] || 
                     client['createdAt' as keyof Client];
    
    console.log(`Formatting date for client ${client.id}: field=${field}, value=${dateValue}, type=${typeof dateValue}`);
    
    if (!dateValue) return 'N/A';
    
    try {
      const date = new Date(dateValue as string);
      if (isNaN(date.getTime())) {
        console.log(`Invalid date for client ${client.id}:`, dateValue);
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const userClients = await ClientService.getUserClients();
        console.log('Fetched clients:', userClients); // Debug log
        console.log('First client structure:', userClients[0]); // Debug log
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
    <div className="container-fluid px-4 py-4" style={{ backgroundColor: 'var(--primary-bg)', minHeight: '100vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: 'var(--text-primary)' }}>My Clients</h2>
        <button 
          className="add-client-btn"
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
        <div className="row g-3 px-2">
          {clients.length > 0 ? clients.map(client => (
            <div key={client.id} className="col-12 col-sm-6 col-lg-4">
              <div className="client-card h-100">
                <div className="card-body d-flex flex-column p-0">
                  <div className="client-card-header">
                    <h5 className="client-title">{client.clientName}</h5>
                    <span className={`client-status ${client.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                      {client.status}
                    </span>
                  </div>
                  
                  <div className="client-info">
                    <div className="client-info-item"><span className="client-info-label">Code:</span> {client.clientCode}</div>
                    {client.companyName && (
                      <div className="client-info-item"><span className="client-info-label">Company:</span> {client.companyName}</div>
                    )}
                    <div className="client-info-item">
                      <span className="client-info-label">Created:</span> {formatDate(client, 'createdAt')}
                    </div>
                  </div>
                  
                  <div className="client-footer">
                    <div className="project-count">
                      <i className="fas fa-project-diagram"></i>
                      {client.projects?.length || 0} Projects
                    </div>
                    <div className="client-actions">
                      <button className="client-action-btn" title="View Details">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="client-action-btn" title="Edit">
                        <i className="fas fa-edit"></i>
                      </button>
                    </div>
                  </div>
                  
                  {client.notes && (
                    <div className="client-info-item client-notes mt-3">
                     
                      {client.notes.length > 50 ? `${client.notes.substring(0, 50)}...` : client.notes}
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
