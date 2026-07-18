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

  const serviceNameLower = (invoice.service_name || '').toLowerCase();
  const isPump = serviceNameLower.includes('pump');
  const isGas = serviceNameLower.includes('gas');
  const isGeneral = serviceNameLower.includes('general');
  const isFree = serviceNameLower.includes('free');
  const isDismantle = serviceNameLower.includes('dismantle');
  const isInstall = serviceNameLower.includes('install') || serviceNameLower.includes('installation');
  const isPcb = serviceNameLower.includes('pcb');
  const isAmc = serviceNameLower.includes('amc');

  const renderCheckbox = (label, checked) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.88em', marginRight: '6px' }}>
      <span style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        border: '1px solid #111',
        textAlign: 'center',
        lineHeight: '8px',
        fontSize: '8px',
        fontWeight: 'bold',
        backgroundColor: checked ? '#f1f5f9' : '#fff'
      }}>
        {checked ? '✓' : ''}
      </span>
      <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );

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

        {/* Scrollable Container on Screen (Not printed) */}
        <div className="invoice-modal-body" style={{ overflow: 'auto', flex: 1, padding: '16px', backgroundColor: '#f1f5f9' }}>
          {/* Invoice Printable Sheet */}
          <div ref={printableRef} className="printable-invoice" style={{
            padding: '16px 20px',
            backgroundColor: '#ffffff',
            color: '#111111',
            fontFamily: "'Inter', sans-serif",
            fontSize: '9px',
            lineHeight: '1.3',
            boxSizing: 'border-box',
            width: '760px',
            minWidth: '760px',
            margin: '0 auto',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
          }}>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px', boxSizing: 'border-box', width: '100%' }}>
          
            {/* Header Block */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '6px', borderBottom: '2px solid #111', boxSizing: 'border-box', width: '100%' }}>
              {/* Left Logo & Brand */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', boxSizing: 'border-box' }}>
                <img 
                  src="/logo.png" 
                  alt="Kundavai AC Tec Logo" 
                  style={{ 
                    maxHeight: '44px', 
                    width: 'auto', 
                    objectFit: 'contain'
                  }} 
                />
                <div>
                  <h2 style={{ fontSize: '1.65em', fontWeight: 800, color: '#111', margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.5px' }}>
                    Kundavai AC Tec
                  </h2>
                  <p style={{ fontSize: '0.85em', fontWeight: '700', color: '#333', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Multi Brand AC Sales & Service
                  </p>
                </div>
              </div>

              {/* Right Address & Contact Details */}
              <div style={{ textAlign: 'right', fontSize: '0.88em', lineHeight: '1.3', color: '#333', boxSizing: 'border-box' }}>
                <p style={{ margin: 0 }}>SF No.93, Sri Vari Ramakrishna Garden,</p>
                <p style={{ margin: 0 }}>Ganapathy, Coimbatore - 641 006.</p>
                <p style={{ margin: '1px 0 0 0', fontWeight: '600' }}>Mob: +91 98941 45664 | +91 82204 06664</p>
                <p style={{ margin: 0 }}>Email: sarwinairconditioner@gmail.com | Web: www.sarwinac.com</p>
                <p style={{ margin: '1px 0 0 0', fontWeight: 'bold' }}>GSTIN: 33AYBPV8200A1ZX</p>
              </div>
            </div>

            {/* Metadata Row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              border: '1px solid #111', 
              fontSize: '0.95em',
              fontWeight: '700',
              backgroundColor: '#f8fafc',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <div style={{ padding: '4px 8px', flex: 1, boxSizing: 'border-box' }}>
                INV NO : <span style={{ fontWeight: '800', color: '#111' }}>{invoice.invoice_no}</span>
              </div>
              <div style={{ padding: '4px 8px', flex: 1, textAlign: 'center', borderLeft: '1px solid #111', borderRight: '1px solid #111', letterSpacing: '1px', boxSizing: 'border-box' }}>
                SERVICE REPORT
              </div>
              <div style={{ padding: '4px 8px', flex: 1, textAlign: 'right', boxSizing: 'border-box' }}>
                DATE : {new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </div>
            </div>

            {/* Service Type Checkboxes Row */}
            <div style={{ 
              display: 'flex', 
              borderLeft: '1px solid #111', 
              borderRight: '1px solid #111', 
              borderBottom: '1px solid #111',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              {/* Checkboxes List */}
              <div style={{ flex: 4, padding: '6px 8px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', boxSizing: 'border-box' }}>
                {renderCheckbox('FREE SERVICE', isFree)}
                {renderCheckbox('GENERAL SERVICE', isGeneral)}
                {renderCheckbox('PUMP SERVICE', isPump)}
                {renderCheckbox('GAS FILLING', isGas)}
                {renderCheckbox('DISMANTLE', isDismantle)}
                {renderCheckbox('INSTALLATION', isInstall)}
                {renderCheckbox('PCB BOARD', isPcb)}
                {renderCheckbox('AMC', isAmc)}
              </div>
              
              {/* Time Blocks */}
              <div style={{ 
                flex: 1, 
                borderLeft: '1px solid #111', 
                padding: '4px 8px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                gap: '2px',
                fontSize: '0.85em',
                fontWeight: '600',
                boxSizing: 'border-box'
              }}>
                <div>IN TIME : <span style={{ fontWeight: 'normal' }}>1:10 PM</span></div>
                <div>OUT TIME : <span style={{ fontWeight: 'normal' }}>3:50 PM</span></div>
              </div>
            </div>

            {/* Customer & Engineer Details Row */}
            <div style={{ 
              display: 'flex', 
              borderLeft: '1px solid #111', 
              borderRight: '1px solid #111', 
              borderBottom: '1px solid #111',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              {/* Customer Box */}
              <div style={{ flex: 3, padding: '6px 8px', borderRight: '1px solid #111', boxSizing: 'border-box' }}>
                <div style={{ fontWeight: '800', textTransform: 'uppercase', fontSize: '0.85em', color: '#475569', marginBottom: '4px' }}>
                  CUSTOMER NAME & ADDRESS
                </div>
                <div style={{ fontSize: '0.95em', fontWeight: '700', color: '#111' }}>
                  {invoice.customer_name}
                </div>
                <div style={{ fontSize: '0.9em', color: '#333', marginTop: '2px', lineHeight: '1.2' }}>
                  {invoice.address || 'Chetti St, Ashok Nagar, Chennai'}
                </div>
                <div style={{ fontSize: '0.9em', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center' }}>
                  Whatsapp No. <span style={{ fontWeight: '800', marginLeft: '6px', color: '#111' }}>{invoice.mobile_number || '9842521551'}</span>
                </div>
              </div>

              {/* Engineer Box */}
              <div style={{ flex: 2, padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                <div>
                  <div style={{ fontSize: '0.85em', fontWeight: '800', color: '#475569', marginBottom: '2px' }}>SERVICE ENGG NAME</div>
                  <div style={{ fontSize: '0.95em', fontWeight: '700', color: '#111' }}>
                    {invoice.assigned_lead || 'Arunkumar / Williams'}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #ddd', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', fontWeight: '600', boxSizing: 'border-box' }}>
                  <div>VOLTAGE: <span style={{ fontWeight: 'normal' }}>230 V</span></div>
                  <div>AMPS: <span style={{ fontWeight: 'normal' }}>6.2 A</span></div>
                </div>
                <div style={{ fontSize: '0.85em', fontWeight: '600' }}>
                  SUCTION PRESSURE: <span style={{ fontWeight: 'normal' }}>65 PSI</span>
                </div>
              </div>
            </div>

            {/* Observations, Complaint and Date Row */}
            <div style={{ 
              display: 'flex', 
              borderLeft: '1px solid #111', 
              borderRight: '1px solid #111', 
              borderBottom: '1px solid #111',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              {/* Col 1 */}
              <div style={{ flex: 2, padding: '4px 8px', borderRight: '1px solid #111', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '0.78em', fontWeight: '800', color: '#475569', marginBottom: '2px' }}>OBSERVATION, REPORT & ACTIONS</div>
                <div style={{ fontSize: '0.88em', color: '#111', lineHeight: '1.2' }}>
                  {invoice.project_brief || 'AC unit serviced. Cooling and airflow restored successfully. Water leakage checked & resolved.'}
                </div>
              </div>
              {/* Col 2 */}
              <div style={{ flex: 1, padding: '4px 8px', borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                <div>
                  <div style={{ fontSize: '0.78em', fontWeight: '800', color: '#475569' }}>PRODUCT MODEL NO.</div>
                  <div style={{ fontSize: '0.88em', fontWeight: '600', color: '#111', marginTop: '2px' }}>Voltas Split AC 1.5T</div>
                </div>
                <div style={{ borderTop: '1px dotted #ccc', paddingTop: '2px', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '0.75em', fontWeight: '800', color: '#475569' }}>PCB BOARD MODEL</div>
                  <div style={{ fontSize: '0.85em', color: '#111' }}>—</div>
                </div>
              </div>
              {/* Col 3 */}
              <div style={{ flex: 1, padding: '4px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                <div>
                  <div style={{ fontSize: '0.78em', fontWeight: '800', color: '#475569' }}>NEXT SERVICE DATE</div>
                  <div style={{ fontSize: '0.88em', fontWeight: '700', color: '#111', marginTop: '2px' }}>
                    {new Date(new Date(invoice.invoice_date).setMonth(new Date(invoice.invoice_date).getMonth() + 6)).toLocaleDateString('en-IN')}
                  </div>
                </div>
                <div style={{ borderTop: '1px dotted #ccc', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75em', boxSizing: 'border-box' }}>
                  <div>COMPLAINT: <span style={{ fontWeight: '600' }}>{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</span></div>
                  <div>DELIVERY: <span style={{ fontWeight: '600' }}>{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</span></div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              border: '1px solid #111', 
              marginTop: '4px',
              fontSize: '0.92em',
              boxSizing: 'border-box',
              tableLayout: 'fixed'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #111' }}>
                  <th style={{ padding: '5px 4px', fontWeight: '800', textAlign: 'center', borderRight: '1px solid #111', width: '8%' }}>S.NO</th>
                  <th style={{ padding: '5px 6px', fontWeight: '800', textAlign: 'left', borderRight: '1px solid #111', width: '48%' }}>DESCRIPTION</th>
                  <th style={{ padding: '5px 4px', fontWeight: '800', textAlign: 'center', borderRight: '1px solid #111', width: '8%' }}>QTY</th>
                  <th style={{ padding: '5px 6px', fontWeight: '800', textAlign: 'right', borderRight: '1px solid #111', width: '13%' }}>RATE</th>
                  <th style={{ padding: '5px 6px', fontWeight: '800', textAlign: 'right', borderRight: '1px solid #111', width: '13%' }}>TOTAL VALUE</th>
                  <th style={{ padding: '5px 6px', fontWeight: '800', textAlign: 'center', width: '10%' }}>TOWARDS Rs.</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item, idx) => (
                  <tr key={idx} style={{ verticalAlign: 'middle', borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '5px 4px', textAlign: 'center', borderRight: '1px solid #111' }}>{idx + 1}</td>
                    <td style={{ 
                      padding: '5px 6px', 
                      fontWeight: '600', 
                      color: '#111', 
                      borderRight: '1px solid #111', 
                      wordBreak: 'break-word', 
                      whiteSpace: 'normal' 
                    }}>
                      {item.title}
                      {item.description && (
                        <div style={{ fontSize: '0.85em', color: '#555', fontWeight: 'normal', marginTop: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                          ({item.description})
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '5px 4px', textAlign: 'center', borderRight: '1px solid #111' }}>{item.qty}</td>
                    <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #111' }}>
                      {formatCurrency(item.rate)}
                    </td>
                    <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: '700', borderRight: '1px solid #111' }}>
                      {formatCurrency(item.amount)}
                    </td>
                    {idx === 0 ? (
                      <td 
                        rowSpan={Math.max(6, parsedItems.length)} 
                        style={{ 
                          padding: '5px 6px', 
                          textAlign: 'center', 
                          fontWeight: '800',
                          fontSize: '1.1em',
                          color: '#2b3e50',
                          verticalAlign: 'middle',
                          backgroundColor: '#fbfbfb',
                          borderLeft: '1px solid #111'
                        }}
                      >
                        {formatCurrency(grandTotal)}
                      </td>
                    ) : null}
                  </tr>
                ))}
                {/* Fill mock empty rows to match paper layout */}
                {Array.from({ length: Math.max(0, 6 - parsedItems.length) }).map((_, idx) => {
                  const globalIdx = parsedItems.length + idx;
                  return (
                    <tr key={`empty-${idx}`} style={{ height: '19px', borderBottom: '1px solid #eee' }}>
                      <td style={{ borderRight: '1px solid #111' }}></td>
                      <td style={{ borderRight: '1px solid #111' }}></td>
                      <td style={{ borderRight: '1px solid #111' }}></td>
                      <td style={{ borderRight: '1px solid #111' }}></td>
                      <td style={{ borderRight: '1px solid #111' }}></td>
                      {globalIdx === 0 ? (
                        <td 
                          rowSpan={6} 
                          style={{ 
                            padding: '5px 6px', 
                            textAlign: 'center', 
                            fontWeight: '800',
                            fontSize: '1.1em',
                            color: '#2b3e50',
                            verticalAlign: 'middle',
                            backgroundColor: '#fbfbfb',
                            borderLeft: '1px solid #111'
                          }}
                        >
                          {formatCurrency(grandTotal)}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals & Signature Block Divider */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', marginTop: '2px', gap: '8px', boxSizing: 'border-box', width: '100%' }}>
              
              {/* Left Checklist and Sign block (Collected Amt / Bal) */}
              <div style={{ flex: 55, border: '1px solid #111', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '6px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', fontWeight: '700', borderBottom: '1px dotted #ccc', paddingBottom: '3px', boxSizing: 'border-box' }}>
                  <div>COLLECTED AMOUNT: <span style={{ fontWeight: '800', color: '#111' }}>{formatCurrency(invoice.status === 'Paid' ? grandTotal : invoice.advance_paid)}</span></div>
                  <div>BALANCE AMOUNT: <span style={{ fontWeight: '800', color: '#111' }}>{formatCurrency(invoice.status === 'Paid' ? 0 : grandTotal - invoice.advance_paid)}</span></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
                  {/* Engineer Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.85em', boxSizing: 'border-box' }}>
                    <div>ENGINEER NAME: <strong style={{ color: '#111' }}>{invoice.assigned_lead || 'Arunkumar'}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', boxSizing: 'border-box' }}>
                      <span>SIGN:</span>
                      <span style={{ fontFamily: "'Dancing Script', cursive, sans-serif", fontSize: '1.2em', fontWeight: 'bold', color: '#1e3a8a', borderBottom: '1px solid #999', padding: '0 8px' }}>
                        {invoice.assigned_lead ? invoice.assigned_lead.split(' ')[0] : 'Arunkumar'}
                      </span>
                    </div>
                  </div>

                  {/* Booking checklists */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', boxSizing: 'border-box' }}>
                    {renderCheckbox('CALL CLOSED', invoice.status === 'Paid')}
                    {renderCheckbox('CHECKED AFTER COMPLETION', true)}
                    {renderCheckbox('CALL PENDING', invoice.status !== 'Paid')}
                  </div>
                </div>
              </div>

              {/* Center QR Code Scan & Pay */}
              <div style={{ 
                flex: 13, 
                border: '1px solid #111', 
                padding: '4px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box'
              }}>
                <div style={{ fontSize: '0.62em', fontWeight: '800', marginBottom: '2px', textAlign: 'center', letterSpacing: '0.2px' }}>SCAN & PAY</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', width: '32px', height: '32px', gap: '1px', border: '1px solid #111', padding: '2px', backgroundColor: '#fff', boxSizing: 'border-box' }}>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div></div>
                  
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  
                  <div></div>
                  <div></div>
                  <div></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                  <div></div>
                  <div style={{ backgroundColor: '#111' }}></div>
                </div>
              </div>

              {/* Right Customer Checklist & Sign */}
              <div style={{ flex: 32, border: '1px solid #111', padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px', boxSizing: 'border-box' }}>
                <div style={{ fontSize: '0.78em', fontWeight: '800', color: '#475569', borderBottom: '1px dotted #ccc', paddingBottom: '2px', marginBottom: '4px' }}>CUSTOMER CHECKLIST</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', boxSizing: 'border-box' }}>
                  {renderCheckbox('FILTER & COIL CLEANED', true)}
                  {renderCheckbox('WATER LEAKAGE CHECKED', true)}
                  {renderCheckbox('COOLING CHECKED', true)}
                  {renderCheckbox('RUNNING CONDITION OK', true)}
                </div>
                <div style={{ borderTop: '1px solid #ddd', marginTop: '6px', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', boxSizing: 'border-box' }}>
                  <span>Customer Sign:</span>
                  <span style={{ borderBottom: '1px solid #999', width: '50px', height: '10px' }}></span>
                </div>
              </div>
            </div>

            {/* Totals & Payment Modes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #111', padding: '4px 8px', backgroundColor: '#f8fafc', marginTop: '2px', boxSizing: 'border-box', width: '100%' }}>
              {/* Payment modes checkboxes */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
                <span style={{ fontWeight: '700', marginRight: '8px', fontSize: '0.85em' }}>PAYMENT BY:</span>
                {renderCheckbox('CASH', invoice.status === 'Paid')}
                {renderCheckbox('GPAY', true)}
                {renderCheckbox('IMPS', false)}
                {renderCheckbox('NEFT', false)}
              </div>
              
              {/* Totals */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '16px', fontSize: '0.9em', fontWeight: '700', boxSizing: 'border-box' }}>
                <div>Total: <span style={{ fontWeight: '800', color: '#111' }}>{formatCurrency(subTotal)}</span></div>
                <div>GST 18%: <span style={{ fontWeight: '800', color: '#111' }}>{formatCurrency(cgstAmount + sgstAmount + igstAmount)}</span></div>
                <div>Grand Total: <span style={{ fontWeight: '800', color: '#111' }}>{formatCurrency(grandTotal)}</span></div>
              </div>
            </div>

            {/* Footer Details */}
            <div style={{ borderTop: '1px solid #111', marginTop: '6px', paddingTop: '6px', textAlign: 'center', fontSize: '0.85em', lineHeight: '1.4', boxSizing: 'border-box', width: '100%' }}>
              <div style={{ fontWeight: '800', color: '#dc2626', fontSize: '1.05em', letterSpacing: '0.5px' }}>
                SERVICE CALL BOOKING : 8220406664 | 8300099399
              </div>
              <div style={{ fontWeight: '700', color: '#333', marginTop: '2px', fontSize: '0.9em' }}>
                NOTE : TO REPAIR A PCB BOARD, IT TAKES TWO TO FIFTEEN DAYS
              </div>
              <div style={{ color: '#4b5563', marginTop: '2px', fontSize: '0.85em', fontWeight: '600' }}>
                Branches : Coimbatore | Chennai | Tiruppur | Erode | Salem | Karur
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
