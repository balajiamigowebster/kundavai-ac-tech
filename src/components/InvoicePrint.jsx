import React, { useRef, useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

export default function InvoicePrint({ invoice, onClose, autoShare }) {
  if (!invoice) return null;

  const printableRef = useRef(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (autoShare) {
      const timer = setTimeout(() => {
        handleSendWhatsApp().then(() => {
          onClose();
        }).catch(() => {
          onClose();
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoShare]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    if (sharing) return;
    setSharing(true);

    try {
      const rawPhone = invoice.mobile_number || '';
      const phone = rawPhone.replace(/\D/g, '');
      const formattedPhone = phone.length === 10 ? '91' + phone : phone;

      const subTotal = parseFloat(invoice.amount) || 0;
      const customerState = getStateFromCity(invoice.city);
      const isInterState = customerState.trim().toLowerCase() !== 'tamil nadu';

      let cgstRate = 0;
      let sgstRate = 0;
      let igstRate = 0;

      const gstRatePercent = invoice.gst_rate !== undefined ? parseFloat(invoice.gst_rate) : 18;

      if (isInterState) {
        igstRate = gstRatePercent;
      } else {
        cgstRate = gstRatePercent / 2;
        sgstRate = cgstRate;
      }

      const cgstAmount = subTotal * (cgstRate / 100);
      const sgstAmount = subTotal * (sgstRate / 100);
      const igstAmount = subTotal * (igstRate / 100);
      const taxTotal = cgstAmount + sgstAmount + igstAmount;
      const grandTotal = subTotal + taxTotal;

      const advancePaid = parseFloat(invoice.advance_paid) || 0;
      const pendingAmt = invoice.status === 'Paid' ? 0 : Math.max(0, grandTotal - advancePaid);

      let taxBreakdown = '';
      if (isInterState) {
        taxBreakdown = `• IGST (${igstRate}%): ₹${igstAmount.toFixed(2)}`;
      } else {
        taxBreakdown = `• CGST (${cgstRate}%): ₹${cgstAmount.toFixed(2)}\n• SGST (${sgstRate}%): ₹${sgstAmount.toFixed(2)}`;
      }

      const formatDateSafeLocal = (dateStr) => {
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

      const messageText = `Hello *${invoice.customer_name}*,\n\nYour invoice *${invoice.invoice_no}* for *${invoice.service_name}* has been generated.\n\n*Invoice Summary:*\n• Invoice No: ${invoice.invoice_no}\n• Date: ${formatDateSafeLocal(invoice.invoice_date)}\n• Subtotal: ₹${subTotal.toFixed(2)}\n${taxBreakdown}\n• Grand Total: ₹${grandTotal.toFixed(2)}\n• Advance Paid: ₹${advancePaid.toFixed(2)}\n• Pending Amount: ₹${pendingAmt.toFixed(2)}\n• Status: *${invoice.status}*\n\nThank you for choosing *Kundavai AC Tec*!`;

      const element = printableRef.current;
      if (!element) {
        throw new Error("Printable invoice element not found.");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');
      const filename = `Invoice-${invoice.invoice_no}.pdf`;
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

      const shareData = {
        files: [pdfFile],
        title: `Invoice ${invoice.invoice_no}`,
        text: messageText
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const blobUrl = URL.createObjectURL(pdfBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);

        try {
          await navigator.clipboard.writeText(messageText);
          alert("Invoice PDF downloaded successfully! The invoice summary text has been copied to your clipboard.\n\nOpening WhatsApp... Please paste the summary and attach the downloaded PDF in the chat.");
        } catch (clipErr) {
          alert("Invoice PDF downloaded successfully!\n\nOpening WhatsApp... Please attach the downloaded PDF in the chat.");
        }

        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (err) {
      console.error("Error generating/sharing PDF:", err);
      alert("Failed to generate PDF. Opening text message fallback...");
      const rawPhone = invoice.mobile_number || '';
      const phone = rawPhone.replace(/\D/g, '');
      const formattedPhone = phone.length === 10 ? '91' + phone : phone;
      const message = `Hello *${invoice.customer_name}*,\n\nYour invoice *${invoice.invoice_no}* for *${invoice.service_name}* has been generated.\n\nThank you for choosing *Kundavai AC Tec*!`;
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } finally {
      setSharing(false);
    }
  };

  let parsedItems = [];
  try {
    parsedItems = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
    if (!Array.isArray(parsedItems)) parsedItems = [];
  } catch (e) {
    parsedItems = [];
  }

  // Fallback for older invoice entries
  if (parsedItems.length === 0) {
    parsedItems = [
      {
        title: invoice.service_name || 'Website Design & Development',
        description: 'Design and Development Services',
        rate: invoice.amount,
        qty: 1,
        amount: invoice.amount
      }
    ];
  }

  const subTotal = parseFloat(invoice.amount) || 0;
  
  // Dynamic Tax Calculation based on interstate customer rules
  const customerState = getStateFromCity(invoice.city);
  const isInterState = customerState.trim().toLowerCase() !== 'tamil nadu';
  
  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  
  if (isInterState) {
    igstRate = invoice.gst_rate !== undefined ? parseFloat(invoice.gst_rate) : 18;
  } else {
    cgstRate = (invoice.gst_rate !== undefined ? parseFloat(invoice.gst_rate) : 18) / 2;
    sgstRate = cgstRate;
  }
  
  const cgstAmount = subTotal * (cgstRate / 100);
  const sgstAmount = subTotal * (sgstRate / 100);
  const igstAmount = subTotal * (igstRate / 100);
  const grandTotal = subTotal + cgstAmount + sgstAmount + igstAmount;

  // Currency formatter matching image representation
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    if (num % 1 === 0) {
      return '₹ ' + Math.round(num).toLocaleString('en-IN');
    }
    return '₹ ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="modal-backdrop centered" onClick={onClose}>
      <div className="invoice-modal centered" style={{ maxWidth: '800px', width: '95%', backgroundColor: '#fff', color: '#333' }} onClick={e => e.stopPropagation()}>
        
        {/* Modal Controls (Not printed) */}
        <div className="invoice-modal-header" style={{ borderBottom: '1px solid #ddd', padding: '16px 24px', backgroundColor: '#f9fafb' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111' }}>Print Invoice Receipt</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handlePrint} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Printer size={16} /> Print
            </button>
            <button 
              className="btn btn-whatsapp" 
              onClick={handleSendWhatsApp} 
              disabled={sharing}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <WhatsAppIcon size={16} /> {sharing ? 'Generating PDF...' : 'Send to WhatsApp'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div ref={printableRef} className="invoice-modal-body printable-invoice" style={{
          padding: '12px 20px',
          backgroundColor: '#ffffff',
          color: '#333333',
          fontFamily: "'Inter', sans-serif",
          fontSize: '8px',
          lineHeight: '1.3'
        }}>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Header Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            {/* Left Company Block */}
            <div style={{ width: '55%' }}>
              <div style={{
                backgroundColor: '#3b4b5a',
                color: '#ffffff',
                padding: '4px 16px',
                fontWeight: '700',
                fontSize: '1.25em',
                letterSpacing: '1px',
                width: '150px',
                textAlign: 'center',
                borderRadius: '2px',
                marginBottom: '6px'
              }}>
                INVOICE
              </div>
              <h2 style={{ fontSize: '1.75em', fontWeight: 800, color: '#111', lineHeight: '1.2', marginBottom: '4px', fontFamily: "'Outfit', sans-serif" }}>
                Kundavai AC Tec
              </h2>
              <div style={{ color: '#333', fontSize: '1.2em', lineHeight: '1.45' }}>
                <p>Plot No 6 Anna Main Road Vengambakkam,</p>
                <p>Chennai - 600128</p>
                <p style={{ marginTop: '1px' }}>Mob: 9445332233</p>
                <p>Email: balaji@kundavaiactec.com</p>
              </div>
            </div>

            {/* Right Logo Block (AMIGO WEBSTER Logo image) */}
            <div style={{ width: '40%', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <img 
                src="/logo.png" 
                alt="Kundavai AC Tec Logo" 
                style={{ 
                  maxHeight: '48px', 
                  width: 'auto', 
                  marginBottom: '6px',
                  objectFit: 'contain'
                }} 
              />
            </div>
          </div>

          {/* Metadata & Billing Address Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
            
            {/* BILL TO Client Box */}
            <div style={{
              width: '58%',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 10px',
              backgroundColor: '#f8fafc'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92em' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '30%', padding: '2px 0', color: '#475569', fontWeight: 700 }}>BILL TO:</td>
                    <td style={{ padding: '2px 0 2px 4px', fontWeight: '700', color: '#1e293b', borderBottom: '1px solid #cbd5e1' }}>{invoice.customer_name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600 }}>Company Name</td>
                    <td style={{ padding: '2px 0 2px 4px', fontWeight: '700', color: '#1e293b', borderBottom: '1px solid #cbd5e1' }}>{invoice.customer_name}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600, verticalAlign: 'top', paddingTop: '2px' }}>Address</td>
                    <td style={{ 
                      padding: '2px 0 2px 4px', 
                      color: '#333', 
                      lineHeight: '18px',
                      backgroundImage: 'linear-gradient(to bottom, transparent 17px, #cbd5e1 17px)',
                      backgroundSize: '100% 18px',
                      whiteSpace: 'normal', 
                      wordBreak: 'break-word' 
                    }}>
                      {invoice.address || 'No. 303, C Block, Sapthagiri Sandalwood, Krishnarajapuram, Kadugodi, Bengaluru,'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600 }}>Pincode</td>
                    <td style={{ padding: '2px 0 2px 4px', color: '#333', borderBottom: '1px solid #cbd5e1' }}>{invoice.pincode || '560067'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600 }}>State</td>
                    <td style={{ padding: '2px 0 2px 4px', color: '#333', borderBottom: '1px solid #cbd5e1' }}>
                      {getStateFromCity(invoice.city)}
                    </td>
                  </tr>
                  {invoice.gst_no && invoice.gst_no.trim() !== '' && (
                    <tr>
                      <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600 }}>GST</td>
                      <td style={{ padding: '2px 0 2px 4px', color: '#333', borderBottom: '1px solid #cbd5e1' }}>
                        {invoice.gst_no}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Invoice Details Table */}
            <div style={{ width: '38%' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                border: '1px solid #cbd5e1', 
                fontSize: '0.88em',
                textAlign: 'left'
              }}>
                <tbody>
                  {[
                    { label: 'Invoice #', val: invoice.invoice_no },
                    { label: 'Invoice Date', val: new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) },
                    { label: 'Quotation #', val: '—' },
                    { label: 'Quotation Date', val: '—' },
                    { label: 'PO Reference', val: '—' },
                    { label: 'PO Date', val: '—' },
                    { label: 'Vendor Code', val: '—' }
                  ].map((row, idx) => (
                    <tr key={idx}>
                      <th style={{ 
                        padding: '3px 6px', 
                        fontWeight: '600', 
                        color: '#333', 
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        width: '50%',
                        whiteSpace: 'normal' 
                      }}>
                        {row.label}
                      </th>
                      <td style={{ 
                        padding: '3px 6px', 
                        color: '#1e293b', 
                        fontWeight: '600', 
                        textAlign: 'center', 
                        border: '1px solid #cbd5e1',
                        whiteSpace: 'normal' 
                      }}>
                        {row.val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Description Itemized Table */}
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            border: '1px solid #cbd5e1', 
            marginBottom: '8px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#3b4b5a', color: '#ffffff' }}>
                <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '700', textAlign: 'center', border: '1px solid #cbd5e1', width: '8%', whiteSpace: 'normal' }}>S. NO</th>
                <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '700', textAlign: 'left', border: '1px solid #cbd5e1', width: '52%', whiteSpace: 'normal' }}>DESCRIPTION OF ITEMS</th>
                <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '700', textAlign: 'center', border: '1px solid #cbd5e1', width: '12%', whiteSpace: 'normal' }}>HSN / SAC</th>
                <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '700', textAlign: 'center', border: '1px solid #cbd5e1', width: '8%', whiteSpace: 'normal' }}>QTY</th>
                <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '700', textAlign: 'right', border: '1px solid #cbd5e1', width: '10%', whiteSpace: 'normal' }}>PRICE</th>
                <th style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '700', textAlign: 'right', border: '1px solid #cbd5e1', width: '10%', whiteSpace: 'normal' }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {/* Service scope message row inside table body - right below table headers and before first product row */}
              <tr>
                <td colSpan={6} style={{ 
                  padding: '6px 8px', 
                  borderBottom: '1px solid #cbd5e1', 
                  fontSize: '0.95em', 
                  lineHeight: '1.3', 
                  color: '#111',
                  backgroundColor: '#ffffff',
                  textAlign: 'left'
                }}>
                  Towards the charges of Design and Development
                  <br />
                  <strong style={{ color: '#111', fontSize: '1em' }}>
                    {invoice.project_brief || invoice.service_name || 'SEO Audit & Optimization'}
                  </strong>
                </td>
              </tr>
              {parsedItems.map((item, idx) => (
                <tr key={idx} style={{ verticalAlign: 'top', backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                  <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', whiteSpace: 'normal' }}>{idx + 1}</td>
                  <td style={{ padding: '4px 6px', color: '#1e293b', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    <div style={{ fontWeight: '600' }}>{item.title}</div>
                    {item.description && (
                      <div style={{ fontSize: '0.82em', color: '#64748b', marginTop: '1px', fontWeight: 'normal' }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', color: '#475569', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', whiteSpace: 'normal' }}>998382</td>
                  <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', whiteSpace: 'normal' }}>{item.qty}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: '500', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', whiteSpace: 'normal' }}>
                    {formatCurrency(item.rate)}
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: '600', borderBottom: '1px solid #cbd5e1', whiteSpace: 'normal' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
              {/* Fill mock empty rows to match paper layout look (Guarantees at least 6 line items space!) */}
              {Array.from({ length: Math.max(0, 6 - parsedItems.length) }).map((_, idx) => {
                const globalIdx = parsedItems.length + idx;
                return (
                  <tr key={`empty-${idx}`} style={{ height: '18px', backgroundColor: globalIdx % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                    <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}></td>
                    <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}></td>
                    <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}></td>
                    <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}></td>
                    <td style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}></td>
                    <td style={{ borderBottom: '1px solid #cbd5e1' }}></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer Grid - Banks and Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            
            {/* Left Column: Customer Code and Signatures */}
            <div style={{ width: '58%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.92em', borderBottom: '1px solid #cbd5e1', paddingBottom: '2px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Customer Code:</span>
                <strong style={{ marginLeft: '8px', color: '#111' }}>{invoice.customer_id_seq}</strong>
              </div>

              {/* Signatures on the left */}
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ borderBottom: '1px solid #cbd5e1', width: '200px', display: 'flex', justifyContent: 'space-between', fontSize: '0.92em', paddingBottom: '2px' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Customer :</span>
                  <span></span>
                </div>
                <div style={{ borderBottom: '1px solid #cbd5e1', width: '200px', display: 'flex', justifyContent: 'space-between', fontSize: '0.92em', paddingBottom: '2px', marginTop: '4px' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Authorized Signatory</span>
                  <span></span>
                </div>
              </div>
            </div>

            {/* Right Column: Totals details */}
            <div style={{ width: '38%' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                fontSize: '0.92em',
                lineHeight: '1.4'
              }}>
                <tbody>
                  <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 500 }}>Sub Total</td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(subTotal)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Discount</span>
                      <span style={{ fontSize: '0.82em', color: '#64748b' }}>₹ 0</span>
                    </td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: '600' }}>
                      ₹ 0
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                      <span>CGST</span>
                      <span style={{ fontSize: '0.82em', color: '#64748b' }}>{cgstRate}%</span>
                    </td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(cgstAmount)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                      <span>SGST</span>
                      <span style={{ fontSize: '0.82em', color: '#64748b' }}>{sgstRate}%</span>
                    </td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(sgstAmount)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#ffffff', borderBottom: '1.2px solid #cbd5e1' }}>
                    <td style={{ padding: '3px 6px', color: '#475569', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                      <span>IGST</span>
                      <span style={{ fontSize: '0.82em', color: '#64748b' }}>{igstRate}%</span>
                    </td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: '600' }}>
                      {formatCurrency(igstAmount)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f8fafc', fontSize: '1.02em', fontWeight: '800' }}>
                    <td style={{ padding: '4px 6px', color: '#2b3e50' }}>Grand Total</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', color: '#2b3e50' }}>
                      {formatCurrency(grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks and Signatures section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '10px', alignItems: 'flex-end' }}>
            
            {/* Remarks Box */}
            <div style={{ width: '58%' }}>
              <div style={{ fontSize: '0.85em', fontWeight: '700', color: '#475569', marginBottom: '2px' }}>Remarks / Declaration</div>
              <div style={{
                border: '1px solid #cbd5e1',
                borderRadius: '2px',
                height: '42px',
                padding: '4px 6px',
                fontSize: '0.8em',
                color: '#333',
                lineHeight: '1.3'
              }}>
                1. Please remit payments within 15 days of invoice date.
                <br />
                2. Goods/Services once delivered are subject to contract terms.
              </div>
            </div>

            {/* Authorised Signatures */}
            <div style={{ width: '38%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: '1.3em', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
                For Kundavai AC Tec
              </div>

              {/* Spacer for physical signature */}
              <div style={{ height: '30px' }}></div>

              <div style={{ borderBottom: '1.5px solid #cbd5e1', width: '150px', marginBottom: '4px' }}></div>
              <div style={{ fontSize: '1.2em', fontWeight: '700', color: '#111' }}>
                Proprietor
              </div>
            </div>
          </div>
          </div>

          {/* Bank Details at the very bottom of the A4 page */}
          <div style={{ 
            marginTop: '16px', 
            borderTop: '1px solid #cbd5e1', 
            paddingTop: '8px'
          }}>
            <div style={{ fontWeight: '700', fontSize: '0.92em', color: '#111', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Bank Account Details (For Remittance / Wire Transfer)
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88em' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600, width: '15%' }}>Account Name:</td>
                  <td style={{ padding: '2px 0', color: '#111', fontWeight: 700, width: '35%' }}>Kundavai AC Tec</td>
                  <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600, width: '15%' }}>Bank Name:</td>
                  <td style={{ padding: '2px 0', color: '#111', fontWeight: 700, width: '35%' }}>STATE BANK OF INDIA</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600 }}>Account Number:</td>
                  <td style={{ padding: '2px 0', color: '#111', fontWeight: 700 }}>43126406283</td>
                  <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600 }}>IFSC Code:</td>
                  <td style={{ padding: '2px 0', color: '#111', fontWeight: 700 }}>SBIN0016545</td>
                </tr>
                <tr>
                  <td style={{ padding: '2px 0', color: '#475569', fontWeight: 600 }}>Branch Name:</td>
                  <td style={{ padding: '2px 0', color: '#111', fontWeight: 700 }} colSpan={3}>Kilkattalai</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
