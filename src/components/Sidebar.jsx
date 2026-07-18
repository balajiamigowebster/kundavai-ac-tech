import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Code, 
  CreditCard, 
  Briefcase, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Sparkles,
  UserCheck,
  Receipt,
  FolderGit
} from 'lucide-react';

export default function Sidebar({ 
  collapsed, 
  onToggle, 
  activeTab, 
  onTabChange, 
  doctorInfo, 
  onLogout,
  mobileOpen,
  onMobileClose
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customer-list', label: 'Customer List', icon: Users },
    { id: 'meetings', label: 'Appointments', icon: Calendar },
    { id: 'services', label: 'Services', icon: Code },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'proposals', label: 'Proposals', icon: Briefcase },
    { id: 'employees', label: 'Employees', icon: UserCheck },
    // { id: 'project-assignments', label: 'Project Allocation', icon: FolderGit },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <button className="sidebar-toggle-btn" onClick={onToggle} aria-label="Toggle Sidebar">
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div>
        <div className="sidebar-header">
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ 
                height: '36px', 
                width: 'auto', 
                objectFit: 'contain'
              }} 
            />
            <div className="logo-text">
              <h2 style={{ fontSize: '1.02rem', fontWeight: 800 }}>Kundavai</h2>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>AC TEC</p>
            </div>
          </div>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <div 
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onTabChange(item.id);
                    if (onMobileClose) onMobileClose();
                  }}
                >
                  <Icon size={20} className="menu-item-icon" />
                  <span className="menu-item-label">{item.label}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-footer">
        <div className="profile-avatar" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>
          {doctorInfo.initials || 'BN'}
        </div>
        <div className="sidebar-footer-text" style={{ flexGrow: 1, minWidth: 0, paddingLeft: '8px' }}>
          <h4 style={{ 
            fontSize: '0.85rem', 
            fontWeight: 600, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            {doctorInfo.username || 'Kundavai AC Tec'}
          </h4>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Project Director</p>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
