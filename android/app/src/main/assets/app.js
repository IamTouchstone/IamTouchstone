let org = null;
let staffList = [];
let html5QrCode = null;
let payPreview = {};

async function api(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  return res.json();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'dashboard') updateDashboard();
  if (id === 'staff') renderStaff();
  if (id === 'leave') renderLeave();
  if (id === 'settings') loadSettings();
  if (id === 'payments') renderPayments();
}

async function init() {
  org = await api('/api/org');
  if (org) {
    document.getElementById('org-title').innerText = org.name;
    showScreen('dashboard');
    updateDashboard();
  }
}

async function createOrg() {
  const name = document.getElementById('org-name').value;
  const type = document.getElementById('org-type').value;
  const open = document.getElementById('open-time').value;
  const close = document.getElementById('close-time').value;
  if (!name) return alert('Enter organization name');
  await api('/api/org', { method: 'POST', body: JSON.stringify({ name, type, openTime: open, closeTime: close }) });
  location.reload();
}

async function updateDashboard() {
  const today = await api('/api/attendance/today');
  const present = new Set(today.filter(t => t.type === 'in').map(t => t.name)).size;
  const late = today.filter(t => {
    if (t.type !== 'in') return false;
    const timeStr = new Date(t.time).toTimeString().slice(0, 5);
    return org && org.openTime && timeStr > org.openTime;
  }).length;
  staffList = await api('/api/staff');
  document.getElementById('present-count').innerText = present;
  document.getElementById('late-count').innerText = late;
  document.getElementById('absent-count').innerText = Math.max(0, staffList.length - present);
}

function logout() {
  if (confirm('Reset organization? All data will be cleared.')) {
    fetch('/api/org', { method: 'DELETE' })
      .catch(() => {})
      .finally(() => location.reload());
  }
}

// ─── Clock In / Out ───────────────────────────────────────────────────────────

function startPinMode() {
  document.getElementById('pin-mode').style.display = 'block';
  document.getElementById('qr-mode').style.display = 'none';
  stopQRMode();
}

function startQRMode() {
  document.getElementById('pin-mode').style.display = 'none';
  document.getElementById('qr-mode').style.display = 'block';
  html5QrCode = new Html5Qrcode("qr-reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      if (decodedText.startsWith('CLIKKO|')) {
        clockInOutWithPin(decodedText.split('|')[2]);
        html5QrCode.stop();
        setTimeout(() => startQRMode(), 2000);
      }
    },
    () => {}
  ).catch(() => { alert('Camera access denied'); startPinMode(); });
}

function stopQRMode() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
    html5QrCode = null;
  }
}

function clockInOut() {
  clockInOutWithPin(document.getElementById('pin-input').value);
  document.getElementById('pin-input').value = '';
}

async function clockInOutWithPin(pin) {
  const result = await api('/api/clock', { method: 'POST', body: JSON.stringify({ pin }) });
  const div = document.getElementById('clock-result');
  if (result.error) {
    div.style.display = 'block';
    div.style.background = '#fee2e2';
    div.innerText = result.error;
  } else {
    div.style.display = 'block';
    div.style.background = '#dcfce7';
    div.innerText = `${result.name} clocked ${result.type} at ${result.time}`;
  }
}

// ─── Staff ────────────────────────────────────────────────────────────────────

async function addStaff() {
  const name = document.getElementById('staff-name').value.trim();
  const phone = document.getElementById('staff-phone').value.trim();
  const bankCode = document.getElementById('staff-bank').value;
  const salary = parseFloat(document.getElementById('staff-salary').value) || 0;
  const pin = document.getElementById('staff-pin').value;
  if (!name || !pin || !bankCode || pin.length !== 4) return alert('Enter name, bank account, bank, and a 4-digit PIN');
  await api('/api/staff', { method: 'POST', body: JSON.stringify({ name, phone, bankCode, salary, pin }) });
  renderStaff();
  document.getElementById('staff-name').value = '';
  document.getElementById('staff-phone').value = '';
  document.getElementById('staff-bank').value = '';
  document.getElementById('staff-salary').value = '';
  document.getElementById('staff-pin').value = '';
}

