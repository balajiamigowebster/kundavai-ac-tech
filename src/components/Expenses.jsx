import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, Sparkles, Receipt, Calendar, IndianRupee, Megaphone, UserCheck, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function Expenses({ showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    expenseName: '',
    category: 'Salary',
    amount: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    employeeId: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/expenses`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/api/employees`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setEmployees(data);
        if (data.length > 0) {
          setForm(f => ({ ...f, employeeId: data[0].id.toString() }));
        }
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setForm({
      expenseName: '',
      category: 'Salary',
      amount: '',
      expenseDate: new Date().toISOString().slice(0, 10),
      employeeId: employees.length > 0 ? employees[0].id.toString() : ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (exp) => {
    setEditingExpense(exp);
    setForm({
      expenseName: exp.expense_name,
      category: exp.category,
      amount: exp.amount.toString(),
      expenseDate: new Date(exp.expense_date).toISOString().slice(0, 10),
      employeeId: exp.employee_id ? exp.employee_id.toString() : ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm(f => {
      const updated = { ...f, [id]: value };
      
      // Auto-generate salary expense description when employee is selected
      if (id === 'employeeId' && f.category === 'Salary') {
        const emp = employees.find(e => e.id.toString() === value);
        if (emp) {
          const currentMonth = new Date(f.expenseDate).toLocaleString('default', { month: 'long' });
          updated.expenseName = `Salary Paid - ${emp.employee_name} (${currentMonth})`;
          updated.amount = emp.salary.toString();
        }
      }
      
      // Handle description change on Category change
      if (id === 'category') {
        if (value === 'Salary' && employees.length > 0) {
          const defaultEmpId = updated.employeeId || employees[0].id.toString();
          const emp = employees.find(e => e.id.toString() === defaultEmpId);
          if (emp) {
            const currentMonth = new Date(f.expenseDate).toLocaleString('default', { month: 'long' });
            updated.expenseName = `Salary Paid - ${emp.employee_name} (${currentMonth})`;
            updated.amount = emp.salary.toString();
            updated.employeeId = defaultEmpId;
          }
        } else if (value === 'Ads') {
          updated.expenseName = 'Google/Facebook Ad Campaign Spend';
          updated.amount = '';
          updated.employeeId = '';
        } else {
          updated.expenseName = '';
          updated.amount = '';
          updated.employeeId = '';
        }
      }

      return updated;
    });
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!form.expenseName || !form.category || !form.amount || !form.expenseDate) {
      setFormError('All fields are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      ...form,
      employeeId: form.category === 'Salary' && form.employeeId ? parseInt(form.employeeId) : null
    };

    try {
      let res;
      if (editingExpense) {
        res = await fetch(`${API_URL}/api/expenses/${editingExpense.id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/api/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save expense.');
      }

      setShowModal(false);
      fetchExpenses();
      if (showToast) {
        showToast(
          editingExpense ? 'Expense updated successfully!' : 'Expense logged successfully!',
          'success'
        );
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/expenses/${id}/delete`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to delete expense.');
      }

      fetchExpenses();
      if (showToast) {
        showToast('Expense record deleted.', 'success');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not delete expense.');
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const query = search.toLowerCase();
    const name = exp.expense_name || '';
    const cat = exp.category || '';
    const emp = exp.employee_name || '';
    return (
      name.toLowerCase().includes(query) ||
      cat.toLowerCase().includes(query) ||
      emp.toLowerCase().includes(query)
    );
  });

  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

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

  // Calculate expense statistics
  const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const salaryExpense = expenses.filter(e => e.category === 'Salary').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const adsExpense = expenses.filter(e => e.category === 'Ads').reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const otherExpense = expenses.filter(e => e.category !== 'Salary' && e.category !== 'Ads').reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Expense Tracker</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Log marketing, advertising, operational, and staff salary payout costs.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Log Expense
        </button>
      </div>

      {/* Expense Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Receipt size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Expenses</p>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '2px' }}>₹{totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>

        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Salaries Paid</p>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '2px' }}>₹{salaryExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>

        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'hsl(190, 80%, 94%)',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Megaphone size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Marketing & Ads</p>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '2px' }}>₹{adsExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
          </div>
        </div>

        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'var(--warning-light)',
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Other Expenses</p>
            <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '2px' }}>₹{otherExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
          </div>
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
              placeholder="Search expenses by description, category, or employee..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Expenses List Table */}
        {filteredExpenses.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No expense records found.</p>
          </div>
        ) : (
          <div className="table-responsive-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Expense / Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Associated Employee</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ fontWeight: 600, padding: '16px 8px' }}>
                      {exp.expense_name}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '50px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: 
                          exp.category === 'Salary' ? 'var(--primary-light)' :
                          exp.category === 'Ads' ? 'hsl(190, 80%, 94%)' :
                          exp.category === 'Rent' ? 'var(--warning-light)' : 'var(--bg-input)',
                        color:
                          exp.category === 'Salary' ? 'var(--primary)' :
                          exp.category === 'Ads' ? 'var(--secondary)' :
                          exp.category === 'Rent' ? 'var(--warning)' : 'var(--text-secondary)'
                      }}>
                        {exp.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(exp.expense_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    </td>
                    <td>
                      {exp.category === 'Salary' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 500, color: 'var(--primary)' }}>
                          <UserCheck size={13} />
                          <span>{exp.employee_name || 'Removed Staff'}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                      ₹{parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-icon-only" onClick={() => handleOpenEditModal(exp)} title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button className="btn btn-danger btn-icon-only" onClick={() => handleDeleteExpense(exp.id)} title="Delete">
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

        {filteredExpenses.length > 0 && (
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

      {/* Log/Edit Expense Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="invoice-modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                {editingExpense ? 'Edit Expense Record' : 'Log Business Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpense}>
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

                <div className="form-grid" style={{ marginBottom: '16px', gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="category">Expense Category *</label>
                    <select
                      id="category"
                      className="form-select"
                      value={form.category}
                      onChange={handleInputChange}
                    >
                      <option value="Salary">Salary Payment</option>
                      <option value="Ads">Ads & Marketing</option>
                      <option value="Rent">Office Rent</option>
                      <option value="Utilities">Utilities (Web Host, Software)</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="expenseDate">Expense Date *</label>
                    <input
                      id="expenseDate"
                      type="date"
                      className="form-input"
                      value={form.expenseDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {form.category === 'Salary' && (
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label className="form-label" htmlFor="employeeId">Select Employee *</label>
                    {employees.length === 0 ? (
                      <p style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 500 }}>
                        No employees registered. Please register employees first.
                      </p>
                    ) : (
                      <select
                        id="employeeId"
                        className="form-select"
                        value={form.employeeId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map(e => (
                          <option key={e.id} value={e.id}>{e.employee_name} (Base: ₹{parseFloat(e.salary).toLocaleString('en-IN')})</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="form-grid" style={{ marginBottom: '16px', gridTemplateColumns: '2fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="expenseName">Expense Description *</label>
                    <input
                      id="expenseName"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Paid Rent, Google Ads"
                      value={form.expenseName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="amount">Amount (₹) *</label>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 5000"
                      value={form.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || (form.category === 'Salary' && !form.employeeId)}>
                  {saving ? 'Logging...' : editingExpense ? 'Save Changes' : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
