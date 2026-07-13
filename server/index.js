require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Handle subdirectory/context path routing (e.g. Passenger/cPanel)
app.use((req, res, next) => {
  if (req.url.startsWith('/acbiiling')) {
    req.url = req.url.substring('/acbiiling'.length);
    if (!req.url.startsWith('/')) {
      req.url = '/' + req.url;
    }
  }
  next();
});

let dbInitialized = false;
let dbInitializingPromise = null;

// Middleware to ensure DB connection is initialized
const checkDbConnection = async (req, res, next) => {
  try {
    if (!dbInitialized) {
      if (!dbInitializingPromise) {
        dbInitializingPromise = db.initializeDatabase().then(() => {
          dbInitialized = true;
          dbInitializingPromise = null;
        }).catch(err => {
          dbInitializingPromise = null;
          throw err;
        });
      }
      await dbInitializingPromise;
    }
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed.', 
      details: error.message 
    });
  }
};
app.use(checkDbConnection);

// ================= CUSTOMER ROUTES =================

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await db.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(customers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customers.' });
  }
});

// Get next sequential customer ID (e.g. C-104)
app.get('/api/customers/next-id', async (req, res) => {
  try {
    const customers = await db.query('SELECT customer_id_seq FROM customers');
    let nextNum = 101;
    if (customers.length > 0) {
      const nums = customers.map(c => {
        const parts = c.customer_id_seq.split('-');
        return parts.length === 2 ? parseInt(parts[1], 10) : null;
      }).filter(n => n !== null && !isNaN(n));
      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1;
      }
    }
    res.json({ nextId: `C-${nextNum}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get next customer ID.' });
  }
});

// Save new customer
app.post('/api/customers', async (req, res) => {
  const {
    customerIdSeq,
    customerName,
    mobileNumber,
    email,
    pincode,
    city,
    address,
    assignedLead,
    projectBrief
  } = req.body;

  if (!customerName || !mobileNumber) {
    return res.status(400).json({ error: 'Customer Name and Mobile Number are required.' });
  }

  try {
    let seqId = customerIdSeq;
    if (!seqId) {
      const countRes = await db.query('SELECT COUNT(*) as count FROM customers');
      seqId = `C-${101 + countRes[0].count}`;
    }

    const checkDup = await db.query('SELECT id FROM customers WHERE customer_id_seq = ?', [seqId]);
    if (checkDup.length > 0) {
      const customers = await db.query('SELECT customer_id_seq FROM customers');
      const nums = customers.map(c => {
        const parts = c.customer_id_seq.split('-');
        return parts.length === 2 ? parseInt(parts[1], 10) : null;
      }).filter(n => n !== null && !isNaN(n));
      seqId = `C-${Math.max(...nums) + 1}`;
    }

    const result = await db.query(
      `INSERT INTO customers 
      (customer_id_seq, customer_name, mobile_number, email, pincode, city, address, assigned_lead, project_brief) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [seqId, customerName, mobileNumber, email || null, pincode || null, city || null, address || null, assignedLead || 'Kundavai AC Tec', projectBrief || null]
    );

    res.status(201).json({ id: result.insertId, customerIdSeq: seqId, message: 'Customer registered successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register customer.' });
  }
});

// Update customer details
const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const {
    customerName,
    mobileNumber,
    email,
    pincode,
    city,
    address,
    assignedLead,
    projectBrief
  } = req.body;

  if (!customerName || !mobileNumber) {
    return res.status(400).json({ error: 'Customer Name and Mobile Number are required.' });
  }

  try {
    await db.query(
      `UPDATE customers SET 
        customer_name = ?, 
        mobile_number = ?, 
        email = ?, 
        pincode = ?, 
        city = ?, 
        address = ?, 
        assigned_lead = ?, 
        project_brief = ? 
      WHERE id = ?`,
      [customerName, mobileNumber, email || null, pincode || null, city || null, address || null, assignedLead || 'Kundavai AC Tec', projectBrief || null, id]
    );
    res.json({ message: 'Customer updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update customer.' });
  }
};
app.put('/api/customers/:id', updateCustomer);
app.post('/api/customers/:id/update', updateCustomer);