async function renderStaff() {
  staffList = await api('/api/staff');
  const bankNames = {
    '044': 'Access', '063': 'Access Diamond', '050': 'Ecobank', '070': 'Fidelity',
    '011': 'First Bank', '214': 'FCMB', '058': 'GTB', '030': 'Heritage',
    '301': 'Jaiz', '082': 'Keystone', '076': 'Polaris', '221': 'Stanbic',
    '232': 'Sterling', '100': 'SunTrust', '032': 'Union', '033': 'UBA',
    '215': 'Unity', '035': 'Wema', '057': 'Zenith'
  };
  document.getElementById('staff-list').innerHTML = staffList.map(s => {
    const bank = bankNames[s.bankCode] || 'No bank';
    return `<div class="staff-item">
      <b>${s.name}</b> — PIN: ${s.pin} — ${bank} — ₦${(s.salary || 0).toLocaleString()}
      <button onclick="showQR(${s.id})" style="width:auto;padding:6px 12px;margin-left:10px;font-size:13px;">QR</button>
    </div>`;
  }).join('');
}

function showQR(staffId) {
  const s = staffList.find(x => x.id === staffId);
  if (!s) return;
  document.getElementById('qr-staff-name').innerText = s.name;
  document.getElementById('qr-staff-pin').innerText = `PIN: ${s.pin}`;
  const qrBox = document.getElementById('qr-box');
  qrBox.innerHTML = '';
  new QRCode(qrBox, { text: `CLIKKO|${s.id}|${s.pin}`, width: 200, height: 200 });
  showScreen('qr-modal');
}

function printQR() { window.print(); }

// ─── Payroll ──────────────────────────────────────────────────────────────────

async function generatePayroll() {
  staffList = await api('/api/staff');
  if (!staffList.length) {
    document.getElementById('payroll-list').innerHTML = '<p style="text-align:left;color:#64748b;">No staff found.</p>';
    return;
  }
  const bankNames = {
    '044': 'Access', '063': 'Access Diamond', '050': 'Ecobank', '070': 'Fidelity',
    '011': 'First Bank', '214': 'FCMB', '058': 'GTB', '030': 'Heritage',
    '301': 'Jaiz', '082': 'Keystone', '076': 'Polaris', '221': 'Stanbic',
    '232': 'Sterling', '100': 'SunTrust', '032': 'Union', '033': 'UBA',
    '215': 'Unity', '035': 'Wema', '057': 'Zenith'
  };
  document.getElementById('payroll-list').innerHTML = staffList.map(s => {
    const bank = bankNames[s.bankCode] || 'N/A';
    const salary = s.salary || 0;
    return `<div class="payroll-item">
      <b>${s.name}</b><br>
      <small>${bank} · Acct: ${s.phone || 'N/A'} · Monthly: ₦${salary.toLocaleString()}</small><br>
      <button class="pay-btn" onclick="openPayModal(${s.id})">Pay Now</button>
    </div>`;
  }).join('');
}

function openPayModal(staffId) {
  const s = staffList.find(x => x.id === staffId);
  if (!s) return;
  payPreview = { staffId: s.id, staffName: s.name, salary: s.salary || 0, accountNumber: s.phone, bankCode: s.bankCode };

  const bankNames = {
    '044': 'Access', '063': 'Access Diamond', '050': 'Ecobank', '070': 'Fidelity',
    '011': 'First Bank', '214': 'FCMB', '058': 'GTB', '030': 'Heritage',
    '301': 'Jaiz', '082': 'Keystone', '076': 'Polaris', '221': 'Stanbic',
    '232': 'Sterling', '100': 'SunTrust', '032': 'Union', '033': 'UBA',
    '215': 'Unity', '035': 'Wema', '057': 'Zenith'
  };
  const bank = bankNames[s.bankCode] || s.bankCode;

  document.getElementById('pay-preview').innerHTML = `
    <b>${s.name}</b><br>
    Bank: ${bank}<br>
    Account: ${s.phone || 'N/A'}<br>
    Monthly Salary: ₦${(s.salary || 0).toLocaleString()}
  `;

  document.getElementById('pay-days').value = 30;
  document.getElementById('pay-hours').value = 8;
  recalcPay();
  showScreen('payroll-modal');
}

function recalcPay() {
  const days = parseInt(document.getElementById('pay-days').value) || 0;
  const hours = parseInt(document.getElementById('pay-hours').value) || 0;
  const monthlySalary = payPreview.salary || 0;
  const ratePerHour = monthlySalary > 0 ? Math.round(monthlySalary / 30 / 8) : 0;
  const total = ratePerHour * hours * days;
  document.getElementById('pay-rate').innerText = ratePerHour.toLocaleString();
  document.getElementById('pay-total').innerText = total.toLocaleString();
  payPreview.days = days;
  payPreview.hours = hours;
  payPreview.amount = total;
}

