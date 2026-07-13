import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, ShieldAlert, AlertCircle, X, Sparkles } from 'lucide-react';
import { API_URL } from '../config';

export default function Services({ onNavigate, showToast }) {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  // Form State
  const [form, setForm] = useState({
    serviceCode: '',
    serviceName: '',
    cost: '',
    timeline: '2 weeks'
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingService, setDeletingService] = useState(null);


  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/services`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setServices(data);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    let nextNum = 101;
    if (services.length > 0) {
      const nums = services.map(s => {
        const parts = s.service_code.split('-');
        return parts.length === 2 ? parseInt(parts[1], 10) : null;
      }).filter(n => n !== null && !isNaN(n));
      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1;
      }
    }

    setEditingService(null);
    setForm({
      serviceCode: `S-${nextNum}`,
      serviceName: '',
      cost: '',
      timeline: '2 weeks'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (service) => {
    setEditingService(service);
    setForm({
      serviceCode: service.service_code,
      serviceName: service.service_name,
      cost: service.cost.toString(),
      timeline: service.timeline || '2 weeks'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm(f => ({ ...f, [id]: value }));
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!form.serviceName || !form.cost) {
      setFormError('Service Name and Cost are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      let res;
      if (editingService) {
        res = await fetch(`${API_URL}/api/services/${editingService.id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      } else {
        res = await fetch(`${API_URL}/api/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save service.');
      }

      setShowModal(false);
      fetchServices();
      if (showToast) {
        showToast(
          editingService ? 'Service updated successfully!' : 'Service cataloged successfully!',
          'success'
        );
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingService) return;

    try {
      const res = await fetch(`${API_URL}/api/services/${deletingService.id}/delete`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to delete service.');
      }

      setDeletingService(null);
      fetchServices();
      if (showToast) {
        showToast('Service deleted successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast('Could not delete service.', 'error');
      }
    }
  };

  const filteredServices = services.filter(serv => {
    const query = search.toLowerCase();
    const code = serv.service_code || '';
    const name = serv.service_name || '';
    return (
      code.toLowerCase().includes(query) ||
      name.toLowerCase().includes(query)
    );
  });

  const totalItems = filteredServices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedServices = filteredServices.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Agency Services Catalog</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage website development and digital marketing services offered by the agency.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Add Service
        </button>
      </div>

      <div className="card" style={{ padding: '0 0 24px 0', gap: '16px' }}>
        {/* Search */}
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', gap: '16px' }}>
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Search services by name or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Services Table */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading catalog list...</p>
        ) : filteredServices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>No services cataloged.</p>
        ) : (
          <div className="table-responsive-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Service Code</th>
                  <th>Service Name</th>
                  <th>Cost (INR)</th>
                  <th>Project Timeline</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedServices.map((service) => (
                  <tr key={service.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{service.service_code}</td>
                    <td style={{ fontWeight: 600 }}>{service.service_name}</td>
                    <td style={{ fontWeight: 700 }}>₹{parseFloat(service.cost).toFixed(2)}</td>
                    <td>{service.timeline || '2 weeks'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-icon-only" onClick={() => handleOpenEditModal(service)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon-only" onClick={() => setDeletingService(service)} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredServices.length > 0 && !loading && (
          <div className="pagination-container">
            <span className="pagination-info">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
            </span>
            <div className="pagination-buttons">
              <button 
                className="btn-pagination" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`btn-pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button 
                className="btn-pagination" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="invoice-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                {editingService ? 'Modify Service' : 'Add Agency Service'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveService}>
              <div className="invoice-modal-body">
                {formError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'var(--danger-light)',
                    color: 'var(--danger)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '16px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="serviceCode">Service Code (Auto)</label>
                  <input
                    id="serviceCode"
                    type="text"
                    className="form-input"
                    value={form.serviceCode}
                    disabled
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="serviceName">Service Name *</label>
                  <input
                    id="serviceName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. E-commerce Website Development"
                    value={form.serviceName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-grid" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="cost">Service Cost (INR) *</label>
                    <input
                      id="cost"
                      type="number"
                      className="form-input"
                      placeholder="e.g. 50000"
                      value={form.cost}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="timeline">Est. Project Timeline</label>
                    <select
                      id="timeline"
                      className="form-select"
                      value={form.timeline}
                      onChange={handleInputChange}
                    >
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="3 weeks">3 weeks</option>
                      <option value="4 weeks">4 weeks</option>
                      <option value="6 weeks">6 weeks</option>
                      <option value="2 months">2 months</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingService && (
        <div className="modal-backdrop centered" onClick={() => setDeletingService(null)}>
          <div className="invoice-modal centered" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header" style={{ borderBottom: 'none' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <ShieldAlert size={22} />
                Delete Service?
              </h3>
            </div>
            <div className="invoice-modal-body" style={{ padding: '0 24px 20px 24px', minHeight: 'auto' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete <strong>{deletingService.service_name}</strong> ({deletingService.service_code})? This action cannot be undone.
              </p>
            </div>
            <div className="invoice-modal-footer" style={{ borderTop: 'none' }}>
              <button type="button" className="btn btn-outline" onClick={() => setDeletingService(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