// Delete customer
const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ message: 'Customer deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete customer.' });
  }
};
app.delete('/api/customers/:id', deleteCustomer);
app.post('/api/customers/:id/delete', deleteCustomer);


// ================= LEAD ROUTES (PMs) =================

app.get('/api/leads', async (req, res) => {
  try {
    const leads = await db.query('SELECT * FROM leads ORDER BY lead_name ASC');
    res.json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project leads.' });
  }
});


// ================= MEETING ROUTES =================

// Get meetings
app.get('/api/meetings', async (req, res) => {
  const { date } = req.query;
  try {
    let sql = `
      SELECT m.*, c.customer_name, c.customer_id_seq, c.mobile_number, c.project_brief 
      FROM meetings m
      JOIN customers c ON m.customer_id = c.id
    `;
    const params = [];
    if (date) {
      sql += ' WHERE m.meeting_date = ?';
      params.push(date);
    }
    sql += ' ORDER BY m.meeting_date ASC, m.meeting_time ASC';
    const meetings = await db.query(sql, params);
    res.json(meetings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch meetings.' });
  }
});

// Book meeting
app.post('/api/meetings', async (req, res) => {
  const { customerId, meetingDate, meetingTime, agenda, leadName } = req.body;

  if (!customerId || !meetingDate || !meetingTime || !agenda) {
    return res.status(400).json({ error: 'Customer, Date, Time, and Agenda are required.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO meetings (customer_id, meeting_date, meeting_time, agenda, lead_name) VALUES (?, ?, ?, ?, ?)',
      [customerId, meetingDate, meetingTime, agenda, leadName || 'Kundavai AC Tec']
    );
    res.status(201).json({ id: result.insertId, message: 'Meeting scheduled successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save meeting.' });
  }
});


// ================= SERVICE ROUTES =================

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const services = await db.query('SELECT * FROM services ORDER BY id DESC');
    res.json(services);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

// Save service
app.post('/api/services', async (req, res) => {
  const { serviceCode, serviceName, cost, timeline } = req.body;

  if (!serviceName || !cost) {
    return res.status(400).json({ error: 'Service Name and Cost are required.' });
  }

  try {
    let code = serviceCode;
    if (!code) {
      const countRes = await db.query('SELECT COUNT(*) as count FROM services');
      code = `S-${101 + countRes[0].count}`;
    }

    const checkDup = await db.query('SELECT id FROM services WHERE service_code = ?', [code]);
    if (checkDup.length > 0) {
      const services = await db.query('SELECT service_code FROM services');
      const nums = services.map(s => {
        const parts = s.service_code.split('-');
        return parts.length === 2 ? parseInt(parts[1], 10) : null;
      }).filter(n => n !== null && !isNaN(n));
      code = `S-${Math.max(...nums) + 1}`;
    }

    const result = await db.query(
      'INSERT INTO services (service_code, service_name, cost, timeline) VALUES (?, ?, ?, ?)',
      [code, serviceName, parseFloat(cost), timeline || '2 weeks']
    );
    res.status(201).json({ id: result.insertId, serviceCode: code, message: 'Service cataloged successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save service.' });
  }
});

// Update service
const updateService = async (req, res) => {
  const { id } = req.params;
  const { serviceName, cost, timeline } = req.body;

  if (!serviceName || !cost) {
    return res.status(400).json({ error: 'Service Name and Cost are required.' });
  }

  try {
    await db.query(
      'UPDATE services SET service_name = ?, cost = ?, timeline = ? WHERE id = ?',
      [serviceName, parseFloat(cost), timeline || '2 weeks', id]
    );
    res.json({ message: 'Service updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update service.' });
  }
};
app.put('/api/services/:id', updateService);
app.post('/api/services/:id/update', updateService);

// Delete service
const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Service deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete service.' });
  }
};
app.delete('/api/services/:id', deleteService);
app.post('/api/services/:id/delete', deleteService);


// ================= INVOICE ROUTES =================