async function confirmPay() {
  if (!payPreview.amount || payPreview.amount <= 0) return alert('Amount must be greater than 0');
  if (!payPreview.accountNumber) return alert('This staff has no account number on file');
  if (!confirm(`Pay ₦${payPreview.amount.toLocaleString()} to ${payPreview.staffName}?`)) return;

  const btn = document.querySelector('#payroll-modal button');
  btn.innerText = 'Processing...';
  btn.disabled = true;

  try {
    const result = await api('/api/pay', {
      method: 'POST',
      body: JSON.stringify({
        staffId: payPreview.staffId,
        staffName: payPreview.staffName,
        amount: payPreview.amount,
        accountNumber: payPreview.accountNumber,
        bankCode: payPreview.bankCode,
        days: payPreview.days,
        hours: payPreview.hours
      })
    });
    if (result.success) {
      alert(`✅ Payment successful for ${payPreview.staffName}`);
    } else {
      alert(`❌ Payment failed: ${result.error || 'Unknown error'}`);
    }
  } catch (e) {
    alert('Payment error: ' + e.message);
  }

  btn.innerText = 'Confirm & Pay';
  btn.disabled = false;
  showScreen('payroll');
}

// ─── Payment History ──────────────────────────────────────────────────────────

async function renderPayments() {
  const payments = await api('/api/payments');
  const bankNames = {
    '044': 'Access', '063': 'Access Diamond', '050': 'Ecobank', '070': 'Fidelity',
    '011': 'First Bank', '214': 'FCMB', '058': 'GTB', '030': 'Heritage',
    '301': 'Jaiz', '082': 'Keystone', '076': 'Polaris', '221': 'Stanbic',
    '232': 'Sterling', '100': 'SunTrust', '032': 'Union', '033': 'UBA',
    '215': 'Unity', '035': 'Wema', '057': 'Zenith'
  };
  if (!payments.length) {
    document.getElementById('payments-list').innerHTML = '<p style="text-align:left;color:#64748b;">No payments yet.</p>';
    return;
  }
  document.getElementById('payments-list').innerHTML = payments.map(p => {
    const statusClass = p.status === 'Success' ? 'success' : p.status === 'Failed' ? 'failed' : 'pending';
    const bank = bankNames[p.bankCode] || p.bankCode || 'N/A';
    const date = p.time ? new Date(p.time).toLocaleString() : 'N/A';
    return `<div class="payment-item ${statusClass}">
      <b>${p.staff_name}</b> — ₦${(p.amount || 0).toLocaleString()}
      <span class="badge ${statusClass}">${p.status}</span><br>
      <small>${bank} · ${p.days || 0}d × ${p.hours || 0}h · ${date}</small>
    </div>`;
  }).join('');
}

// ─── Leave Requests ───────────────────────────────────────────────────────────

async function requestLeave() {
  const staff_name = document.getElementById('leave-staff').value.trim();
  const date = document.getElementById('leave-date').value;
  const reason = document.getElementById('leave-reason').value.trim();
  if (!staff_name || !date || !reason) return alert('Fill all leave fields');
  await api('/api/leave', { method: 'POST', body: JSON.stringify({ staff_name, date, reason }) });
  document.getElementById('leave-staff').value = '';
  document.getElementById('leave-date').value = '';
  document.getElementById('leave-reason').value = '';
  renderLeave();
}

async function renderLeave() {
  const leaves = await api('/api/leave');
  if (!leaves.length) {
    document.getElementById('leave-list').innerHTML = '<p style="text-align:left;color:#64748b;">No requests yet.</p>';
    return;
  }
  document.getElementById('leave-list').innerHTML = leaves.map(l => {
    const statusClass = l.status === 'Approved' ? 'approved' : l.status === 'Rejected' ? 'rejected' : 'pending';
    const actions = l.status === 'Pending' ? `
      <button class="approve-btn" onclick="updateLeave(${l.id}, 'Approved')">Approve</button>
      <button class="reject-btn" onclick="updateLeave(${l.id}, 'Rejected')">Reject</button>` : '';
    return `<div class="leave-item">
      <b>${l.staff_name}</b> — ${l.date}
      <span class="badge ${statusClass}">${l.status}</span><br>
      <small>${l.reason}</small><br>
      ${actions}
    </div>`;
  }).join('');
}

async function updateLeave(id, status) {
  await api(`/api/leave/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  renderLeave();
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function loadSettings() {
  if (org) {
    document.getElementById('set-open').value = org.openTime || '08:00';
    document.getElementById('set-close').value = org.closeTime || '17:00';
  }
}

async function saveSettings() {
  const openTime = document.getElementById('set-open').value;
  const closeTime = document.getElementById('set-close').value;
  await api('/api/org', { method: 'PUT', body: JSON.stringify({ openTime, closeTime }) });
  org.openTime = openTime;
  org.closeTime = closeTime;
  alert('Settings saved!');
  showScreen('dashboard');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
