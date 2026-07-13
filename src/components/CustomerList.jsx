import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, AlertCircle, Sparkles, X, Pencil, Trash2, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import { API_URL } from '../config';

export default function CustomerList({ onNavigate, openRegisterModal, onCloseRegisterModal, onSaveSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [leads, setLeads] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nextCustomerId, setNextCustomerId] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  
  // Registration Form State
  const [form, setForm] = useState({
    customerName: '',
    mobileNumber: '',
    email: '',
    pincode: '',
    city: '',
    address: '',
    assignedLead: '',
    projectBrief: ''
  });
  
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleExportToExcel = () => {
    const headers = ['Customer ID', 'Customer Name', 'Mobile Number', 'Email', 'City', 'Pincode', 'Address', 'Project Brief'];
    
    const rows = filteredCustomers.map(cust => [
      cust.customer_id_seq || '',
      cust.customer_name || '',
      cust.mobile_number || '',
      cust.email_address || '',
      cust.city || '',
      cust.pincode || '',
      cust.address || '',
      cust.project_brief || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customer_list_${new Date().toLocaleDateString('sv')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchCustomers();
    fetchLeads();
    if (openRegisterModal) {
      handleOpenAddModal();
    }
  }, [openRegisterModal]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customers`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leads`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setLeads(data);
        if (data.length > 0) {
          setForm(f => ({ ...f, assignedLead: data[0].lead_name }));
        }
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  const handleOpenAddModal = async () => {
    setEditingCustomer(null);
    setForm({
      customerName: '',
      mobileNumber: '',
      email: '',
      pincode: '',
      city: '',
      address: '',
      assignedLead: leads.length > 0 ? leads[0].lead_name : 'Kundavai AC Tec',
      projectBrief: ''
    });
    setFormError('');
    setShowAddModal(true);

    try {
      const res = await fetch(`${API_URL}/api/customers/next-id`);
      const data = await res.json();
      setNextCustomerId(data.nextId);
    } catch (err) {
      console.error('Error getting next customer ID:', err);
      setNextCustomerId('C-101');
    }
  };

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    setNextCustomerId(customer.customer_id_seq);
    setForm({
      customerName: customer.customer_name,
      mobileNumber: customer.mobile_number,
      email: customer.email || '',
      pincode: customer.pincode || '',
      city: customer.city || '',
      address: customer.address || '',
      assignedLead: customer.assigned_lead || 'Kundavai AC Tec',
      projectBrief: customer.project_brief || ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCustomer(null);
    if (onCloseRegisterModal) {
      onCloseRegisterModal();
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm(f => ({ ...f, [id]: value }));
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!form.customerName || !form.mobileNumber) {
      setFormError('Customer Name and Mobile Number are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      let res;
      if (editingCustomer) {
        res = await fetch(`${API_URL}/api/customers/${editingCustomer.id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      } else {
        res = await fetch(`${API_URL}/api/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerIdSeq: nextCustomerId,
            ...form
          })
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save customer.');
      }

      handleCloseModal();
      fetchCustomers();
      if (onSaveSuccess) {
        onSaveSuccess(editingCustomer ? 'Customer updated successfully!' : 'Customer added successfully!');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;

    try {
      const res = await fetch(`${API_URL}/api/customers/${deletingCustomer.id}/delete`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to delete customer.');
      }

      setDeletingCustomer(null);
      fetchCustomers();
      if (onSaveSuccess) {
        onSaveSuccess('Customer deleted successfully!');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not delete customer.');
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const query = search.toLowerCase();
    const name = customer.customer_name || '';
    const idSeq = customer.customer_id_seq || '';
    const mobile = customer.mobile_number || '';
    const city = customer.city || '';
    return (
      name.toLowerCase().includes(query) ||
      idSeq.toLowerCase().includes(query) ||
      mobile.includes(query) ||
      city.toLowerCase().includes(query)
    );
  });

  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Customer Accounts</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage corporate clients, active customers, and project details.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Add Customer
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0 0 24px 0', gap: '16px' }}>
        {/* Search Bar */}
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
              placeholder="Search by customer name, mobile, ID, or city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Customer Table */}
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No customer records found.</p>
          </div>
        ) : (
          <div className="table-responsive-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Project Lead</th>
                  <th>Project Brief</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{customer.customer_id_seq}</td>
                    <td style={{ fontWeight: 600, whiteSpace: 'normal', minWidth: '140px' }}>{customer.customer_name}</td>
                    <td>{customer.mobile_number}</td>
                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-all', minWidth: '150px' }}>{customer.email || '—'}</td>
                    <td>{customer.city || '—'}</td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'normal', minWidth: '110px' }}>{customer.assigned_lead}</td>
                    <td style={{
                      color: 'var(--text-secondary)',
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={customer.project_brief}>
                      {customer.project_brief || 'No details recorded'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-icon-only" onClick={() => handleOpenEditModal(customer)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon-only" onClick={() => setDeletingCustomer(customer)} title="Delete">
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

        {filteredCustomers.length > 0 && (
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

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="invoice-modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                {editingCustomer ? 'Edit Customer Account' : 'Add Customer Account'}
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer}>
              <div className="invoice-modal-body" style={{ maxHeight: '70vh' }}>
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

                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="customerIdSeq">Customer ID (Auto)</label>
                    <input
                      id="customerIdSeq"
                      type="text"
                      className="form-input"
                      value={nextCustomerId}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="customerName">Customer Name *</label>
                    <input
                      id="customerName"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dharma Productions"
                      value={form.customerName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="mobileNumber">Mobile Number *</label>
                    <input
                      id="mobileNumber"
                      type="tel"
                      className="form-input"
                      placeholder="Enter mobile number"
                      value={form.mobileNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      className="form-input"
                      placeholder="client@company.com"
                      value={form.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="assignedLead">Assigned Project Lead</label>
                    <select
                      id="assignedLead"
                      className="form-select"
                      value={form.assignedLead}
                      onChange={handleInputChange}
                    >
                      {leads.map(l => (
                        <option key={l.id} value={l.lead_name}>{l.lead_name} ({l.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-grid" style={{ gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="city">City</label>
                      <input
                        id="city"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Bangalore"
                        value={form.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pincode">Pincode</label>
                      <input
                        id="pincode"
                        type="text"
                        className="form-input"
                        placeholder="560001"
                        value={form.pincode}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="address">Billing Address</label>
                  <textarea
                    id="address"
                    className="form-textarea"
                    rows="2"
                    placeholder="Enter company billing address"
                    value={form.address}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="projectBrief">Project Requirements / Brief</label>
                  <textarea
                    id="projectBrief"
                    className="form-textarea"
                    rows="4"
                    placeholder="Describe main project requirements, technologies needed, scope..."
                    value={form.projectBrief}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingCustomer ? 'Save Changes' : 'Add Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingCustomer && (
        <div className="modal-backdrop centered" onClick={() => setDeletingCustomer(null)}>
          <div className="invoice-modal centered" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header" style={{ borderBottom: 'none' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <ShieldAlert size={22} />
                Delete Customer?
              </h3>
            </div>
            <div className="invoice-modal-body" style={{ padding: '0 24px 20px 24px', minHeight: 'auto' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete customer <strong>{deletingCustomer.customer_name}</strong> ({deletingCustomer.customer_id_seq})? This action cannot be undone.
              </p>
            </div>
            <div className="invoice-modal-footer" style={{ borderTop: 'none' }}>
              <button type="button" className="btn btn-outline" onClick={() => setDeletingCustomer(null)}>Cancel</button>
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
