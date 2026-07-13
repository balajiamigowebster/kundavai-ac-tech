import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import Meetings from './components/Meetings';
import Services from './components/Services';
import Billing from './components/Billing';
import InvoicePrint from './components/InvoicePrint';
import Login from './components/Login';
import EmployeeList from './components/EmployeeList';
import Expenses from './components/Expenses';
import ProjectAssignments from './components/ProjectAssignments';
import { Sparkles, FileText, CheckCircle, AlertCircle, Trash2, Printer, Code, Menu } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [printInvoice, setPrintInvoice] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('amigo_billing_user_v2');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('amigo_billing_user_v2', JSON.stringify(userData));
    showToast('Logged in successfully!', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('amigo_billing_user_v2');
    showToast('Logged out successfully.', 'success');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSaveSuccess = (message) => {
    showToast(message, 'success');
  };

  // Rendering active tab content
  const renderTabContent = () => {
    return (
      <div className="page-enter" key={activeTab}>
        {(() => {
          switch (activeTab) {
            case 'dashboard':
              return (
                <Dashboard 
                  onNavigate={setActiveTab} 
                  onPrintInvoice={setPrintInvoice} 
                  showToast={showToast} 
                />
              );
            case 'customer-list':
            case 'customer-registry':
              return (
                <CustomerList 
                  onNavigate={setActiveTab}
                  openRegisterModal={activeTab === 'customer-registry'}
                  onCloseRegisterModal={() => setActiveTab('customer-list')}
                  onSaveSuccess={handleSaveSuccess}
                />
              );
            case 'meetings':
              return (
                <Meetings 
                  onNavigate={setActiveTab} 
                  showToast={showToast} 
                />
              );
            case 'services':
              return (
                <Services 
                  onNavigate={setActiveTab} 
                  showToast={showToast} 
                />
              );
            case 'billing':
              return (
                <Billing 
                  onNavigate={setActiveTab} 
                  onPrintInvoice={setPrintInvoice} 
                  showToast={showToast} 
                />
              );
            case 'proposals':
              return <ProposalsTab showToast={showToast} />;
            case 'employees':
              return <EmployeeList showToast={showToast} />;
            case 'project-assignments':
              return <ProjectAssignments showToast={showToast} />;
            case 'expenses':
              return <Expenses showToast={showToast} />;
            case 'reports':
              return <ReportsTab />;
            default:
              return <Dashboard onNavigate={setActiveTab} onPrintInvoice={setPrintInvoice} showToast={showToast} />;
          }
        })()}
      </div>
    );
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        doctorInfo={user}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 99
          }}
        />
      )}

      <main className="main-content">
        {/* Sticky Mobile Header Bar */}
        <div className="mobile-header-bar">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px'
            }}
            aria-label="Open navigation menu"
          >
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }} 
            />
            <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>Kundavai AC Tec</span>
          </div>
        </div>

        {renderTabContent()}
      </main>

      {/* Invoice Print Overlay */}
      {printInvoice && (
        <InvoicePrint 
          invoice={printInvoice} 
          onClose={() => setPrintInvoice(null)} 
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= PROPOSALS TAB (WORK SCOPE WRITER) =================
function ProposalsTab({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [deliverables, setDeliverables] = useState([
    { item: 'WordPress CMS Custom Development', milestone: 'Milestone 1 - Prototype', duration: '2 weeks' }
  ]);
  const [scopeNotes, setScopeNotes] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/customers');
      const data = await res.json();
      setCustomers(data);
      if (data.length > 0) setSelectedCustomer(data[0].id);
    } catch (e) {
      console.error(e);
    }
  };

  const addRow = () => {
    setDeliverables([...deliverables, { item: '', milestone: 'Milestone 1 - Prototype', duration: '1 week' }]);
  };

  const removeRow = (index) => {
    setDeliverables(deliverables.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...deliverables];
    updated[index][field] = value;
    setDeliverables(updated);
  };

  const handlePrintProposal = (e) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select a customer.');
      return;
    }
    window.print();
  };

  const customerObj = customers.find(c => c.id.toString() === selectedCustomer.toString());

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Project Proposal Scope Builder</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Draft project scope details and print deliverables proposals for customers.</p>
        </div>
      </div>

      <div className="proposals-grid">
        {/* Editor */}
        <div className="card" style={{ gap: '16px' }}>
          <h3 className="card-title">Scope of Work Builder</h3>
          <form onSubmit={handlePrintProposal}>
            <div className="form-group">
              <label className="form-label">Select Customer Account</label>
              <select 
                className="form-select" 
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customer_name} ({c.customer_id_seq})</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="form-label" style={{ margin: 0 }}>Deliverables List</span>
                <button type="button" className="btn btn-secondary" onClick={addRow} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                  Add Item
                </button>
              </div>

              {deliverables.map((deliv, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. SEO indexing, Database design" 
                    value={deliv.item} 
                    onChange={e => handleRowChange(index, 'item', e.target.value)}
                    required
                  />
                  <select 
                    className="form-select" 
                    value={deliv.milestone} 
                    onChange={e => handleRowChange(index, 'milestone', e.target.value)}
                  >
                    <option value="Milestone 1 - Prototype">Milestone 1 - Prototype</option>
                    <option value="Milestone 2 - MVP Integration">Milestone 2 - MVP Integration</option>
                    <option value="Milestone 3 - Live Testing">Milestone 3 - Live Testing</option>
                    <option value="Post-Live Maintenance">Post-Live Maintenance</option>
                  </select>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Duration" 
                    value={deliv.duration} 
                    onChange={e => handleRowChange(index, 'duration', e.target.value)}
                  />
                  <button type="button" className="btn btn-danger btn-icon-only" onClick={() => removeRow(index)} disabled={deliverables.length === 1}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Project Scope Scope / Technical Notes</label>
              <textarea 
                className="form-textarea" 
                rows="3" 
                placeholder="Tech stack: Node.js, React.js. Hosting: Vercel, AWS RDS MariaDB..."
                value={scopeNotes}
                onChange={e => setScopeNotes(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                <Printer size={16} /> Print Scope Order
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="card" style={{ 
          backgroundColor: '#fff', 
          color: '#111', 
          padding: '30px', 
          position: 'relative', 
          minHeight: '400px',
          border: '1.5px solid var(--border-color)'
        }}>
          {/* Header */}
          <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.25rem', color: '#111' }}>KUNDAVAI AC TEC</h2>
              <p style={{ fontSize: '0.72rem', color: '#555' }}>Tech Hub Tower, IT Park | Phone: +91 98765 43210</p>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
            <p><strong>Client Company:</strong> {customerObj ? customerObj.customer_name : 'No client selected'}</p>
            <p><strong>Representative City:</strong> {customerObj ? customerObj.city : '—'}</p>
            <p><strong>Proposal Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Work Order Scope
          </div>

          <div style={{ flexGrow: 1, fontSize: '0.85rem' }}>
            {deliverables.map((deliv, i) => (
              <div key={i} style={{ borderBottom: '1px solid #eee', padding: '6px 0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{deliv.item || 'Project Deliverable'}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{deliv.milestone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Timeline</div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>{deliv.duration}</div>
                </div>
              </div>
            ))}

            {scopeNotes && (
              <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'var(--primary-light)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>Project Details / Notes:</div>
                <div style={{ fontSize: '0.8rem', color: '#333' }}>{scopeNotes}</div>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #ccc', paddingTop: '12px', marginTop: '40px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#555' }}>
            <span>Kundavai AC Tec (Project Director)</span>
            <span>Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= REPORTS TAB (AGENCY REVENUE REPORTS) =================
function ReportsTab() {
  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Agency Business Reports</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Analytical reports of monthly billing and top agency services.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Revenue chart */}
        <div className="card" style={{ gap: '16px' }}>
          <h3 className="card-title">Monthly Billings (₹ in Lakhs)</h3>
          <div style={{ display: 'flex', height: '220px', alignItems: 'flex-end', justifyContent: 'space-around', padding: '20px 0 10px 0', borderBottom: '1px solid var(--border-color)' }}>
            {[
              { month: 'Jan', val: 2.2, color: 'var(--primary)' },
              { month: 'Feb', val: 3.5, color: 'var(--primary)' },
              { month: 'Mar', val: 4.8, color: 'var(--primary)' },
              { month: 'Apr', val: 3.9, color: 'var(--primary)' },
              { month: 'May', val: 5.4, color: 'var(--primary)' },
              { month: 'Jun', val: 7.2, color: 'var(--primary)' }
            ].map((bar, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, marginBottom: '6px' }}>{bar.val}L</span>
                <div style={{ 
                  width: '24px', 
                  height: `${bar.val * 24}px`, 
                  backgroundColor: bar.color, 
                  borderRadius: '6px 6px 0 0',
                  boxShadow: '0 4px 10px var(--primary-glow)',
                  transition: 'height 0.3s ease'
                }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular services chart */}
        <div className="card" style={{ gap: '16px' }}>
          <h3 className="card-title">Top Project Services</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {[
              { name: 'E-commerce Web Development', count: 18, pct: 85, color: 'var(--primary)' },
              { name: 'SEO Audit & Optimization', count: 14, pct: 65, color: 'var(--secondary)' },
              { name: 'Pay-Per-Click Ads Management', count: 9, pct: 45, color: 'var(--warning)' },
              { name: 'UI/UX Design', count: 7, pct: 35, color: 'var(--danger)' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                  <span>{item.name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.count} Projects</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '50px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: '50px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
