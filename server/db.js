const mysql = require('mysql2/promise');

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DB_TARGET = process.env.DB_NAME || 'acbilling_db';

let pool;

async function initializeDatabase() {
  try {
    // If running on Vercel or DB_NAME is set, connect directly to the database and skip CREATE DATABASE query
    if (process.env.VERCEL || process.env.DB_NAME) {
      pool = mysql.createPool({
        ...config,
        database: DB_TARGET,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true
      });
      console.log(`Connected to cloud database: "${DB_TARGET}"`);
    } else {
      // Local development fallback: Connect without database first and create it if not exists
      const connection = await mysql.createConnection(config);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_TARGET}\`;`);
      await connection.end();

      pool = mysql.createPool({
        ...config,
        database: DB_TARGET,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        dateStrings: true
      });
      console.log(`Connected to local database: "${DB_TARGET}"`);
    }

    await createTables();
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    throw error;
  }
}

async function createTables() {
  // Let's drop old dental tables if they exist in the new database (just in case)
  await pool.query('DROP TABLE IF EXISTS appointments, treatments, patients, doctors;');

  // 1. Leads table (Project managers / Leads)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      lead_name VARCHAR(100) NOT NULL,
      role VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed leads
  const [leadsCount] = await pool.query('SELECT COUNT(*) as count FROM leads');
  if (leadsCount[0].count === 0) {
    try {
      await pool.query(`
        INSERT INTO leads (lead_name, role) VALUES 
        ('Kundavai AC Tec', 'Project Director'),
        ('Priya Patel', 'Tech Lead Developer'),
        ('Rajesh Varma', 'Digital Marketing Director')
      `);
      console.log('Seeded initial PM leads data.');
    } catch (err) {
      console.error('Error seeding leads:', err.message);
    }
  }

  // 2. Customers table (Client accounts)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id_seq VARCHAR(20) UNIQUE NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      mobile_number VARCHAR(15) NOT NULL,
      email VARCHAR(100),
      pincode VARCHAR(10),
      city VARCHAR(50),
      address TEXT,
      assigned_lead VARCHAR(100) DEFAULT 'Kundavai AC Tec',
      project_brief TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed customers
  const [custCount] = await pool.query('SELECT COUNT(*) as count FROM customers');
  if (custCount[0].count === 0) {
    try {
      await pool.query(`
        INSERT INTO customers (customer_id_seq, customer_name, mobile_number, email, city, project_brief, assigned_lead) VALUES 
        ('C-101', 'Karan Johar', '9876543210', 'karan@dharma.com', 'Mumbai', 'E-commerce platform with Stripe payment gateway integration.', 'Kundavai AC Tec'),
        ('C-102', 'Simran Kaur', '8765432109', 'simran@bakery.com', 'Delhi', 'SEO audit and Google search rankings optimization campaign.', 'Priya Patel'),
        ('C-103', 'Rahul Sharma', '7654321098', 'rahul@sharmatech.com', 'Bangalore', 'Full social media marketing handling and weekly PPC ad ads.', 'Rajesh Varma')
      `);
      console.log('Seeded initial customers data.');
    } catch (err) {
      console.error('Error seeding customers:', err.message);
    }
  }

  // 3. Services table (Agency catalog)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_code VARCHAR(20) UNIQUE NOT NULL,
      service_name VARCHAR(100) NOT NULL,
      cost DECIMAL(10, 2) NOT NULL,
      timeline VARCHAR(30) DEFAULT '2 weeks'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed services
  const [servCount] = await pool.query('SELECT COUNT(*) as count FROM services');
  if (servCount[0].count === 0) {
    try {
      await pool.query(`
        INSERT INTO services (service_code, service_name, cost, timeline) VALUES 
        ('S-101', 'E-commerce Website Development', 85000.00, '4 weeks'),
        ('S-102', 'SEO Audit & Optimization', 25000.00, '2 weeks'),
        ('S-103', 'Social Media Marketing Campaign', 35000.00, '4 weeks'),
        ('S-104', 'Pay-Per-Click (PPC) Advertising', 45000.00, '3 weeks'),
        ('S-105', 'Custom UI/UX Mobile Design', 30000.00, '2 weeks'),
        ('S-106', 'Corporate Website Redesign', 50000.00, '3 weeks')
      `);
      console.log('Seeded initial services catalog.');
    } catch (err) {
      console.error('Error seeding services:', err.message);
    }
  }

  // 4. Meetings table (Client meeting logs)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meetings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      meeting_date DATE NOT NULL,
      meeting_time VARCHAR(20) NOT NULL,
      agenda VARCHAR(255) NOT NULL,
      lead_name VARCHAR(100) NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed meetings
  const [meetCount] = await pool.query('SELECT COUNT(*) as count FROM meetings');
  if (meetCount[0].count === 0) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await pool.query(`
        INSERT INTO meetings (customer_id, meeting_date, meeting_time, agenda, lead_name) VALUES 
        (1, ?, '10:00 AM', 'Initial design brief & payment terms setup', 'Kundavai AC Tec'),
        (2, ?, '11:30 AM', 'Review keyword reports and site indexing blockers', 'Priya Patel'),
        (3, ?, '02:00 PM', 'Consultation on Instagram ads and campaign ROI', 'Rajesh Varma')
      `, [today, today, today]);
      console.log('Seeded initial meetings list.');
    } catch (err) {
      console.error('Error seeding meetings:', err.message);
    }
  }

  // 5. Invoices table (Agency invoices)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_no VARCHAR(20) UNIQUE NOT NULL,
      customer_id_seq VARCHAR(20) NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      service_name VARCHAR(255) NOT NULL, -- Summary description
      items TEXT NOT NULL, -- Stringified JSON array of line items
      amount DECIMAL(10, 2) NOT NULL, -- Total invoice amount
      advance_paid DECIMAL(10, 2) DEFAULT 0.00, -- Advance payment made
      advance_payment_date DATE DEFAULT NULL, -- Date advance payment was received
      final_payment_date DATE DEFAULT NULL, -- Date final payment was received / completed
      payments_history TEXT DEFAULT NULL, -- JSON array of payments history
      gst_rate DECIMAL(5, 2) DEFAULT 18.00, -- GST rate percentage
      status VARCHAR(20) DEFAULT 'Paid',
      invoice_date DATE NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure advance_paid column exists in invoices
  try {
    const cols = await pool.query("SHOW COLUMNS FROM invoices LIKE 'advance_paid'");
    if (cols[0].length === 0) {
      await pool.query('ALTER TABLE invoices ADD COLUMN advance_paid DECIMAL(10, 2) DEFAULT 0.00 AFTER amount');
      console.log('Database migrated: added advance_paid column to invoices table.');
    }
  } catch (err) {
    console.error('Error adding advance_paid column during migration:', err.message);
  }

  // Ensure advance_payment_date column exists in invoices
  try {
    const cols = await pool.query("SHOW COLUMNS FROM invoices LIKE 'advance_payment_date'");
    if (cols[0].length === 0) {
      await pool.query('ALTER TABLE invoices ADD COLUMN advance_payment_date DATE DEFAULT NULL AFTER advance_paid');
      console.log('Database migrated: added advance_payment_date column to invoices table.');
    }
  } catch (err) {
    console.error('Error adding advance_payment_date column during migration:', err.message);
  }

  // Ensure final_payment_date column exists in invoices
  try {
    const cols = await pool.query("SHOW COLUMNS FROM invoices LIKE 'final_payment_date'");
    if (cols[0].length === 0) {
      await pool.query('ALTER TABLE invoices ADD COLUMN final_payment_date DATE DEFAULT NULL AFTER advance_payment_date');
      console.log('Database migrated: added final_payment_date column to invoices table.');
    }
  } catch (err) {
    console.error('Error adding final_payment_date column during migration:', err.message);
  }

  // Ensure payments_history column exists in invoices
  try {
    const cols = await pool.query("SHOW COLUMNS FROM invoices LIKE 'payments_history'");
    if (cols[0].length === 0) {
      await pool.query('ALTER TABLE invoices ADD COLUMN payments_history TEXT DEFAULT NULL AFTER final_payment_date');
      console.log('Database migrated: added payments_history column to invoices table.');
    }
  } catch (err) {
    console.error('Error adding payments_history column during migration:', err.message);
  }

  // Ensure gst_rate column exists in invoices
  try {
    const cols = await pool.query("SHOW COLUMNS FROM invoices LIKE 'gst_rate'");
    if (cols[0].length === 0) {
      await pool.query('ALTER TABLE invoices ADD COLUMN gst_rate DECIMAL(5, 2) DEFAULT 18.00 AFTER advance_payment_date');
      console.log('Database migrated: added gst_rate column to invoices table.');
    }
  } catch (err) {
    console.error('Error adding gst_rate column during migration:', err.message);
  }

  // Seed invoices
  const [invCount] = await pool.query('SELECT COUNT(*) as count FROM invoices');
  if (invCount[0].count === 0) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      const items1 = JSON.stringify([
        { title: 'E-commerce Website Development', description: 'Complete shop setup, cart integration, and custom checkout flow', rate: 85000.00, qty: 1, amount: 85000.00 }
      ]);
      const items2 = JSON.stringify([
        { title: 'SEO Audit & Optimization', description: 'Technical site health check, keywords mapping, and speed optimization', rate: 25000.00, qty: 1, amount: 25000.00 }
      ]);
      const items3 = JSON.stringify([
        { title: 'Social Media Marketing Campaign', description: 'Facebook and Instagram monthly ad spend and posts scheduling management', rate: 35000.00, qty: 1, amount: 35000.00 }
      ]);

      await pool.query(`
        INSERT INTO invoices (invoice_no, customer_id_seq, customer_name, service_name, items, amount, status, invoice_date) VALUES 
        ('INV-1001', 'C-101', 'Karan Johar', 'E-commerce Website Development', ?, 85000.00, 'Paid', ?),
        ('INV-1002', 'C-102', 'Simran Kaur', 'SEO Audit & Optimization', ?, 25000.00, 'Unpaid', ?),
        ('INV-1003', 'C-103', 'Rahul Sharma', 'Social Media Marketing Campaign', ?, 35000.00, 'Pending', ?)
      `, [items1, today, items2, today, items3, today]);
      console.log('Seeded initial agency invoices data.');
    } catch (err) {
      console.error('Error seeding invoices:', err.message);
    }
  }

  // 6. Employees table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      address TEXT NOT NULL,
      salary DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed employees
  const [empCount] = await pool.query('SELECT COUNT(*) as count FROM employees');
  if (empCount[0].count === 0) {
    try {
      await pool.query(`
        INSERT INTO employees (employee_name, phone_number, address, salary) VALUES 
        ('Rajesh Kumar', '+91 98765 43210', '12, MG Road, Bangalore', 35000.00),
        ('Ananya Sen', '+91 87654 32109', '45, Indiranagar, Bangalore', 42000.00)
      `);
      console.log('Seeded initial employees data.');
    } catch (err) {
      console.error('Error seeding employees:', err.message);
    }
  }

  // 7. Expenses table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      expense_name VARCHAR(150) NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      expense_date DATE NOT NULL,
      employee_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed expenses
  const [expCount] = await pool.query('SELECT COUNT(*) as count FROM expenses');
  if (expCount[0].count === 0) {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      await pool.query(`
        INSERT INTO expenses (expense_name, category, amount, expense_date, employee_id) VALUES 
        ('Paid Rajesh Kumar June Salary', 'Salary', 35000.00, ?, 1),
        ('Google Search Ads - June Campaign', 'Ads', 15000.00, ?, NULL),
        ('Office Rent - June', 'Rent', 25000.00, ?, NULL)
      `, [todayStr, todayStr, todayStr]);
      console.log('Seeded initial expenses data.');
    } catch (err) {
      console.error('Error seeding expenses:', err.message);
    }
  }

  // 8. Project Assignments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_id INT NOT NULL,
      customer_id INT NOT NULL,
      assigned_role VARCHAR(100) DEFAULT 'Developer',
      assigned_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_emp_cust (employee_id, customer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Seed project assignments
  const [assignCount] = await pool.query('SELECT COUNT(*) as count FROM project_assignments');
  if (assignCount[0].count === 0) {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const [emps] = await pool.query('SELECT id FROM employees LIMIT 2');
      const [custs] = await pool.query('SELECT id FROM customers LIMIT 3');
      
      if (emps.length > 0 && custs.length > 0) {
        const emp1 = emps[0].id;
        const emp2 = emps[1] ? emps[1].id : emps[0].id;
        const cust1 = custs[0].id;
        const cust2 = custs[1] ? custs[1].id : custs[0].id;
        const cust3 = custs[2] ? custs[2].id : custs[0].id;

        await pool.query(`
          INSERT IGNORE INTO project_assignments (employee_id, customer_id, assigned_role, assigned_date, notes) VALUES 
          (?, ?, 'Frontend Developer', ?, 'Tasked with setting up Stripe payments UI.'),
          (?, ?, 'Senior SEO Specialist', ?, 'Handling technical SEO crawl fixes and optimizations.'),
          (?, ?, 'QA Engineer', ?, 'Verifying post updates and tracking link conversions.')
        `, [emp1, cust1, todayStr, emp2, cust2, todayStr, emp1, cust3, todayStr]);
        console.log('Seeded initial project assignments.');
      }
    } catch (err) {
      console.error('Error seeding project assignments:', err.message);
    }
  }
}

// Wrapper for query execution
async function query(sql, params) {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  const [results] = await pool.query(sql, params);
  return results;
}

module.exports = {
  initializeDatabase,
  query,
  DB_TARGET,
};
