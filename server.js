require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./database.db');

const TEMPLATES = {
  'Supermarket': ['Cashier', 'Shelf Attendant', 'Security', 'Manager', 'Cleaner'],
  'Retail Shop': ['Cashier', 'Sales Rep', 'Manager', 'Cleaner'],
  'Restaurant': ['Chef', 'Waiter', 'Cashier', 'Cleaner'],
  'School': ['Teacher', 'Admin', 'Security', 'Cleaner'],
  'Clinic': ['Nurse', 'Doctor', 'Receptionist', 'Cleaner'],
  'Custom': []
};

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS org (id INTEGER PRIMARY KEY, name TEXT, type TEXT, openTime TEXT, closeTime TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, bankCode TEXT, salary REAL, pin TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  db.run(`CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER, type TEXT, time DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(staff_id) REFERENCES staff(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS leave_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_name TEXT, date TEXT, reason TEXT, status TEXT DEFAULT 'Pending')`);
  db.run(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, staff_id INTEGER, staff_name TEXT, amount REAL, account TEXT, bankCode TEXT, days INTEGER, hours INTEGER, status TEXT, time DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(staff_id) REFERENCES staff(id))`);
});

// API Routes
app.get('/api/org', (req, res) => db.get('SELECT * FROM org LIMIT 1', (err, row) => res.json(row || null)));

app.post('/api/org', (req, res) => {
  const { name, type, openTime, closeTime } = req.body;
  db.run('DELETE FROM org');
  db.run('INSERT INTO org (name, type, openTime, closeTime) VALUES (?,?,?,?)', [name, type, openTime, closeTime], function() {
    const stmt = db.prepare('INSERT INTO staff (name, pin) VALUES (?,?)');
    TEMPLATES[type].forEach((post) => stmt.run(post, '0000'));
    stmt.finalize();
    res.json({ success: true });
  });
});

app.get('/api/staff', (req, res) => db.all('SELECT * FROM staff', (err, rows) => res.json(rows)));

app.post('/api/staff', (req, res) => {
  const { name, phone, bankCode, salary, pin } = req.body;
  db.run('INSERT INTO staff (name, phone, bankCode, salary, pin) VALUES (?,?,?,?,?)', [name, phone, bankCode, salary, pin], function() {
    res.json({ id: this.lastID });
  });
});

app.post('/api/clock', (req, res) => {
  const { pin } = req.body;
  db.get('SELECT * FROM staff WHERE pin = ?', [pin], (err, staff) => {
    if (!staff) return res.status(404).json({ error: 'Invalid PIN' });
    db.get('SELECT * FROM attendance WHERE staff_id = ? ORDER BY time DESC LIMIT 1', [staff.id], (err, last) => {
      const type = !last || last.type === 'out' ? 'in' : 'out';
      db.run('INSERT INTO attendance (staff_id, type) VALUES (?,?)', [staff.id, type], function() {
        res.json({ name: staff.name, type, time: new Date().toLocaleTimeString() });
      });
    });
  });
});

app.get('/api/attendance/today', (req, res) => {
  db.all(`SELECT s.name, a.type, a.time FROM attendance a JOIN staff s ON s.id = a.staff_id WHERE date(a.time) = date('now')`, (err, rows) => res.json(rows));
});

app.get('/api/leave', (req, res) => db.all('SELECT * FROM leave_requests ORDER BY id DESC', (err, rows) => res.json(rows)));

app.post('/api/leave', (req, res) => {
  const { staff_name, date, reason } = req.body;
  db.run('INSERT INTO leave_requests (staff_name, date, reason) VALUES (?,?,?)', [staff_name, date, reason], () => res.json({ success: true }));
});

app.put('/api/leave/:id', (req, res) => {
  db.run('UPDATE leave_requests SET status = ? WHERE id = ?', [req.body.status, req.params.id], () => res.json({ success: true }));
});

// Payment + History
app.post('/api/pay', async (req, res) => {
  const { staffId, staffName, amount, accountNumber, bankCode, days, hours } = req.body;
  try {
    const response = await fetch(process.env.ESPEES_API_URL + '/transfer', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.ESPEES_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, recipient_account: accountNumber, bank_code: bankCode, narration: `Clikko Payroll - ${staffName}` })
    });
    const result = await response.json();
    const status = result.status === 'success' ? 'Success' : 'Failed';

    db.run('INSERT INTO payments (staff_id, staff_name, amount, account, bankCode, days, hours, status) VALUES (?,?,?,?,?,?,?,?)',
      [staffId, staffName, amount, accountNumber, bankCode, days, hours, status]);

    res.json({ success: status === 'Success', data: result });
  } catch (error) {
    db.run('INSERT INTO payments (staff_id, staff_name, amount, account, bankCode, days, hours, status) VALUES (?,?,?,?,?,?,?,?)',
      [staffId, staffName, amount, accountNumber, bankCode, days, hours, 'Failed']);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments', (req, res) => {
  db.all('SELECT * FROM payments ORDER BY time DESC LIMIT 100', (err, rows) => res.json(rows));
});

// Settings update
app.put('/api/org', (req, res) => {
  const { openTime, closeTime } = req.body;
  db.run('UPDATE org SET openTime = ?, closeTime = ?', [openTime, closeTime], () => res.json({ success: true }));
});

app.listen(PORT, () => console.log(`Clikko running on http://localhost:${PORT}`));