// Get all invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await db.query(`
      SELECT i.*, c.mobile_number, c.email, c.city, c.pincode, c.address, c.assigned_lead, c.project_brief 
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id_seq = c.customer_id_seq 
      ORDER BY i.id DESC
    `);
    res.json(invoices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch invoices.' });
  }
});

// Get next sequential invoice number (e.g. INV-1004)
app.get('/api/invoices/next-no', async (req, res) => {
  try {
    const invoices = await db.query('SELECT invoice_no FROM invoices');
    let nextNum = 1001;
    if (invoices.length > 0) {
      const nums = invoices.map(i => {
        const parts = i.invoice_no.split('-');
        return parts.length === 2 ? parseInt(parts[1], 10) : null;
      }).filter(n => n !== null && !isNaN(n));
      if (nums.length > 0) {
        nextNum = Math.max(...nums) + 1;
      }
    }
    res.json({ nextNo: `INV-${nextNum}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get next invoice number.' });
  }
});

// Save invoice
app.post('/api/invoices', async (req, res) => {
  const { invoiceNo, patientId, items, amount, advancePaid, advancePaymentDate, finalPaymentDate, status, invoiceDate, gstRate, paymentsHistory } = req.body;

  if (!patientId || !items || !amount || !invoiceDate) {
    return res.status(400).json({ error: 'Customer, Items, Total Amount, and Date are required.' });
  }

  try {
    const customerRes = await db.query('SELECT customer_id_seq, customer_name FROM customers WHERE id = ?', [patientId]);
    if (customerRes.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const { customer_id_seq, customer_name } = customerRes[0];

    // Determine invoice number
    let finalInvNo = invoiceNo;
    if (!finalInvNo) {
      const invoices = await db.query('SELECT invoice_no FROM invoices');
      let nextNum = 1001;
      if (invoices.length > 0) {
        const nums = invoices.map(i => {
          const parts = i.invoice_no.split('-');
          return parts.length === 2 ? parseInt(parts[1], 10) : null;
        }).filter(n => n !== null && !isNaN(n));
        nextNum = Math.max(...nums) + 1;
      }
      finalInvNo = `INV-${nextNum}`;
    }

    // Determine summary service name
    let serviceName = 'Services';
    if (Array.isArray(items) && items.length > 0) {
      serviceName = items.length === 1 ? items[0].title : `${items[0].title} (+ ${items.length - 1} more)`;
    }
    const itemsStr = JSON.stringify(items);

    let finalAdvancePaid = parseFloat(advancePaid || 0);
    let finalPaymentsHistoryStr = null;
    if (Array.isArray(paymentsHistory)) {
      finalPaymentsHistoryStr = JSON.stringify(paymentsHistory);
      finalAdvancePaid = paymentsHistory.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    }

    const result = await db.query(
      `INSERT INTO invoices (invoice_no, customer_id_seq, customer_name, service_name, items, amount, advance_paid, advance_payment_date, final_payment_date, status, invoice_date, gst_rate, payments_history) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [finalInvNo, customer_id_seq, customer_name, serviceName, itemsStr, parseFloat(amount), finalAdvancePaid, advancePaymentDate || null, finalPaymentDate || null, status || 'Paid', invoiceDate, parseFloat(gstRate !== undefined ? gstRate : 18.00), finalPaymentsHistoryStr]
    );

    res.status(201).json({ id: result.insertId, invoiceNo: finalInvNo, message: 'Invoice saved successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save invoice.' });
  }
});

// Update invoice
const updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { items, amount, advancePaid, advancePaymentDate, finalPaymentDate, status, invoiceDate, gstRate, paymentsHistory } = req.body;

  try {
    // Determine summary service name
    let serviceName = 'Services';
    if (Array.isArray(items) && items.length > 0) {
      serviceName = items.length === 1 ? items[0].title : `${items[0].title} (+ ${items.length - 1} more)`;
    }
    const itemsStr = JSON.stringify(items);

    let finalAdvancePaid = parseFloat(advancePaid || 0);
    let finalPaymentsHistoryStr = null;
    if (Array.isArray(paymentsHistory)) {
      finalPaymentsHistoryStr = JSON.stringify(paymentsHistory);
      finalAdvancePaid = paymentsHistory.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    }

    await db.query(
      'UPDATE invoices SET service_name = ?, items = ?, amount = ?, advance_paid = ?, advance_payment_date = ?, final_payment_date = ?, status = ?, invoice_date = ?, gst_rate = ?, payments_history = ? WHERE id = ?',
      [serviceName, itemsStr, parseFloat(amount), finalAdvancePaid, advancePaymentDate || null, finalPaymentDate || null, status, invoiceDate, parseFloat(gstRate !== undefined ? gstRate : 18.00), finalPaymentsHistoryStr, id]
    );
    res.json({ message: 'Invoice updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update invoice.' });
  }
};
app.put('/api/invoices/:id', updateInvoice);
app.post('/api/invoices/:id/update', updateInvoice);

// Delete invoice
const deleteInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM invoices WHERE id = ?', [id]);
    res.json({ message: 'Invoice deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete invoice.' });
  }
};
app.delete('/api/invoices/:id', deleteInvoice);
app.post('/api/invoices/:id/delete', deleteInvoice);

// Download database SQL file
app.get('/api/download-db', (req, res) => {
  const path = require('path');
  const { exec } = require('child_process');
  const dumpCmd = `"D:\\xampp-portable-windows-x64-7.1.33-1-VC14\\xampp\\mysql\\bin\\mysqldump.exe" -u root ${db.DB_TARGET}`;
  const backupPath = path.join(__dirname, `${db.DB_TARGET}_backup.sql`);
  
  exec(`${dumpCmd} > "${backupPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`mysqldump error: ${error.message}`);
      return res.status(500).json({ error: 'Failed to generate database backup.' });
    }
    res.download(backupPath, `${db.DB_TARGET}.sql`, (err) => {
      if (err) {
        console.error(`Download error: ${err.message}`);
      }
    });
  });
});

