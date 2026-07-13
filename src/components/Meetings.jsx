import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, Search, User, FileText, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { API_URL } from '../config';

export default function Meetings({ onNavigate, showToast }) {
  const [meetings, setMeetings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('sv'));
  const [showBookModal, setShowBookModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    meetingDate: new Date().toLocaleDateString('sv'),
    meetingTime: '10:00 AM',
    agenda: '',
    leadName: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);


  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  useEffect(() => {
    fetchMeetings();
    fetchCustomersAndLeads();
    setCurrentPage(1);
  }, [selectedDate]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/meetings?date=${selectedDate}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setMeetings(data);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndLeads = async () => {
    try {
      const custRes = await fetch(`${API_URL}/api/customers`);
      const custData = await custRes.json();
      if (custRes.ok && Array.isArray(custData)) {
        setCustomers(custData);
      }

      const leadRes = await fetch(`${API_URL}/api/leads`);
      const leadData = await leadRes.json();
      if (leadRes.ok && Array.isArray(leadData)) {
        setLeads(leadData);
      }

      if (custRes.ok && Array.isArray(custData) && custData.length > 0) {
        setForm(f => ({ ...f, customerId: custData[0].id }));
      }
      if (leadRes.ok && Array.isArray(leadData) && leadData.length > 0) {
        setForm(f => ({ ...f, leadName: leadData[0].lead_name }));
      }
    } catch (err) {
      console.error('Error loading lists:', err);
    }
  };

  const handleOpenBookModal = () => {
    setForm({
      customerId: customers.length > 0 ? customers[0].id : '',
      meetingDate: selectedDate,
      meetingTime: '10:00 AM',
      agenda: '',
      leadName: leads.length > 0 ? leads[0].lead_name : 'Kundavai AC Tec'
    });
    setFormError('');
    setShowBookModal(true);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm(f => ({ ...f, [id]: value }));
  };

  const handleCheckIn = (meet) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB');

    const rawPhone = meet.mobile_number || '';
    const phone = rawPhone.replace(/\D/g, '');
    const formattedPhone = phone.length === 10 ? '91' + phone : phone;

    const message = `*From Madhusphonics*\n\nHello ${meet.customer_name}, you have successfully checked in at ${timeStr} on ${dateStr}  Madhu's Phonics & Handwriting....Thank you for more info www.madhusphonics.in`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCheckOut = (meet) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-GB');

    const rawPhone = meet.mobile_number || '';
    const phone = rawPhone.replace(/\D/g, '');
    const formattedPhone = phone.length === 10 ? '91' + phone : phone;

    const message = `*From Madhusphonics*\n\nHello ${meet.customer_name}, you have successfully checked out at ${timeStr} on ${dateStr}  Madhu's Phonics & Handwriting....Thank you for more info www.madhusphonics.in`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    if (!form.customerId || !form.meetingDate || !form.meetingTime || !form.agenda) {
      setFormError('All fields are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const res = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to book meeting.');
      }

      setShowBookModal(false);
      fetchMeetings();
      if (showToast) {
        showToast('Meeting scheduled successfully!', 'success');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Appointments</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review and schedule doctor appointments.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenBookModal}>
          <Plus size={18} /> Schedule Appointment
        </button>
      </div>

      <div className="meetings-grid">
        {/* Left Side: Date */}
        <div className="card" style={{ gap: '16px' }}>
          <h3 className="card-title">Select Date</h3>
          <div className="form-group">
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Calendar Summary:</p>
            <p style={{ marginTop: '8px' }}>Total Appointments: <strong>{meetings.length}</strong></p>
          </div>
        </div>

        {/* Right Side: Meeting List */}
        <div className="card" style={{ padding: '24px', gap: '16px' }}>
          <h3 className="card-title">Appointments Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
          
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule...</p>
          ) : meetings.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Clock size={40} style={{ opacity: .3 }} />
              <p>No appointments scheduled for this date.</p>
              <button className="btn btn-secondary" onClick={handleOpenBookModal} style={{ marginTop: '8px' }}>Schedule One Now</button>
            </div>
          ) : (() => {
            const totalItems = meetings.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedMeetings = meetings.slice(startIndex, endIndex);

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
              <>
                <div className="table-responsive-container" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Patient ID</th>
                        <th>Patient Name</th>
                        <th>Mobile</th>
                        <th>Assigned Doctor</th>
                        <th>Symptoms / Diagnosis</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMeetings.map((meet) => (
                        <tr key={meet.id}>
                          <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={14} />
                              {meet.meeting_time}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{meet.customer_id_seq}</td>
                          <td style={{ fontWeight: 600 }}>{meet.customer_name}</td>
                          <td>{meet.mobile_number}</td>
                          <td>{meet.lead_name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{meet.agenda}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                className="btn btn-whatsapp btn-icon-only" 
                                onClick={() => handleCheckIn(meet)} 
                                title="Check In via WhatsApp"
                              >
                                <LogIn size={14} />
                              </button>
                              <button 
                                className="btn btn-secondary btn-icon-only" 
                                onClick={() => handleCheckOut(meet)} 
                                title="Check Out via WhatsApp"
                              >
                                <LogOut size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {meetings.length > 0 && (
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
              </>
            );
          })()}
        </div>
      </div>

      {/* Book Modal */}
      {showBookModal && (
        <div className="modal-backdrop" onClick={() => setShowBookModal(false)}>
          <div className="invoice-modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={20} style={{ color: 'var(--primary)' }} />
                Schedule Appointment
              </h3>
              <button onClick={() => setShowBookModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting}>
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
                  <label className="form-label" htmlFor="customerId">Select Patient *</label>
                  <select
                    id="customerId"
                    className="form-select"
                    value={form.customerId}
                    onChange={handleInputChange}
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.customer_name} ({c.customer_id_seq})</option>
                    ))}
                  </select>
                  {customers.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' }}>
                      No patients registered. Please add a patient first.
                    </span>
                  )}
                </div>

                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="meetingDate">Appointment Date *</label>
                    <input
                      id="meetingDate"
                      type="date"
                      className="form-input"
                      value={form.meetingDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="meetingTime">Time Slot *</label>
                    <select
                      id="meetingTime"
                      className="form-select"
                      value={form.meetingTime}
                      onChange={handleInputChange}
                      required
                    >
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="leadName">Assign Doctor *</label>
                  <select
                    id="leadName"
                    className="form-select"
                    value={form.leadName}
                    onChange={handleInputChange}
                    required
                  >
                    {leads.map(l => (
                      <option key={l.id} value={l.lead_name}>{l.lead_name} ({l.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="agenda">Symptoms / Reason *</label>
                  <input
                    id="agenda"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Toothache, routine checkup, consultation"
                    value={form.agenda}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || customers.length === 0}>
                  {saving ? 'Scheduling...' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
