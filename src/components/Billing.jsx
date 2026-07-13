import React, { useState, useEffect } from 'react';
import { Plus, Search, Printer, Pencil, Trash2, Sparkles, AlertCircle, ShieldAlert, X, FileSpreadsheet } from 'lucide-react';
import { API_URL } from '../config';
import InvoicePrint from './InvoicePrint';

const formatDateSafe = (dateStr) => {
  if (!dateStr) return '—';
  const cleanStr = dateStr.slice(0, 10);
  const parts = cleanStr.slice(0, 10).split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[monthIndex] || ''} ${year}`;
};

const getStateFromCity = (city) => {
  if (!city) return 'Tamil Nadu';
  const cleanCity = city.trim().toLowerCase();
  
  const cityToStateMap = {
    chennai: 'Tamil Nadu',
    coimbatore: 'Tamil Nadu',
    madurai: 'Tamil Nadu',
    trichy: 'Tamil Nadu',
    salem: 'Tamil Nadu',
    tirunelveli: 'Tamil Nadu',
    vellore: 'Tamil Nadu',
    erode: 'Tamil Nadu',
    thanjavur: 'Tamil Nadu',
    vengambakkam: 'Tamil Nadu',
    kilkattalai: 'Tamil Nadu',
    
    mumbai: 'Maharashtra',
    pune: 'Maharashtra',
    nagpur: 'Maharashtra',
    thane: 'Maharashtra',
    nashik: 'Maharashtra',
    
    bangalore: 'Karnataka',
    bengaluru: 'Karnataka',
    mysore: 'Karnataka',
    hubli: 'Karnataka',
    mangalore: 'Karnataka',
    
    delhi: 'Delhi',
    'new delhi': 'Delhi',
    noida: 'Uttar Pradesh',
    gurugram: 'Haryana',
    gurgaon: 'Haryana',
    
    hyderabad: 'Telangana',
    secunderabad: 'Telangana',
    visakhapatnam: 'Andhra Pradesh',
    
    kolkata: 'West Bengal',
    
    ahmedabad: 'Gujarat',
    surat: 'Gujarat',
    vadodara: 'Gujarat',
    
    jaipur: 'Rajasthan',
    lucknow: 'Uttar Pradesh',
    patna: 'Bihar',
    bhopal: 'Madhya Pradesh',
    indore: 'Madhya Pradesh',
    kochi: 'Kerala',
    trivandrum: 'Kerala'
  };

  return cityToStateMap[cleanCity] || 'Tamil Nadu';
};

const WhatsAppIcon = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    width={size}
    height={size}
    fill="currentColor"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3.2 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

export default function Billing({ onNavigate, onPrintInvoice, showToast }) {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Paid', 'Unpaid', 'Pending'
  const [filterDate, setFilterDate] = useState('All'); // 'All', 'This Month', 'Last Month', 'This Year'
  const [paymentsHistory, setPaymentsHistory] = useState([]);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  
  // Invoice Create/Edit State
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [nextInvoiceNo, setNextInvoiceNo] = useState('');
  const [autoShareInvoice, setAutoShareInvoice] = useState(null);
  
  // Form State
  const [form, setForm] = useState({
    invoiceNo: '',
    patientId: '', // Maps to customer ID
    treatmentName: '', // Maps to service name (summary)
    amount: '0',
    advancePaid: '0', // Advance paid field
    advancePaymentDate: '', // Date advance was paid
    finalPaymentDate: '', // Date final payment was received
    status: 'Paid',
    invoiceDate: new Date().toLocaleDateString('sv'),
    gstRate: '18'
  });

  const [items, setItems] = useState([
    { title: '', description: '', rate: '', qty: 1, amount: 0 }
  ]);
  
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingInvoice, setDeletingInvoice] = useState(null);

  const handleExportToExcel = () => {
    const headers = ['Invoice No', 'Date', 'Customer Name', 'Service / Item', 'Amount', 'Advance Paid', 'Pending Amount', 'Status'];
    
    const rows = filteredInvoices.map(inv => {
      const amt = parseFloat(inv.amount) || 0;
      const adv = parseFloat(inv.advance_paid) || 0;
      const pending = inv.status === 'Paid' ? 0 : (amt - adv);
      return [
        inv.invoice_no || '',
        inv.invoice_date ? inv.invoice_date.slice(0, 10) : '',
        inv.customer_name || '',
        inv.service_name || '',
        amt,
        adv,
        pending,
        inv.status || ''
      ];
    });

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
    link.setAttribute('download', `invoice_list_${new Date().toLocaleDateString('sv')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchInvoices();
    fetchCustomersAndServices();
  }, []);

  // Update total invoice amount when items change
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    setForm(f => ({ ...f, amount: total.toString() }));
  }, [items]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/invoices`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersAndServices = async () => {
    try {
      const custRes = await fetch(`${API_URL}/api/customers`);
      const custData = await custRes.json();
      if (custRes.ok && Array.isArray(custData)) {
        setCustomers(custData);
      }

      const servRes = await fetch(`${API_URL}/api/services`);
      const servData = await servRes.json();
      if (servRes.ok && Array.isArray(servData)) {
        setServices(servData);
      }
      
      if (custRes.ok && Array.isArray(custData) && custData.length > 0) {
        setForm(f => ({ ...f, patientId: custData[0].id }));
      }
      
      if (servRes.ok && Array.isArray(servData) && servData.length > 0) {
        setItems([
          { title: servData[0].service_name, description: '', rate: servData[0].cost.toString(), qty: 1, amount: servData[0].cost }
        ]);
      }
    } catch (err) {
      console.error('Error fetching lists:', err);
    }
  };

  const handleOpenAddModal = async () => {
    setEditingInvoice(null);
    setPaymentsHistory([]);
    const defaultItem = services.length > 0
      ? { title: services[0].service_name, description: '', rate: services[0].cost.toString(), qty: 1, amount: services[0].cost }
      : { title: '', description: '', rate: '', qty: 1, amount: 0 };

    setForm({
      invoiceNo: '',
      patientId: customers.length > 0 ? customers[0].id : '',
      treatmentName: '',
      amount: defaultItem.amount.toString(),
      advancePaid: '0',
      advancePaymentDate: '',
      finalPaymentDate: '',
      status: 'Paid',
      invoiceDate: new Date().toLocaleDateString('sv'),
      gstRate: '18'
    });
    setItems([defaultItem]);
    setFormError('');
    setShowModal(true);

    try {
      const res = await fetch(`${API_URL}/api/invoices/next-no`);
      const data = await res.json();
      setNextInvoiceNo(data.nextNo);
      setForm(f => ({ ...f, invoiceNo: data.nextNo }));
    } catch (err) {
      console.error('Error getting next invoice no:', err);
      setNextInvoiceNo('INV-1001');
      setForm(f => ({ ...f, invoiceNo: 'INV-1001' }));
    }
  };

  const handleOpenEditModal = (invoice) => {
    setEditingInvoice(invoice);
    const matchCust = customers.find(c => c.customer_id_seq === invoice.customer_id_seq);
    
    let parsedItems = [];
    try {
      parsedItems = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
      if (!Array.isArray(parsedItems)) parsedItems = [];
    } catch (e) {
      parsedItems = [];
    }

    if (parsedItems.length === 0) {
      parsedItems = [
        {
          title: invoice.service_name || '',
          description: '',
          rate: invoice.amount.toString(),
          qty: 1,
          amount: parseFloat(invoice.amount)
        }
      ];
    }

    let parsedHistory = [];
    try {
      parsedHistory = typeof invoice.payments_history === 'string' ? JSON.parse(invoice.payments_history) : invoice.payments_history;
      if (!Array.isArray(parsedHistory)) parsedHistory = [];
    } catch (e) {
      parsedHistory = [];
    }

    if (parsedHistory.length === 0 && parseFloat(invoice.advance_paid || 0) > 0) {
      parsedHistory = [
        {
          amount: invoice.advance_paid.toString(),
          date: invoice.advance_payment_date ? invoice.advance_payment_date.slice(0, 10) : invoice.invoice_date.slice(0, 10)
        }
      ];
    }

    setPaymentsHistory(parsedHistory);

    setForm({
      invoiceNo: invoice.invoice_no,
      patientId: matchCust ? matchCust.id : '',
      treatmentName: invoice.service_name,
      amount: invoice.amount.toString(),
      advancePaid: (invoice.advance_paid || 0).toString(),
      advancePaymentDate: invoice.advance_payment_date ? invoice.advance_payment_date.slice(0, 10) : '',
      finalPaymentDate: invoice.final_payment_date ? invoice.final_payment_date.slice(0, 10) : '',
      status: invoice.status,
      invoiceDate: invoice.invoice_date.slice(0, 10),
      gstRate: (invoice.gst_rate !== undefined ? invoice.gst_rate : 18).toString()
    });
    setItems(parsedItems);
    setFormError('');
    setShowModal(true);
  };

  const handleAddPayment = () => {
    const newPayment = {
      amount: '',
      date: new Date().toISOString().slice(0, 10)
    };
    const updatedHistory = [...paymentsHistory, newPayment];
    setPaymentsHistory(updatedHistory);
    syncPayments(updatedHistory);
  };

  const handlePaymentChange = (index, field, value) => {
    const updatedHistory = paymentsHistory.map((p, idx) => {
      if (idx === index) {
        return { ...p, [field]: value };
      }
      return p;
    });
    setPaymentsHistory(updatedHistory);
    syncPayments(updatedHistory);
  };

  const handleRemovePayment = (index) => {
    const updatedHistory = paymentsHistory.filter((_, idx) => idx !== index);
    setPaymentsHistory(updatedHistory);
    syncPayments(updatedHistory);
  };

  const syncPayments = (history) => {
    const totalAdv = history.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const firstDate = history.length > 0 && history[0].date ? history[0].date : '';
    setForm(f => ({
      ...f,
      advancePaid: totalAdv.toString(),
      advancePaymentDate: firstDate
    }));
  };

  const addRow = () => {
    setItems([...items, { title: '', description: '', rate: '', qty: 1, amount: 0 }]);
  };

  const removeRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    } else {
      setItems([{ title: '', description: '', rate: '', qty: 1, amount: 0 }]);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === 'title') {
      const match = services.find(s => s.service_name === value);
      if (match) {
        updated[index].rate = match.cost.toString();
        updated[index].amount = match.cost * (parseInt(updated[index].qty, 10) || 1);
      }
    } else if (field === 'rate' || field === 'qty') {
      const rate = parseFloat(updated[index].rate) || 0;
      const qty = parseInt(updated[index].qty, 10) || 0;
      updated[index].amount = rate * qty;
    }
    setItems(updated);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setForm(f => {
      const updated = { ...f, [id]: value };
      if (id === 'advancePaid' && parseFloat(value) > 0 && !f.advancePaymentDate) {
        updated.advancePaymentDate = new Date().toLocaleDateString('sv');
      }
      if (id === 'status' && value === 'Paid' && !f.finalPaymentDate) {
        updated.finalPaymentDate = new Date().toLocaleDateString('sv');
      }
      return updated;
    });
  };

  const handleSendWhatsApp = (inv) => {
    setAutoShareInvoice(inv);
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (!form.patientId || items.some(item => !item.title || !item.rate) || !form.invoiceDate) {
      setFormError('Customer, Date, and all Product Titles/Rates are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = {
        ...form,
        items,
        paymentsHistory
      };

      let res;
      if (editingInvoice) {
        res = await fetch(`${API_URL}/api/invoices/${editingInvoice.id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/api/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save invoice.');
      }

      setShowModal(false);
      fetchInvoices();
      if (showToast) {
        showToast(
          editingInvoice ? 'Invoice updated successfully!' : 'Invoice generated successfully!',
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
    if (!deletingInvoice) return;

    try {
      const res = await fetch(`${API_URL}/api/invoices/${deletingInvoice.id}/delete`, {
        method: 'POST'
      });

      if (!res.ok) {
        throw new Error('Failed to delete invoice.');
      }

      setDeletingInvoice(null);
      fetchInvoices();
      if (showToast) {
        showToast('Invoice deleted successfully.', 'success');
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast('Could not delete invoice record.', 'error');
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Paid') return 'badge badge-success';
    if (status === 'Pending') return 'badge badge-warning';
    return 'badge badge-danger';
  };

  const filteredInvoices = invoices.filter(inv => {
    const query = search.toLowerCase();
    const invNo = inv.invoice_no || '';
    const name = inv.customer_name || '';
    const service = inv.service_name || '';
    const status = inv.status || '';
    
    const matchesSearch = (
      invNo.toLowerCase().includes(query) ||
      name.toLowerCase().includes(query) ||
      service.toLowerCase().includes(query) ||
      status.toLowerCase().includes(query)
    );

    // Status filter
    let matchesStatus = true;
    if (filterStatus !== 'All') {
      matchesStatus = status.toLowerCase() === filterStatus.toLowerCase();
    }

    // Date filter
    let matchesDate = true;
    if (filterDate !== 'All' && inv.invoice_date) {
      const invDate = new Date(inv.invoice_date);
      const today = new Date();
      if (filterDate === 'This Month') {
        matchesDate = (
          invDate.getMonth() === today.getMonth() &&
          invDate.getFullYear() === today.getFullYear()
        );
      } else if (filterDate === 'Last Month') {
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        matchesDate = (
          invDate.getMonth() === lastMonth.getMonth() &&
          invDate.getFullYear() === lastMonth.getFullYear()
        );
      } else if (filterDate === 'This Year') {
        matchesDate = invDate.getFullYear() === today.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

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

  const sumAmount = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const sumPaid = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.advance_paid) || 0), 0);
  const sumPending = filteredInvoices.reduce((sum, inv) => {
    const amt = parseFloat(inv.amount) || 0;
    const adv = parseFloat(inv.advance_paid) || 0;
    const pending = inv.status === 'Paid' ? 0 : Math.max(0, amt - adv);
    return sum + pending;
  }, 0);

  return (
    <div>
      <div className="card-header-flex" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Billing & Invoices</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track accounts receivables, client invoices, and billing history.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportToExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Create Invoice
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0 0 24px 0', gap: '16px' }}>
        {/* Search & Filters */}
        <div style={{ padding: '24px 24px 0 24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
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
              placeholder="Search invoices by invoice number, company name, service description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          {/* Status Filter */}
          <div style={{ flex: '0 1 180px', minWidth: '140px' }}>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              style={{ cursor: 'pointer' }}
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          {/* Date Filter */}
          <div style={{ flex: '0 1 180px', minWidth: '140px' }}>
            <select
              className="form-select"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              style={{ cursor: 'pointer' }}
            >
              <option value="All">All Dates</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>
        </div>

        {/* Invoice list */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading billing records...</p>
        ) : filteredInvoices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>No billing records found.</p>
        ) : (
          <div className="table-responsive-container" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>ID</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Advance</th>
                  <th>Pending</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv) => {
                  const pendingAmt = inv.status === 'Paid' ? 0 : Math.max(0, parseFloat(inv.amount) - parseFloat(inv.advance_paid || 0));
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{inv.invoice_no}</td>
                      <td style={{ fontWeight: 600 }}>{inv.customer_id_seq}</td>
                      <td style={{ fontWeight: 600, whiteSpace: 'normal', minWidth: '140px' }}>{inv.customer_name}</td>
                      <td style={{ whiteSpace: 'normal', minWidth: '140px' }}>{inv.service_name}</td>
                      <td style={{ fontWeight: 700 }}>₹{parseFloat(inv.amount).toFixed(2)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {inv.payments_history ? (
                          (() => {
                            try {
                              const history = JSON.parse(inv.payments_history);
                              if (Array.isArray(history) && history.length > 0) {
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div style={{ fontWeight: '700' }}>₹{parseFloat(inv.advance_paid).toFixed(2)}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: 'var(--text-muted)', gap: '1px', fontWeight: 500 }}>
                                      {history.map((h, idx) => (
                                        <div key={idx} style={{ whiteSpace: 'nowrap' }}>
                                          • ₹{(parseFloat(h.amount) || 0).toFixed(0)} on {formatDateSafe(h.date)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            } catch (e) {}
                            return (
                              parseFloat(inv.advance_paid || 0) > 0 ? (
                                <div>
                                  <div>₹{parseFloat(inv.advance_paid).toFixed(2)}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                                    Paid: {formatDateSafe(inv.advance_payment_date)}
                                  </div>
                                </div>
                              ) : '—'
                            );
                          })()
                        ) : (
                          parseFloat(inv.advance_paid || 0) > 0 ? (
                            <div>
                              <div>₹{parseFloat(inv.advance_paid).toFixed(2)}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                                Paid: {formatDateSafe(inv.advance_payment_date)}
                              </div>
                            </div>
                          ) : '—'
                        )}
                      </td>
                      <td style={{ fontWeight: 600, color: pendingAmt > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        {pendingAmt > 0 ? `₹${pendingAmt.toFixed(2)}` : '—'}
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{formatDateSafe(inv.invoice_date)}</div>
                          {inv.status === 'Paid' && inv.final_payment_date && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600, marginTop: '2px' }}>
                              Paid: {formatDateSafe(inv.final_payment_date)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(inv.status)}>{inv.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-icon-only" onClick={() => onPrintInvoice(inv)} title="Print Invoice Receipt">
                            <Printer size={14} />
                          </button>
                          <button className="btn btn-whatsapp btn-icon-only" onClick={() => handleSendWhatsApp(inv)} title="Send to WhatsApp">
                            <WhatsAppIcon size={14} />
                          </button>
                          <button className="btn btn-outline btn-icon-only" onClick={() => handleOpenEditModal(inv)} title="Edit Details">
                            <Pencil size={14} />
                          </button>
                          <button className="btn btn-danger btn-icon-only" onClick={() => setDeletingInvoice(inv)} title="Delete Record">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.015)', fontWeight: '700', borderTop: '2.5px solid var(--border-color)' }}>
                  <td colSpan="4" style={{ textAlign: 'right', padding: '16px', fontWeight: '800', fontSize: '0.9rem' }}>Totals:</td>
                  <td style={{ padding: '16px', fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>₹{sumAmount.toFixed(2)}</td>
                  <td style={{ padding: '16px', fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>₹{sumPaid.toFixed(2)}</td>
                  <td style={{ padding: '16px', fontWeight: '800', fontSize: '0.9rem', color: sumPending > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {sumPending > 0 ? `₹${sumPending.toFixed(2)}` : '—'}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {filteredInvoices.length > 0 && !loading && (
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

      {/* Invoice Form Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="invoice-modal" style={{ maxWidth: '750px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                {editingInvoice ? 'Modify Invoice Record' : 'Generate Project Invoice'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
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

                <div className="form-grid" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="invoiceNo">Invoice No (Auto)</label>
                    <input
                      id="invoiceNo"
                      type="text"
                      className="form-input"
                      value={form.invoiceNo}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="invoiceDate">Invoice Date *</label>
                    <input
                      id="invoiceDate"
                      type="date"
                      className="form-input"
                      value={form.invoiceDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="patientId">Select Customer / Corporate Client *</label>
                  {editingInvoice ? (
                    <input
                      type="text"
                      className="form-input"
                      value={`${editingInvoice.customer_name} (${editingInvoice.customer_id_seq})`}
                      disabled
                      readOnly
                    />
                  ) : (
                    <select
                      id="patientId"
                      className="form-select"
                      value={form.patientId}
                      onChange={handleInputChange}
                      required
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.customer_name} ({c.customer_id_seq})</option>
                      ))}
                    </select>
                  )}
                  {customers.length === 0 && !editingInvoice && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '4px' }}>
                      No customers registered yet. Add a customer account first.
                    </span>
                  )}
                </div>

                {/* Products Grid */}
                <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>Products / Services</h4>
                  
                  <div className="table-responsive-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflowX: 'auto', marginBottom: '12px' }}>
                    <table style={{ width: '100%', minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '25%', padding: '10px' }}>Title</th>
                          <th style={{ width: '35%', padding: '10px' }}>Description</th>
                          <th style={{ width: '15%', padding: '10px', textAlign: 'right' }}>Rate</th>
                          <th style={{ width: '10%', padding: '10px', textAlign: 'center' }}>Qty</th>
                          <th style={{ width: '15%', padding: '10px', textAlign: 'right' }}>Amount</th>
                          <th style={{ width: '5%', padding: '10px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index}>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <input
                                type="text"
                                className="form-input"
                                placeholder="Service Title"
                                value={item.title}
                                onChange={e => handleItemChange(index, 'title', e.target.value)}
                                list="services-list"
                                required
                                style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                              />
                              <datalist id="services-list">
                                {services.map(s => (
                                  <option key={s.id} value={s.service_name} />
                                ))}
                              </datalist>
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <textarea
                                className="form-textarea"
                                placeholder="Description of deliverables..."
                                value={item.description}
                                onChange={e => handleItemChange(index, 'description', e.target.value)}
                                rows={2}
                                style={{ padding: '8px 10px', fontSize: '0.85rem', resize: 'vertical', minHeight: '60px' }}
                              />
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <input
                                type="number"
                                className="form-input"
                                placeholder="0"
                                value={item.rate}
                                onChange={e => handleItemChange(index, 'rate', e.target.value)}
                                required
                                style={{ padding: '8px 10px', fontSize: '0.85rem', textAlign: 'right' }}
                              />
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <input
                                type="number"
                                className="form-input"
                                placeholder="1"
                                min="1"
                                value={item.qty}
                                onChange={e => handleItemChange(index, 'qty', e.target.value)}
                                required
                                style={{ padding: '8px 10px', fontSize: '0.85rem', textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top', textAlign: 'right', fontWeight: '600', fontSize: '0.88rem', paddingTop: '16px' }}>
                              ₹{(parseFloat(item.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'middle', textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-danger btn-icon-only"
                                onClick={() => removeRow(index)}
                                style={{ width: '32px', height: '32px', padding: 0 }}
                                title="Remove Item"
                              >
                                <X size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addRow}
                    style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Add Product
                  </button>
                </div>

                {/* Payments History Section */}
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.01)',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Payments Received (Installments)
                  </h4>
                  
                  {paymentsHistory.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      No payments received yet. Click "Add Payment" to record a payment installment.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                      {paymentsHistory.map((p, index) => (
                        <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '95px' }}>
                            Installment #{index + 1}
                          </span>
                          
                          <div style={{ flex: '1' }}>
                            <input
                              type="number"
                              className="form-input"
                              placeholder="Amount (INR)"
                              value={p.amount}
                              onChange={e => handlePaymentChange(index, 'amount', e.target.value)}
                              required
                              min="0"
                              style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                            />
                          </div>
                          
                          <div style={{ flex: '1' }}>
                            <input
                              type="date"
                              className="form-input"
                              value={p.date ? p.date.slice(0, 10) : ''}
                              onChange={e => handlePaymentChange(index, 'date', e.target.value)}
                              required
                              style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                            />
                          </div>
                          
                          <button
                            type="button"
                            className="btn btn-danger btn-icon-only"
                            onClick={() => handleRemovePayment(index)}
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            title="Remove Payment"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleAddPayment}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Add Payment
                  </button>
                </div>

                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="amount">Sub Total (INR)</label>
                    <input
                      id="amount"
                      type="number"
                      className="form-input"
                      value={form.amount}
                      disabled
                      readOnly
                      style={{ fontWeight: '700', backgroundColor: 'var(--bg-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="gstRate">GST Rate (%)</label>
                    <input
                      id="gstRate"
                      type="number"
                      className="form-input"
                      value={form.gstRate}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      placeholder="18"
                      style={{ fontWeight: '600' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">GST Amount (INR)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={(parseFloat(form.amount || 0) * (parseFloat(form.gstRate || 0) / 100)).toFixed(2)}
                      disabled
                      readOnly
                      style={{ fontWeight: '600', backgroundColor: 'var(--bg-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Grand Total (INR)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={(parseFloat(form.amount || 0) * (1 + parseFloat(form.gstRate || 0) / 100)).toFixed(2)}
                      disabled
                      readOnly
                      style={{ fontWeight: '700', backgroundColor: 'var(--bg-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="advancePaid">Total Paid (INR)</label>
                    <input
                      id="advancePaid"
                      type="number"
                      className="form-input"
                      value={form.advancePaid}
                      disabled
                      readOnly
                      style={{ fontWeight: '600', backgroundColor: 'var(--bg-primary)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Balance Due (INR)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={(parseFloat(form.amount || 0) * (1 + parseFloat(form.gstRate || 0) / 100) - parseFloat(form.advancePaid || 0)).toFixed(2)}
                      disabled
                      readOnly
                      style={{ 
                        fontWeight: '700', 
                        backgroundColor: 'var(--bg-primary)', 
                        color: (parseFloat(form.amount || 0) * (1 + parseFloat(form.gstRate || 0) / 100) - parseFloat(form.advancePaid || 0)) > 0 ? 'var(--warning)' : 'var(--success)'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="status">Payment Status *</label>
                    <select
                      id="status"
                      className="form-select"
                      value={form.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  {form.status === 'Paid' && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="finalPaymentDate">Final Payment Date *</label>
                      <input
                        id="finalPaymentDate"
                        type="date"
                        className="form-input"
                        value={form.finalPaymentDate}
                        onChange={handleInputChange}
                        required={form.status === 'Paid'}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="invoice-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || (customers.length === 0 && !editingInvoice)}>
                  {saving ? 'Processing...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingInvoice && (
        <div className="modal-backdrop centered" onClick={() => setDeletingInvoice(null)}>
          <div className="invoice-modal centered" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="invoice-modal-header" style={{ borderBottom: 'none' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                <ShieldAlert size={22} />
                Delete Invoice Record?
              </h3>
            </div>
            <div className="invoice-modal-body" style={{ padding: '0 24px 20px 24px', minHeight: 'auto' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete invoice record <strong>{deletingInvoice.invoice_no}</strong> for {deletingInvoice.customer_name}? This action cannot be undone.
              </p>
            </div>
            <div className="invoice-modal-footer" style={{ borderTop: 'none' }}>
              <button type="button" className="btn btn-outline" onClick={() => setDeletingInvoice(null)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Offscreen Auto-Sharing Modal */}
      {autoShareInvoice && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px', zIndex: -1000, pointerEvents: 'none' }}>
          <InvoicePrint 
            invoice={autoShareInvoice} 
            onClose={() => setAutoShareInvoice(null)} 
            autoShare={true} 
          />
        </div>
      )}
    </div>
  );
}
