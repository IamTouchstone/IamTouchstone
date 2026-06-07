import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch"; // Use standard node-fetch inside Cursor
import sqlite3 from "./sqliteMock.js";

// Load configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(process.cwd(), "..", "..", "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

// Boot SQL data layer
const sqlite3Verbose = sqlite3.verbose();
const clikkoDbPath = path.join(process.cwd(), "database.db");
const clikkoDb = new sqlite3Verbose.Database(clikkoDbPath);

clikkoDb.serialize(() => {
  clikkoDb.run(`CREATE TABLE IF NOT EXISTS org (id INTEGER PRIMARY KEY, name TEXT, type TEXT, openTime TEXT, closeTime TEXT)`);
  clikkoDb.run(`CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, bankCode TEXT, salary REAL, pin TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  clikkoDb.run(`CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER, type TEXT, time DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(staff_id) REFERENCES staff(id))`);
  clikkoDb.run(`CREATE TABLE IF NOT EXISTS leave_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_name TEXT, date TEXT, reason TEXT, status TEXT DEFAULT 'Pending')`);
  clikkoDb.run(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER, staff_name TEXT, amount REAL, account TEXT, bankCode TEXT, days INTEGER, hours INTEGER, status TEXT, time DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(staff_id) REFERENCES staff(id))`);
});

const CLIKKO_TEMPLATES: Record<string, string[]> = {
  'Supermarket': ['Cashier', 'Shelf Attendant', 'Security', 'Manager', 'Cleaner'],
  'Retail Shop': ['Cashier', 'Sales Rep', 'Manager', 'Cleaner'],
  'Restaurant': ['Chef', 'Waiter', 'Cashier', 'Cleaner'],
  'School': ['Teacher', 'Admin', 'Security', 'Cleaner'],
  'Clinic': ['Nurse', 'Doctor', 'Receptionist', 'Cleaner'],
  'Custom': []
};

// --- CORE ENDPOINTS ---

// Fetch current organization attributes
app.get('/api/clikko/org', (req, res) => {
  clikkoDb.get('SELECT * FROM org LIMIT 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || null);
  });
});

