import React, { useState, useEffect } from 'react';
import { Users, IndianRupee, Briefcase, AlertCircle, Plus, Calendar, Video, TrendingUp, TrendingDown } from 'lucide-react';
import { API_URL } from '../config';

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

export default function Dashboard({ onNavigate, onPrintInvoice, showToast }) {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndexBar, setHoveredIndexBar] = useState(null);
  const [hoveredIndexLine, setHoveredIndexLine] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Customers
        const custRes = await fetch(`${API_URL}/api/customers`);
        const custData = await custRes.json();
        if (custRes.ok && Array.isArray(custData)) {
          setCustomers(custData);
        }

        // 2. Fetch Invoices
        const invoicesRes = await fetch(`${API_URL}/api/invoices`);
        const invoicesData = await invoicesRes.json();
        if (invoicesRes.ok && Array.isArray(invoicesData)) {
          setInvoices(invoicesData);
        }

        // 3. Fetch Services
        const servicesRes = await fetch(`${API_URL}/api/services`);
        const servicesData = await servicesRes.json();
        if (servicesRes.ok && Array.isArray(servicesData)) {
          setServices(servicesData);
        }

        // 4. Fetch Today's Meetings
        const todayStr = new Date().toLocaleDateString('sv');
        const meetRes = await fetch(`${API_URL}/api/meetings?date=${todayStr}`);
        const meetData = await meetRes.json();
        if (meetRes.ok && Array.isArray(meetData)) {
          setMeetings(meetData);
        }

        // 5. Fetch Expenses
        const expRes = await fetch(`${API_URL}/api/expenses`);
        const expData = await expRes.json();
        if (expRes.ok && Array.isArray(expData)) {
          setExpenses(expData);
        }

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Summary Metrics
  const totalCustomers = customers.length;
  
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return { year: 0, month: 0, day: 0 };
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate()
      };
    } else {
      const cleanStr = dateStr.slice(0, 10);
      const parts = cleanStr.split('-');
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1, // 0-indexed
        day: parseInt(parts[2], 10)
      };
    }
  };

  const today = new Date().toLocaleDateString('sv');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Helper to extract all payment events dynamically:
  // - If payments_history is present, extract each logged payment date and amount
  // - Fallback: Advance payment and final payment dates
  const paymentEvents = [];
  invoices.forEach(inv => {
    let hasHistory = false;
    if (inv.payments_history) {
      try {
        const history = JSON.parse(inv.payments_history);
        if (Array.isArray(history) && history.length > 0) {
          hasHistory = true;
          history.forEach(p => {
            const pAmt = parseFloat(p.amount) || 0;
            if (pAmt > 0) {
              paymentEvents.push({
                amount: pAmt,
                date: p.date ? p.date.slice(0, 10) : inv.invoice_date.slice(0, 10)
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing payments_history:", e);
      }
    }

    if (!hasHistory) {
      const amt = parseFloat(inv.amount) || 0;
      const adv = parseFloat(inv.advance_paid) || 0;
      
      // 1. Advance Payment
      if (adv > 0) {
        const advDate = inv.advance_payment_date 
          ? inv.advance_payment_date.slice(0, 10) 
          : inv.invoice_date.slice(0, 10);
        paymentEvents.push({
          amount: adv,
          date: advDate
        });
      }
      
      // 2. Final Payment (only if marked Paid)
      if (inv.status === 'Paid') {
        const finalAmt = amt - adv;
        if (finalAmt > 0) {
          const finalDate = inv.final_payment_date 
            ? inv.final_payment_date.slice(0, 10) 
            : inv.invoice_date.slice(0, 10);
          paymentEvents.push({
            amount: finalAmt,
            date: finalDate
          });
        }
      }
    }
  });

  // Calculate revenue from payment events
  const todayRevenue = paymentEvents
    .filter(evt => evt.date === today)
    .reduce((sum, evt) => sum + evt.amount, 0);

  const monthRevenue = paymentEvents
    .filter(evt => {
      const { year, month } = parseLocalDate(evt.date);
      return year === currentYear && month === currentMonth;
    })
    .reduce((sum, evt) => sum + evt.amount, 0);

  const yearRevenue = paymentEvents
    .filter(evt => parseLocalDate(evt.date).year === currentYear)
    .reduce((sum, evt) => sum + evt.amount, 0);

  const yearExpenses = expenses
    .filter(exp => parseLocalDate(exp.expense_date).year === currentYear)
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const yearProfit = yearRevenue - yearExpenses;
  const yearProfitPercent = yearRevenue > 0 ? (yearProfit / yearRevenue) * 100 : 0;

  const monthExpenses = expenses
    .filter(exp => {
      const { year, month } = parseLocalDate(exp.expense_date);
      return year === currentYear && month === currentMonth;
    })
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const monthProfit = monthRevenue - monthExpenses;
  const monthProfitPercent = monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0;

  const servicesOfferedCount = services.length;

  const pendingPayments = invoices
    .filter(inv => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) - (parseFloat(inv.advance_paid) || 0)), 0);

  // --- CHART CALCULATIONS ---
  const monthsData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return {
      month: i,
      label: d.toLocaleString('en-US', { month: 'short' }),
      revenue: 0,
      expenses: 0,
      profit: 0
    };
  });

  paymentEvents.forEach(evt => {
    const { year, month } = parseLocalDate(evt.date);
    if (year === currentYear) {
      monthsData[month].revenue += evt.amount;
    }
  });

  expenses.forEach(exp => {
    const { year, month } = parseLocalDate(exp.expense_date);
    if (year === currentYear) {
      monthsData[month].expenses += parseFloat(exp.amount);
    }
  });

  monthsData.forEach(m => {
    m.profit = m.revenue - m.expenses;
  });

  const maxVal = Math.max(
    ...monthsData.map(m => Math.max(m.revenue, m.expenses, m.profit, 0))
  );
  const minVal = Math.min(
    ...monthsData.map(m => Math.min(m.revenue, m.expenses, m.profit, 0))
  );
  const scaleMax = maxVal > 0 ? maxVal * 1.15 : 10000;
  const scaleMin = minVal < 0 ? minVal * 1.15 : 0;
  const scaleRange = scaleMax - scaleMin;

  // Chart layout dimensions
  const width = 800;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = monthsData.map((d, i) => {
    const x = paddingLeft + (i / 11) * chartWidth;
    const yRev = paddingTop + chartHeight - ((d.revenue - scaleMin) / scaleRange) * chartHeight;
    const yExp = paddingTop + chartHeight - ((d.expenses - scaleMin) / scaleRange) * chartHeight;
    const yProf = paddingTop + chartHeight - ((d.profit - scaleMin) / scaleRange) * chartHeight;
    return { x, yRev, yExp, yProf, label: d.label, revenue: d.revenue, expenses: d.expenses, profit: d.profit };
  });

  const getBezierPath = (pts, key) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0][key]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr[key];
      const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
      const cp2y = next[key];
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next[key]}`;
    }
    return path;
  };

  const linePathRev = getBezierPath(points, 'yRev');
  const linePathExp = getBezierPath(points, 'yExp');
  const linePathProf = getBezierPath(points, 'yProf');

  const yZero = paddingTop + chartHeight - ((0 - scaleMin) / scaleRange) * chartHeight;

  const areaPathProf = points.length > 0
    ? `${linePathProf} L ${points[points.length - 1].x} ${yZero} L ${points[0].x} ${yZero} Z`
    : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const formatYLabel = (val) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    let label = '';
    if (absVal === 0) return '₹0';
    if (absVal >= 100000) label = `₹${(absVal / 100000).toFixed(1)}L`;
    else if (absVal >= 1000) label = `₹${(absVal / 1000).toFixed(0)}K`;
    else label = `₹${absVal.toFixed(0)}`;
    return isNegative ? `-${label}` : label;
  };

  const animationStyle = `
    @keyframes drawPath {
      from {
        stroke-dashoffset: 1200;
      }
      to {
        stroke-dashoffset: 0;
      }
    }
    @keyframes fadeInArea {
      from {
        opacity: 0;
      }
      to {
        opacity: 0.15;
      }
    }
    @keyframes growBar {
      from {
        transform: scaleY(0);
      }
      to {
        transform: scaleY(1);
      }
    }
    .chart-line {
      stroke-dasharray: 1200;
      stroke-dashoffset: 1200;
      animation: drawPath 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    .chart-area {
      opacity: 0;
      animation: fadeInArea 1s ease-out 1.2s forwards;
    }
    .bar-rect {
      transform: scaleY(0);
      animation: growBar 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  `;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Loading Dashboard metrics...</p>
      </div>
    );
  }

  // Collect payment transactions (including advance payments and final payments)
  const payments = [];
  invoices.forEach(inv => {
    let hasHistory = false;
    if (inv.payments_history) {
      try {
        const history = JSON.parse(inv.payments_history);
        if (Array.isArray(history) && history.length > 0) {
          hasHistory = true;
          history.forEach((p, idx) => {
            const pAmt = parseFloat(p.amount) || 0;
            if (pAmt > 0) {
              payments.push({
                id: `hist-${inv.id}-${idx}`,
                invoiceNo: inv.invoice_no,
                customerName: inv.customer_name,
                serviceName: inv.service_name,
                type: idx === 0 ? 'Advance Payment' : `Installment #${idx + 1}`,
                amount: pAmt,
                date: p.date ? p.date.slice(0, 10) : inv.invoice_date.slice(0, 10),
                status: 'Received'
              });
            }
          });
        }
      } catch (e) {
        console.error("Error parsing payments_history for log:", e);
      }
    }

    if (!hasHistory) {
      // If there is an advance payment, record it
      if (parseFloat(inv.advance_paid) > 0) {
        payments.push({
          id: `adv-${inv.id}`,
          invoiceNo: inv.invoice_no,
          customerName: inv.customer_name,
          serviceName: inv.service_name,
          type: 'Advance Payment',
          amount: parseFloat(inv.advance_paid),
          date: inv.advance_payment_date ? inv.advance_payment_date.slice(0, 10) : inv.invoice_date.slice(0, 10),
          status: 'Received'
        });
      }
      // If the invoice is fully paid, record the main payment
      if (inv.status === 'Paid') {
        const mainAmount = parseFloat(inv.amount) - (parseFloat(inv.advance_paid) || 0);
        if (mainAmount > 0) {
          payments.push({
            id: `full-${inv.id}`,
            invoiceNo: inv.invoice_no,
            customerName: inv.customer_name,
            serviceName: inv.service_name,
            type: 'Final Payment',
            amount: mainAmount,
            date: inv.final_payment_date ? inv.final_payment_date.slice(0, 10) : inv.invoice_date.slice(0, 10),
            status: 'Received'
          });
        }
      }
    }
  });

  // Sort payments by date descending
  payments.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome Back, Kundavai AC Tec</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Here is the summary of your digital agency operations today.</p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        {/* Today's Revenue */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Today's Revenue</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>₹{todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Month's Revenue */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'hsl(215, 80%, 95%)',
            color: 'hsl(215, 80%, 45%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Month's Revenue</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>₹{monthRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Month's Expenses */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Month's Expenses</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>₹{monthExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Month's Profit */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Month's Profit</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>
              ₹{monthProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '0.85rem', color: monthProfit >= 0 ? 'var(--success)' : 'var(--danger)', marginLeft: '6px', fontWeight: 600 }}>
                ({monthProfitPercent.toFixed(1)}%)
              </span>
            </h3>
          </div>
        </div>

        {/* Year's Revenue */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'hsl(325, 80%, 95%)',
            color: 'hsl(325, 80%, 45%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Year's Revenue</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>₹{yearRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Year's Expenses */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Year's Expenses</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>₹{yearExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Year's Profit */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--success-light)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Year's Profit</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>
              ₹{yearProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '0.85rem', color: yearProfit >= 0 ? 'var(--success)' : 'var(--danger)', marginLeft: '6px', fontWeight: 600 }}>
                ({yearProfitPercent.toFixed(1)}%)
              </span>
            </h3>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--warning-light)',
            color: 'var(--warning)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Payments</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>₹{pendingPayments.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Active Clients */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Clients</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>{totalCustomers}</h3>
          </div>
        </div>

        {/* Services Catalog */}
        <div className="card" style={{ flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'hsl(190, 80%, 94%)',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Briefcase size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Services Catalog</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '2px' }}>{servicesOfferedCount}</h3>
          </div>
        </div>
      </div>

      {/* Monthly Income & Expenses Breakdown Bar Chart */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
        <style dangerouslySetInnerHTML={{ __html: animationStyle }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Monthly Income & Expenses Breakdown ({currentYear})</h3>
            <p className="card-subtitle">Month-wise comparison of monthly revenue (income) vs expenses.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'var(--primary)' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Income</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'var(--danger)' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Expenses</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <svg viewBox="0 0 800 220" width="100%" height="auto" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="barGradientRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="hsl(260, 85%, 65%)" stopOpacity="0.85" />
              </linearGradient>
              <linearGradient id="barGradientExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--danger)" />
                <stop offset="100%" stopColor="hsl(0, 85%, 65%)" stopOpacity="0.85" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {yTicks.map((tick, idx) => {
              const y = paddingTop + chartHeight - tick * chartHeight;
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="hsl(220, 15%, 93%)"
                    strokeWidth={1}
                  />
                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    style={{ fontSize: '0.72rem', fill: 'var(--text-muted)', fontWeight: 600 }}
                  >
                    {formatYLabel(scaleMin + tick * scaleRange)}
                  </text>
                </g>
              );
            })}

            {/* 0 Baseline Line */}
            {scaleMin < 0 && (
              <line
                x1={paddingLeft}
                y1={yZero}
                x2={width - paddingRight}
                y2={yZero}
                stroke="hsl(220, 15%, 70%)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}

            {/* Grouped Bar Chart Mode */}
            <g>
              {points.map((pt, i) => {
                const d = monthsData[i];
                const monthWidth = chartWidth / 12;
                const xCenter = paddingLeft + i * monthWidth + monthWidth / 2;
                
                const barWidth = 14;
                const gap = 2;
                
                const revHeight = d.revenue > 0 ? (d.revenue / scaleMax) * chartHeight : 0;
                const expHeight = d.expenses > 0 ? (d.expenses / scaleMax) * chartHeight : 0;
                
                const revY = paddingTop + chartHeight - revHeight;
                const expY = paddingTop + chartHeight - expHeight;
                
                return (
                  <g key={i}>
                    {/* Income/Revenue Bar */}
                    {d.revenue > 0 && (
                      <rect
                        x={xCenter - barWidth - gap}
                        y={revY}
                        width={barWidth}
                        height={revHeight}
                        fill="url(#barGradientRev)"
                        rx={3}
                        className="bar-rect"
                        style={{
                          transformOrigin: `${xCenter - barWidth/2 - gap}px ${paddingTop + chartHeight}px`
                        }}
                      />
                    )}
                    
                    {/* Expenses Bar */}
                    {d.expenses > 0 && (
                      <rect
                        x={xCenter + gap}
                        y={expY}
                        width={barWidth}
                        height={expHeight}
                        fill="url(#barGradientExp)"
                        rx={3}
                        className="bar-rect"
                        style={{
                          transformOrigin: `${xCenter + barWidth/2 + gap}px ${paddingTop + chartHeight}px`
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* X-Axis Labels */}
            {points.map((pt, idx) => (
              <text
                key={idx}
                x={pt.x}
                y={height - 5}
                textAnchor="middle"
                style={{ fontSize: '0.75rem', fill: 'var(--text-secondary)', fontWeight: 600 }}
              >
                {pt.label}
              </text>
            ))}

            {/* Vertical guidelines on hover */}
            {hoveredIndexBar !== null && (
              <line
                x1={points[hoveredIndexBar].x}
                y1={paddingTop}
                x2={points[hoveredIndexBar].x}
                y2={paddingTop + chartHeight}
                stroke="var(--primary)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                opacity={0.4}
              />
            )}

            {/* Hover overlay hitboxes */}
            {points.map((pt, i) => (
              <rect
                key={i}
                x={pt.x - chartWidth / 22}
                y={paddingTop}
                width={chartWidth / 11}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndexBar(i)}
                onMouseLeave={() => setHoveredIndexBar(null)}
              />
            ))}
          </svg>

          {/* Interactive Tooltip */}
          {hoveredIndexBar !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${(points[hoveredIndexBar].x / width) * 100}%`,
                top: `${Math.min(points[hoveredIndexBar].yRev, points[hoveredIndexBar].yExp) - 95}px`,
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(30, 41, 59, 0.96)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)',
                pointerEvents: 'none',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '180px',
                transition: 'left 0.1s ease, top 0.1s ease',
                fontSize: '0.78rem'
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'hsl(215, 20%, 80%)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px', textAlign: 'center' }}>
                {points[hoveredIndexBar].label} {currentYear}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span style={{ color: 'hsl(215, 20%, 80%)' }}>Income:</span>
                <span style={{ fontWeight: 600 }}>₹{points[hoveredIndexBar].revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span style={{ color: 'hsl(215, 20%, 80%)' }}>Expenses:</span>
                <span style={{ fontWeight: 600, color: 'hsl(10, 95%, 75%)' }}>₹{points[hoveredIndexBar].expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                <span style={{ color: 'hsl(215, 20%, 80%)', fontWeight: 600 }}>Net Gain:</span>
                <span style={{ fontWeight: 700, color: points[hoveredIndexBar].profit >= 0 ? 'hsl(145, 80%, 75%)' : 'hsl(355, 85%, 75%)' }}>
                  ₹{points[hoveredIndexBar].profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yearly Profit & Revenue Trend Line Chart */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Yearly Profit & Revenue Trend ({currentYear})</h3>
            <p className="card-subtitle">Monthly trend lines showing revenue (income), expenses, and net profit.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'var(--primary)' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Revenue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'var(--danger)' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Expenses</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: 'var(--success)' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>Profit</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <svg viewBox="0 0 800 220" width="100%" height="auto" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="chartGradientProf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--success)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--success)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {yTicks.map((tick, idx) => {
              const y = paddingTop + chartHeight - tick * chartHeight;
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="hsl(220, 15%, 93%)"
                    strokeWidth={1}
                  />
                  <text
                    x={paddingLeft - 12}
                    y={y + 4}
                    textAnchor="end"
                    style={{ fontSize: '0.72rem', fill: 'var(--text-muted)', fontWeight: 600 }}
                  >
                    {formatYLabel(scaleMin + tick * scaleRange)}
                  </text>
                </g>
              );
            })}

            {/* 0 Baseline Line */}
            {scaleMin < 0 && (
              <line
                x1={paddingLeft}
                y1={yZero}
                x2={width - paddingRight}
                y2={yZero}
                stroke="hsl(220, 15%, 70%)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}

            {/* Line Chart Mode */}
            <g>
              {/* Area Path for Profit */}
              {areaPathProf && (
                <path
                  d={areaPathProf}
                  fill="url(#chartGradientProf)"
                  className="chart-area"
                />
              )}

              {/* Curve Line Path - Revenue */}
              {linePathRev && (
                <path
                  d={linePathRev}
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  className="chart-line"
                />
              )}

              {/* Curve Line Path - Expenses */}
              {linePathExp && (
                <path
                  d={linePathExp}
                  fill="none"
                  stroke="var(--danger)"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  className="chart-line"
                />
              )}

              {/* Curve Line Path - Profit */}
              {linePathProf && (
                <path
                  d={linePathProf}
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  className="chart-line"
                />
              )}

              {/* Interactive Dots for Data Points */}
              {points.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.yRev}
                    r={3.5}
                    fill="var(--bg-card)"
                    stroke="var(--primary)"
                    strokeWidth={2}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.yExp}
                    r={3.5}
                    fill="var(--bg-card)"
                    stroke="var(--danger)"
                    strokeWidth={2}
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.yProf}
                    r={4}
                    fill="var(--bg-card)"
                    stroke="var(--success)"
                    strokeWidth={2.5}
                  />
                </g>
              ))}
            </g>

            {/* X-Axis Labels */}
            {points.map((pt, idx) => (
              <text
                key={idx}
                x={pt.x}
                y={height - 5}
                textAnchor="middle"
                style={{ fontSize: '0.75rem', fill: 'var(--text-secondary)', fontWeight: 600 }}
              >
                {pt.label}
              </text>
            ))}

            {/* Vertical guidelines on hover */}
            {hoveredIndexLine !== null && (
              <line
                x1={points[hoveredIndexLine].x}
                y1={paddingTop}
                x2={points[hoveredIndexLine].x}
                y2={paddingTop + chartHeight}
                stroke="var(--primary)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                opacity={0.4}
              />
            )}

            {/* Hover overlay hitboxes */}
            {points.map((pt, i) => (
              <rect
                key={i}
                x={pt.x - chartWidth / 22}
                y={paddingTop}
                width={chartWidth / 11}
                height={chartHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIndexLine(i)}
                onMouseLeave={() => setHoveredIndexLine(null)}
              />
            ))}
          </svg>

          {/* Interactive Tooltip */}
          {hoveredIndexLine !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${(points[hoveredIndexLine].x / width) * 100}%`,
                top: `${Math.min(points[hoveredIndexLine].yRev, points[hoveredIndexLine].yExp, points[hoveredIndexLine].yProf) - 95}px`,
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(30, 41, 59, 0.96)',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '10px',
                boxShadow: 'var(--shadow-lg)',
                pointerEvents: 'none',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '180px',
                transition: 'left 0.1s ease, top 0.1s ease',
                fontSize: '0.78rem'
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'hsl(215, 20%, 80%)', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', marginBottom: '4px', textAlign: 'center' }}>
                {points[hoveredIndexLine].label} {currentYear}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span style={{ color: 'hsl(215, 20%, 80%)' }}>Revenue:</span>
                <span style={{ fontWeight: 600 }}>₹{points[hoveredIndexLine].revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <span style={{ color: 'hsl(215, 20%, 80%)' }}>Expenses:</span>
                <span style={{ fontWeight: 600, color: 'hsl(10, 95%, 75%)' }}>₹{points[hoveredIndexLine].expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '4px' }}>
                <span style={{ color: 'hsl(215, 20%, 80%)', fontWeight: 600 }}>Profit:</span>
                <span style={{ fontWeight: 700, color: points[hoveredIndexLine].profit >= 0 ? 'hsl(145, 80%, 75%)' : 'hsl(355, 85%, 75%)' }}>
                  ₹{points[hoveredIndexLine].profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({ (points[hoveredIndexLine].revenue > 0 ? (points[hoveredIndexLine].profit / points[hoveredIndexLine].revenue) * 100 : 0).toFixed(0) }%)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Side: Recent Customers */}
        <div className="card" style={{ gap: '16px' }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Recent Customer Accounts</h3>
              <p className="card-subtitle">List of newly registered corporate client accounts.</p>
            </div>
            <button className="btn btn-primary" onClick={() => onNavigate('customer-list')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Customer
            </button>
          </div>

          {customers.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Users size={40} style={{ opacity: .3 }} />
              <p>No customer records registered yet.</p>
            </div>
          ) : (
            <div className="table-responsive-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>ID</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Company / Client</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Mobile</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>City</th>
                    <th style={{ padding: '12px 8px', fontWeight: 600 }}>Project Scope Brief</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 5).map((customer) => (
                    <tr key={customer.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--primary)' }}>{customer.customer_id_seq}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 500 }}>{customer.customer_name}</td>
                      <td style={{ padding: '12px 8px' }}>{customer.mobile_number}</td>
                      <td style={{ padding: '12px 8px' }}>{customer.city || '—'}</td>
                      <td style={{
                        padding: '12px 8px',
                        color: 'var(--text-secondary)',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={customer.project_brief}>
                        {customer.project_brief || 'No details recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Today's Meetings */}
        <div className="card" style={{ gap: '16px' }}>
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Today's Consultations</h3>
              <p className="card-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            <button className="btn btn-secondary" onClick={() => onNavigate('meetings')} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              <Calendar size={14} /> Schedule
            </button>
          </div>

          {meetings.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <Video size={36} style={{ opacity: .3, color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.85rem' }}>No client meetings scheduled today.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {meetings.map((meet) => (
                <div key={meet.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary-light)',
                  borderLeft: '4px solid var(--primary)',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meet.customer_name}</span>
                    <span style={{ fontSize: '0.78rem', backgroundColor: 'var(--bg-card)', padding: '2px 8px', borderRadius: '50px', fontWeight: 600, color: 'var(--primary)' }}>
                      {meet.meeting_time}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agenda: {meet.agenda}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Lead: {meet.lead_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="card" style={{ gap: '16px', marginTop: '24px' }}>
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Recent Payments Received</h3>
            <p className="card-subtitle">Real-time log of client advance payments and final settlements.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => onNavigate('billing')} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            View Billing Directory
          </button>
        </div>

        {payments.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <IndianRupee size={40} style={{ opacity: .3, color: 'var(--success)' }} />
            <p>No payment transactions recorded yet.</p>
          </div>
        ) : (
          <div className="table-responsive-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Payment Date</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Invoice No</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Client / Company</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Payment Type</th>
                  <th style={{ padding: '12px 8px', fontWeight: 700, textAlign: 'right' }}>Amount Received</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((pm) => (
                  <tr key={pm.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{formatDateSafe(pm.date)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: 'var(--primary)' }}>{pm.invoiceNo}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>{pm.customerName}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{pm.serviceName}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-status" style={{
                        backgroundColor: pm.type === 'Advance Payment' ? 'var(--primary-light)' : 'var(--success-light)',
                        color: pm.type === 'Advance Payment' ? 'var(--primary)' : 'var(--success)',
                        padding: '4px 10px',
                        borderRadius: '50px',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}>
                        {pm.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--success)', textAlign: 'right' }}>
                      ₹{pm.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
