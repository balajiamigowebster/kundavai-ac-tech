import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  X, 
  Sparkles, 
  FolderGit, 
  User, 
  Calendar, 
  FileSpreadsheet, 
  Info,
  Layers,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { API_URL } from '../config';

export default function ProjectAssignments({ showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    employeeId: '',
    customerId: '',
    assignedRole: 'Developer',
    assignedDate: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const predefinedRoles = [
    'Project Manager',
    'Tech Lead',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'UI/UX Designer',
    'QA Engineer',
    'SEO Specialist',
    'Digital Marketer',
    'Developer'
  ];

  useEffect(() => {
    fetchAssignments();
    fetchEmployees();
    fetchCustomers();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/project-assignments`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAssignments(data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

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

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/customers`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers/projects:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAssignment(null);
    setForm({
      employeeId: employees.length > 0 ? employees[0].id.toString() : '',
      customerId: customers.length > 0 ? customers[0].id.toString() : '',
      assignedRole: 'Developer',
      assignedDate: new Date().toISOString().slice(0, 10),
      notes: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (assign) => {
    setEditingAssignment(assign);
    setForm({
      employeeId: assign.employee_id.toString(),
      customerId: assign.customer_id.toString(),
      assignedRole: assign.assigned_role,
      assignedDate: assign.assigned_date ? assign.assigned_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: assign.notes || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm(f => ({ ...f, [id]: value }));
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.customerId || !form.assignedDate) {
      setFormError('Employee, Project, and Date are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      let res;
      if (editingAssignment) {
        res = await fetch(`${API_URL}/api/project-assignments/${editingAssignment.id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      } else {
        res = await fetch(`${API_URL}/api/project-assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save assignment.');
      }

      setShowModal(false);
      fetchAssignments();
      if (showToast) {
        showToast(
          editingAssignment ? 'Project assignment updated!' : 'Employee successfully assigned to project!',
          'success'
        );
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee project assignment?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/project-assignments/${id}/delete`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to remove project assignment.');
      }

      fetchAssignments();
      if (showToast) {
        showToast('Project assignment removed successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not delete project assignment.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Customer/Project Name', 'Assigned Role', 'Start Date', 'Notes'];
    
    const rows = filteredAssignments.map(assign => [
      assign.employee_name || '',
      assign.customer_name || '',
      assign.assigned_role || '',
      assign.assigned_date ? new Date(assign.assigned_date).toLocaleDateString('en-IN') : '',
      assign.notes || ''
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
    link.setAttribute('download', `project_assignments_${new Date().toLocaleDateString('sv')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssignments = assignments.filter(assign => {
    const query = search.toLowerCase();
    const matchesSearch = (
      assign.employee_name.toLowerCase().includes(query) ||
      assign.customer_name.toLowerCase().includes(query) ||
      (assign.notes && assign.notes.toLowerCase().includes(query)) ||
      assign.assigned_role.toLowerCase().includes(query)
    );
    const matchesRole = roleFilter === 'All' || assign.assigned_role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalItems = filteredAssignments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

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

  // Calculate high level metrics
  const totalAllocatedEmployees = new Set(assignments.map(a => a.employee_id)).size;
  const totalActiveProjects = new Set(assignments.map(a => a.customer_id)).size;
  const unallocatedCount = Math.max(0, employees.length - totalAllocatedEmployees);

  return (
    <div>
      {/* Header section */}
      <div className="card-header-flex" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Project Allocation</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Assign team members to projects, manage project roles, and track resource lists.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} /> Export List
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal} disabled={employees.length === 0 || customers.length === 0}>
            <Plus size={18} /> Assign Employee
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ 
          background: 'var(--primary-gradient)', 
          color: '#fff', 
          boxShadow: '0 10px 20px var(--primary-glow)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ opacity: 0.15, position: 'absolute', right: '-10px', bottom: '-10px' }}>
            <Briefcase size={96} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Allocated Team Members</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: '#fff', lineHeight: 1 }}>{totalAllocatedEmployees}</h2>
          <p style={{ fontSize: '0.78rem', marginTop: '8px', opacity: 0.9 }}>Out of {employees.length} total staff members</p>
        </div>

        <div className="stat-card" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1.5px solid var(--border-color)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ opacity: 0.05, position: 'absolute', right: '-10px', bottom: '-10px', color: 'var(--secondary)' }}>
            <Layers size={96} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Active Projects</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: 'var(--secondary)', lineHeight: 1 }}>{totalActiveProjects}</h2>
          <p style={{ fontSize: '0.78rem', marginTop: '8px', color: 'var(--text-muted)' }}>Working with {customers.length} client accounts</p>
        </div>

        <div className="stat-card" style={{ 
          backgroundColor: 'var(--bg-card)', 
          border: '1.5px solid var(--border-color)',
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ opacity: 0.05, position: 'absolute', right: '-10px', bottom: '-10px', color: 'var(--success)' }}>
            <User size={96} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Available Staff</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginTop: '8px', color: 'var(--success)', lineHeight: 1 }}>{unallocatedCount}</h2>
          <p style={{ fontSize: '0.78rem', marginTop: '8px', color: 'var(--text-muted)' }}>Employees currently unassigned</p>
        </div>
      </div>

      {/* Filters and Table Card */}
      <div className="card" style={{ padding: '0 0 24px 0', gap: '16px' }}>
        {/* Filters */}
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '250px' }}>
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
              placeholder="Search assignments by employee, project, or notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select 
              className="form-select" 
              value={roleFilter} 
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: '100%' }}
            >
              <option value="All">All Roles</option>
              {predefinedRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Display Banner if Database lacks data */}
        {employees.length === 0 && (
          <div style={{ margin: '0 24px', padding: '16px', backgroundColor: 'var(--danger-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Info size={20} style={{ color: 'var(--danger)' }} />
            <span style={{ fontSize: '0.88rem', color: 'var(--danger)', fontWeight: 500 }}>
              No employees registered. You need to add employees in the <strong>Employees</strong> directory before you can assign them to projects.
            </span>
          </div>
        )}

        {/* Table Content */}
        {filteredAssignments.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <FolderGit size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontWeight: 500 }}>No project assignments found matching filters.</p>
          </div>
        ) : (
          <div className="table-responsive-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Client Project</th>
                  <th>Assigned Role</th>
                  <th>Assignment Date</th>
                  <th>Project Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssignments.map((assign) => (
                  <tr key={assign.id}>
                    <td style={{ fontWeight: 600, padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50px',
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}>
                          {assign.employee_name ? assign.employee_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{assign.employee_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: EMP-{assign.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{assign.customer_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: 500 }}>{assign.customer_id_seq}</div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-status" style={{
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '4px 10px',
                        borderRadius: '50px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}>
                        {assign.assigned_role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{assign.assigned_date ? new Date(assign.assigned_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div 
                        style={{ 
                          maxWidth: '240px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)'
                        }} 
                        title={assign.notes || 'No notes provided'}
                      >
                        {assign.notes || <em style={{ color: 'var(--text-muted)' }}>No details entered</em>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-icon-only" onClick={() => handleOpenEditModal(assign)} title="Edit Role/Notes">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon-only" onClick={() => handleDeleteAssignment(assign.id)} title="Remove Assignment">
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

        {filteredAssignments.length > 0 && (
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

      {/* Add/Edit Allocation Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="invoice-modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                {editingAssignment ? 'Modify Project Allocation' : 'Assign Team Member to Project'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAssignment}>
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

                {/* Employee select */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Select Staff Member *</label>
                  <select 
                    id="employeeId"
                    className="form-select"
                    value={form.employeeId}
                    onChange={handleInputChange}
                    disabled={!!editingAssignment}
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.employee_name} (₹{parseFloat(emp.salary).toLocaleString('en-IN')}/mo)</option>
                    ))}
                  </select>
                </div>

                {/* Project select */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Select Client Project *</label>
                  <select 
                    id="customerId"
                    className="form-select"
                    value={form.customerId}
                    onChange={handleInputChange}
                    disabled={!!editingAssignment}
                    required
                  >
                    {customers.map(cust => (
                      <option key={cust.id} value={cust.id}>{cust.customer_name} - {cust.customer_id_seq}</option>
                    ))}
                  </select>
                </div>

                {/* Role and Date Grid */}
                <div className="form-grid" style={{ marginBottom: '16px', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label">Project Role *</label>
                    <select
                      id="assignedRole"
                      className="form-select"
                      value={form.assignedRole}
                      onChange={handleInputChange}
                      required
                    >
                      {predefinedRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assignment Start Date *</label>
                    <input
                      id="assignedDate"
                      type="date"
                      className="form-input"
                      value={form.assignedDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Allocation Notes / Deliverables</label>
                  <textarea
                    id="notes"
                    className="form-input"
                    style={{ minHeight: '90px', resize: 'vertical' }}
                    placeholder="e.g. Assigned to write API integrations and perform code review tasks."
                    value={form.notes}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Processing...' : editingAssignment ? 'Save Changes' : 'Assign Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
