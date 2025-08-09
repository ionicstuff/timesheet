import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ClientService, { Client, UpdateClientRequest } from '../services/client.service';

interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: (updatedClient: Client) => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ client, isOpen, onClose, onClientUpdated }) => {
  const [formData, setFormData] = useState<UpdateClientRequest>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [industries, setIndustries] = useState<string[]>([]);

  // Load industries for dropdown
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const industriesData = await ClientService.getIndustries();
        setIndustries(industriesData);
      } catch (error) {
        console.error('Error loading industries:', error);
      }
    };
    
    if (isOpen) {
      loadIndustries();
    }
  }, [isOpen]);

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        clientCode: client.clientCode || '',
        clientName: client.clientName || '',
        companyName: client.companyName || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        country: client.country || '',
        postalCode: client.postalCode || '',
        website: client.website || '',
        industry: client.industry || '',
        contractStartDate: client.contractStartDate || '',
        contractEndDate: client.contractEndDate || '',
        status: client.status || 'active',
        billingType: client.billingType || 'hourly',
        hourlyRate: client.hourlyRate || 0,
        currency: client.currency || 'USD',
        notes: client.notes || ''
      });
      setError(null);
    }
  }, [client]);

  // lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleSave = async () => {
    if (!client) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedClient = await ClientService.updateClient(client.id, formData);
      onClientUpdated(updatedClient);
      onClose();
    } catch (error) {
      console.error('Error updating client:', error);
      setError(error instanceof Error ? error.message : 'Failed to update client');
    } finally {
      setIsLoading(false);
    }
  };

  // ---- inline, scoped styles so you don't fight Bootstrap ----
  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,.5)',
      zIndex: 1050,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16
    },
    dialog: {
      background: 'var(--card-bg)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 12,
      width: 'min(680px, 100%)',
      boxShadow: '0 20px 50px rgba(0,0,0,.35)',
      outline: 'none',
      maxHeight: '90vh',
      display: 'flex', flexDirection: 'column'
    },
    header: {
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    },
    body: {
      padding: 16,
      overflow: 'auto'
    },
    footer: {
      padding: '12px 16px',
      borderTop: '1px solid var(--border-color)',
      display: 'flex', gap: 8, justifyContent: 'flex-end'
    },
    input: {
      width: '100%', padding: '8px 10px', marginBottom: 10,
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      background: 'var(--primary-bg)',
      color: 'var(--text-primary)'
    }
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return createPortal(
    <div style={styles.overlay} onClick={onClose} onKeyDown={onKeyDown} role="dialog" aria-modal="true">
      <div style={styles.dialog} onClick={stop}>
        <div style={styles.header}>
          <h5 className="mb-0">Edit Client</h5>
          <button className="btn btn-sm btn-outline-light" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={styles.body}>
          {error && (
            <div className="alert alert-danger mb-3">
              {error}
            </div>
          )}

          {!client ? (
            <div className="text-muted">No client selected.</div>
          ) : (
            <>
              <div className="row">
                {/* Client Code & Name */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Client Code</label>
                  <input
                    style={styles.input}
                    name="clientCode"
                    value={formData.clientCode || ''}
                    onChange={handleInputChange}
                    placeholder="Client code"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Client Name <span className="text-danger">*</span></label>
                  <input
                    style={styles.input}
                    name="clientName"
                    value={formData.clientName || ''}
                    onChange={handleInputChange}
                    placeholder="Client name"
                    required
                  />
                </div>

                {/* Company Name & Email */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Company Name</label>
                  <input
                    style={styles.input}
                    name="companyName"
                    value={formData.companyName || ''}
                    onChange={handleInputChange}
                    placeholder="Company name"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    placeholder="Email address"
                  />
                </div>

                {/* Phone & Website */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Phone</label>
                  <input
                    style={styles.input}
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Website</label>
                  <input
                    style={styles.input}
                    type="url"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleInputChange}
                    placeholder="Website URL"
                  />
                </div>

                {/* Industry & Status */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Industry</label>
                  <select
                    style={styles.input}
                    name="industry"
                    value={formData.industry || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Industry</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Status</label>
                  <select
                    style={styles.input}
                    name="status"
                    value={formData.status || 'active'}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="prospect">Prospect</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Address */}
                <div className="col-12 mb-3">
                  <label className="form-label">Address</label>
                  <input
                    style={styles.input}
                    name="address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    placeholder="Street address"
                  />
                </div>

                {/* City, State, Country */}
                <div className="col-md-4 mb-3">
                  <label className="form-label">City</label>
                  <input
                    style={styles.input}
                    name="city"
                    value={formData.city || ''}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">State</label>
                  <input
                    style={styles.input}
                    name="state"
                    value={formData.state || ''}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Country</label>
                  <input
                    style={styles.input}
                    name="country"
                    value={formData.country || ''}
                    onChange={handleInputChange}
                    placeholder="Country"
                  />
                </div>

                {/* Postal Code & Currency */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Postal Code</label>
                  <input
                    style={styles.input}
                    name="postalCode"
                    value={formData.postalCode || ''}
                    onChange={handleInputChange}
                    placeholder="Postal code"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Currency</label>
                  <select
                    style={styles.input}
                    name="currency"
                    value={formData.currency || 'USD'}
                    onChange={handleInputChange}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                    <option value="INR">INR</option>
                  </select>
                </div>

                {/* Billing Type & Hourly Rate */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Billing Type</label>
                  <select
                    style={styles.input}
                    name="billingType"
                    value={formData.billingType || 'hourly'}
                    onChange={handleInputChange}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="fixed">Fixed</option>
                    <option value="monthly">Monthly</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Hourly Rate</label>
                  <input
                    style={styles.input}
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate || 0}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                {/* Contract Dates */}
                <div className="col-md-6 mb-3">
                  <label className="form-label">Contract Start Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    name="contractStartDate"
                    value={formData.contractStartDate ? formData.contractStartDate.split('T')[0] : ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Contract End Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    name="contractEndDate"
                    value={formData.contractEndDate ? formData.contractEndDate.split('T')[0] : ''}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Notes */}
                <div className="col-12 mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div style={styles.footer}>
          <button className="btn btn-secondary" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!client || isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Updating...
              </>
            ) : (
              'Update Client'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditClientModal;