// ================= EMPLOYEE ROUTES =================

// Get all employees (including total salary paid)
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await db.query(`
      SELECT e.*, COALESCE(SUM(ex.amount), 0) as total_paid
      FROM employees e
      LEFT JOIN expenses ex ON e.id = ex.employee_id AND ex.category = 'Salary'
      GROUP BY e.id
      ORDER BY e.employee_name ASC
    `);
    res.json(employees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch employees.' });
  }
});

// Add an employee
app.post('/api/employees', async (req, res) => {
  const { employeeName, phoneNumber, address, salary } = req.body;
  if (!employeeName || !phoneNumber || !address || !salary) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    await db.query(
      'INSERT INTO employees (employee_name, phone_number, address, salary) VALUES (?, ?, ?, ?)',
      [employeeName, phoneNumber, address, parseFloat(salary)]
    );
    res.status(201).json({ message: 'Employee added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add employee.' });
  }
});

// Update employee
const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { employeeName, phoneNumber, address, salary } = req.body;
  if (!employeeName || !phoneNumber || !address || !salary) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    await db.query(
      'UPDATE employees SET employee_name = ?, phone_number = ?, address = ?, salary = ? WHERE id = ?',
      [employeeName, phoneNumber, address, parseFloat(salary), id]
    );
    res.json({ message: 'Employee updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update employee.' });
  }
};
app.put('/api/employees/:id', updateEmployee);
app.post('/api/employees/:id/update', updateEmployee);

// Delete employee
const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete employee.' });
  }
};
app.delete('/api/employees/:id', deleteEmployee);
app.post('/api/employees/:id/delete', deleteEmployee);


// ================= EXPENSE ROUTES =================

// Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await db.query(`
      SELECT ex.*, e.employee_name
      FROM expenses ex
      LEFT JOIN employees e ON ex.employee_id = e.id
      ORDER BY ex.expense_date DESC, ex.id DESC
    `);
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expenses.' });
  }
});

// Add an expense
app.post('/api/expenses', async (req, res) => {
  const { expenseName, category, amount, expenseDate, employeeId } = req.body;
  if (!expenseName || !category || !amount || !expenseDate) {
    return res.status(400).json({ error: 'All fields except employee are required.' });
  }
  try {
    await db.query(
      'INSERT INTO expenses (expense_name, category, amount, expense_date, employee_id) VALUES (?, ?, ?, ?, ?)',
      [expenseName, category, parseFloat(amount), expenseDate, employeeId ? parseInt(employeeId) : null]
    );
    res.status(201).json({ message: 'Expense logged successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to log expense.' });
  }
});

// Update expense
const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { expenseName, category, amount, expenseDate, employeeId } = req.body;
  if (!expenseName || !category || !amount || !expenseDate) {
    return res.status(400).json({ error: 'All fields except employee are required.' });
  }
  try {
    await db.query(
      'UPDATE expenses SET expense_name = ?, category = ?, amount = ?, expense_date = ?, employee_id = ? WHERE id = ?',
      [expenseName, category, parseFloat(amount), expenseDate, employeeId ? parseInt(employeeId) : null, id]
    );
    res.json({ message: 'Expense updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update expense.' });
  }
};
app.put('/api/expenses/:id', updateExpense);
app.post('/api/expenses/:id/update', updateExpense);

// Delete expense
const deleteExpense = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete expense.' });
  }
};
app.delete('/api/expenses/:id', deleteExpense);
app.post('/api/expenses/:id/delete', deleteExpense);


// ================= PROJECT ASSIGNMENT ROUTES =================

// Get all project assignments
app.get('/api/project-assignments', async (req, res) => {
  try {
    const assignments = await db.query(`
      SELECT pa.*, e.employee_name, c.customer_name, c.customer_id_seq, c.project_brief
      FROM project_assignments pa
      JOIN employees e ON pa.employee_id = e.id
      JOIN customers c ON pa.customer_id = c.id
      ORDER BY pa.id DESC
    `);
    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch project assignments.' });
  }
});

// Save project assignment
app.post('/api/project-assignments', async (req, res) => {
  const { employeeId, customerId, assignedRole, assignedDate, notes } = req.body;

  if (!employeeId || !customerId || !assignedDate) {
    return res.status(400).json({ error: 'Employee, Project/Customer, and Assignment Date are required.' });
  }

  try {
    // Check if duplicate assignment exists
    const existing = await db.query(
      'SELECT id FROM project_assignments WHERE employee_id = ? AND customer_id = ?',
      [parseInt(employeeId), parseInt(customerId)]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'This employee is already assigned to this project.' });
    }

    const result = await db.query(
      'INSERT INTO project_assignments (employee_id, customer_id, assigned_role, assigned_date, notes) VALUES (?, ?, ?, ?, ?)',
      [parseInt(employeeId), parseInt(customerId), assignedRole || 'Developer', assignedDate, notes || null]
    );

    res.status(201).json({ id: result.insertId, message: 'Employee assigned to project successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to assign employee to project.' });
  }
});

// Update project assignment
const updateProjectAssignment = async (req, res) => {
  const { id } = req.params;
  const { employeeId, customerId, assignedRole, assignedDate, notes } = req.body;

  if (!employeeId || !customerId || !assignedDate) {
    return res.status(400).json({ error: 'Employee, Project/Customer, and Assignment Date are required.' });
  }

  try {
    // Check duplicate assignment excluding the current one
    const existing = await db.query(
      'SELECT id FROM project_assignments WHERE employee_id = ? AND customer_id = ? AND id != ?',
      [parseInt(employeeId), parseInt(customerId), id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'This employee is already assigned to this project.' });
    }

    await db.query(
      'UPDATE project_assignments SET employee_id = ?, customer_id = ?, assigned_role = ?, assigned_date = ?, notes = ? WHERE id = ?',
      [parseInt(employeeId), parseInt(customerId), assignedRole || 'Developer', assignedDate, notes || null, id]
    );

    res.json({ message: 'Project assignment updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update project assignment.' });
  }
};
app.put('/api/project-assignments/:id', updateProjectAssignment);
app.post('/api/project-assignments/:id/update', updateProjectAssignment);

// Delete project assignment
const deleteProjectAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM project_assignments WHERE id = ?', [id]);
    res.json({ message: 'Project assignment removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete project assignment.' });
  }
};
app.delete('/api/project-assignments/:id', deleteProjectAssignment);
app.post('/api/project-assignments/:id/delete', deleteProjectAssignment);


// ================= GLOBAL ERROR HANDLING =================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error.' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Express Backend Server is running on port ${PORT}`);
  });
}

module.exports = app;