// Update organization hours
app.put('/api/clikko/org', (req, res) => {
  const { openTime, closeTime } = req.body;
  clikkoDb.run('UPDATE org SET openTime = ?, closeTime = ?', [openTime, closeTime], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Reset all organization data (logout)
app.delete('/api/clikko/org', (req, res) => {
  clikkoDb.serialize(() => {
    clikkoDb.run('DELETE FROM payments');
    clikkoDb.run('DELETE FROM leave_requests');
    clikkoDb.run('DELETE FROM attendance');
    clikkoDb.run('DELETE FROM staff');
    clikkoDb.run('DELETE FROM org', (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

// Create/Reset organization setting
app.post('/api/clikko/org', (req, res) => {
  const { name, type, openTime, closeTime } = req.body;
  clikkoDb.run('DELETE FROM org', [], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    clikkoDb.run('INSERT INTO org (name, type, openTime, closeTime) VALUES (?,?,?,?)', [name, type, openTime, closeTime], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const roles = CLIKKO_TEMPLATES[type as string] || [];
      if (roles.length > 0) {
        const stmt = clikkoDb.prepare('INSERT INTO staff (name, pin, salary, bankCode, phone) VALUES (?,?,?,?,?)');
        roles.forEach((post) => {
          stmt.run(post, '0000', 150000, '044', '1234567890');
        });
        stmt.finalize((err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        });
      } else {
        res.json({ success: true });
      }
    });
  });
});

// Fetch all staff members 
app.get('/api/clikko/staff', (req, res) => {
  clikkoDb.all('SELECT * FROM staff', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Create a custom staff profile
app.post('/api/clikko/staff', (req, res) => {
  const { name, phone, bankCode, salary, pin } = req.body;
  clikkoDb.run('INSERT INTO staff (name, phone, bankCode, salary, pin) VALUES (?,?,?,?,?)', [name, phone, bankCode, salary, pin], function(this: { lastID: number }, err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Record smart clock-in/out
app.post('/api/clikko/clock', (req, res) => {
  const { pin } = req.body;
  clikkoDb.get('SELECT * FROM staff WHERE pin = ?', [pin], (err, staff: any) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!staff) return res.status(404).json({ error: 'Invalid PIN' });
    
    clikkoDb.get('SELECT * FROM attendance WHERE staff_id = ? ORDER BY time DESC LIMIT 1', [staff.id], (err, last: any) => {
      if (err) return res.status(500).json({ error: err.message });
      const type = !last || last.type === 'out' ? 'in' : 'out';
      
      clikkoDb.run('INSERT INTO attendance (staff_id, type) VALUES (?,?)', [staff.id, type], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ name: staff.name, type, time: new Date().toLocaleTimeString() });
      });
    });
  });
});

// Retrieve today's attendance roster
app.get('/api/clikko/attendance/today', (req, res) => {
  clikkoDb.all(`SELECT s.name, a.type, a.time FROM attendance a JOIN staff s ON s.id = a.staff_id WHERE date(a.time) = date('now')`, [], (err, rows) => {
    if (err) {
      const todayStr = new Date().toISOString().split('T')[0];
      clikkoDb.all(`SELECT s.name, a.type, a.time FROM attendance a JOIN staff s ON s.id = a.staff_id WHERE date(a.time) = ? OR a.time LIKE ?`, [todayStr, `${todayStr}%`], (err2, rows2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json(rows2 || []);
      });
    } else {
      res.json(rows || []);
    }
  });
});

// Leave log lists
app.get('/api/clikko/leave', (req, res) => {
  clikkoDb.all('SELECT * FROM leave_requests ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// File leave requests
app.post('/api/clikko/leave', (req, res) => {
  const { staff_name, date, reason } = req.body;
  clikkoDb.run('INSERT INTO leave_requests (staff_name, date, reason) VALUES (?,?,?)', [staff_name, date, reason], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Approve/Deny a leave request
app.put('/api/clikko/leave/:id', (req, res) => {
  clikkoDb.run('UPDATE leave_requests SET status = ? WHERE id = ?', [req.body.status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Transfer payroll and check status with local fallback synchronization
app.post('/api/clikko/pay', async (req, res) => {
  const { staffId, staffName, amount, accountNumber, bankCode, days, hours } = req.body;
  try {
    const espeesUrl = process.env.ESPEES_API_URL || 'https://api.espees.com/v1';
    const espeesKey = process.env.ESPEES_API_KEY;
    
    let status = 'Failed';
    let result: any = { message: 'Offline mode simulation payment recorded' };
    
    if (espeesKey && espeesKey !== 'PASTE_YOUR_ESPEES_API_KEY_HERE') {
      const response = await fetch(espeesUrl + '/transfer', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${espeesKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, recipient_account: accountNumber, bank_code: bankCode, narration: `Clikko Payroll - ${staffName}` })
      });
      result = await response.json() as any;
      status = result.status === 'success' ? 'Success' : 'Failed';
    } else {
      status = 'Success';
    }

    clikkoDb.run('INSERT INTO payments (staff_id, staff_name, amount, account, bankCode, days, hours, status) VALUES (?,?,?,?,?,?,?,?)',
      [staffId, staffName, amount, accountNumber, bankCode, days, hours, status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: status === 'Success', data: result });
      });
  } catch (error: any) {
    clikkoDb.run('INSERT INTO payments (staff_id, staff_name, amount, account, bankCode, days, hours, status) VALUES (?,?,?,?,?,?,?,?)',
      [staffId, staffName, amount, accountNumber, bankCode, days, hours, 'Failed'], (err) => {
        res.status(500).json({ error: error.message });
      });
  }
});

// Fetch payroll payment logs
app.get('/api/clikko/payments', (req, res) => {
  clikkoDb.all('SELECT * FROM payments ORDER BY time DESC LIMIT 100', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Clikko Backend database server online at http://localhost:${PORT}`);
});
