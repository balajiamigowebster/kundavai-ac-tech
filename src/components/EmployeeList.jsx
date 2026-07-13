import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, Sparkles, UserCheck, Phone, MapPin, IndianRupee, FileSpreadsheet } from 'lucide-react';
import { API_URL } from '../config';

export default function EmployeeList({ showToast }) {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    employeeName: '',
    phoneNumber: '',
    address: '',
    salary: ''
  });

  const handleExportToExcel = () => {
    const headers = ['Name', 'Phone Number', 'Address', 'Base Salary', 'Total Paid'];
    
    const rows = filteredEmployees.map(emp => [
      emp.employee_name || '',
      emp.phone_number || '',
      emp.address || '',
      parseFloat(emp.base_salary) || 0,
      parseFloat(emp.total_paid) || 0
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
    link.setAttribute('download', `employee_list_${new Date().toLocaleDateString('sv')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/employees`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setForm({
      employeeName: '',
      phoneNumber: '',
      address: '',
      salary: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setForm({
      employeeName: emp.employee_name,
      phoneNumber: emp.phone_number,
      address: emp.address,
      salary: emp.salary.toString()
    });
    setFormError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm(f => ({ ...f, [id]: value }));
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!form.employeeName || !form.phoneNumber || !form.address || !form.salary) {
      setFormError('All fields are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      let res;
      if (editingEmployee) {
        res = await fetch(`${API_URL}/api/employees/${editingEmployee.id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      } else {
        res = await fetch(`${API_URL}/api/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save employee.');
      }

      setShowModal(false);
      fetchEmployees();
      if (showToast) {
        showToast(
          editingEmployee ? 'Employee updated successfully!' : 'Employee added successfully!',
          'success'
        );
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee? This will set employee links in old expenses to null.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/employees/${id}/delete`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to delete employee.');
      }

      fetchEmployees();
      if (showToast) {
        showToast('Employee removed successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not delete employee.');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const query = search.toLowerCase();
    return (
      emp.employee_name.toLowerCase().includes(query) ||
      emp.phone_number.includes(query) ||
      emp.address.toLowerCase().includes(query)
    );
  });

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Employee Directory</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage staff details, contact info, base salary, and tracking paid payouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Add Employee
          </button>
        </div>
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
              placeholder="Search employees by name, phone, or address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Employees Table */}
        {filteredEmployees.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No employee records found.</p>
          </div>
        ) : (
          <div className="table-responsive-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th style={{ textAlign: 'right' }}>Base Salary</th>
                  <th style={{ textAlign: 'right' }}>Total Paid</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50px',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 700
                      }}>
                        {emp.employee_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span>{emp.employee_name}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                        <Phone size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{emp.phone_number}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={emp.address}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span>{emp.address}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{parseFloat(emp.salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      ₹{parseFloat(emp.total_paid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-icon-only" onClick={() => handleOpenEditModal(emp)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon-only" onClick={() => handleDeleteEmployee(emp.id)} title="Delete">
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

        {filteredEmployees.length > 0 && (
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

      {/* Add/Edit Employee Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="invoice-modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                {editingEmployee ? 'Edit Staff Profile' : 'Add Staff Member'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEmployee}>
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
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="employeeName">Full Name *</label>
                  <input
                    id="employeeName"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rajesh Kumar"
                    value={form.employeeName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-grid" style={{ marginBottom: '16px', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phoneNumber">Phone Number *</label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      className="form-input"
                      placeholder="e.g. +91 98765 43210"
                      value={form.phoneNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="salary">Base Monthly Salary (₹) *</label>
                    <input
                      id="salary"
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 35000"
                      value={form.salary}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="address">Residential Address *</label>
                  <textarea
                    id="address"
                    className="form-input"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Enter complete residential address"
                    value={form.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingEmployee ? 'Save Changes' : 'Register Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
