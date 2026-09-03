// ===== DAIRY MANAGEMENT APP - COMPLETE JAVASCRIPT =====
// Uses localStorage for data persistence

// ===== TRANSLATIONS =====
const TRANSLATIONS = {
  english: {
    dashboard:'Dashboard',cows:'Cow Profiles',milk:'Milk Records',expenses:'Expenses',
    labour:'Labour',buyers:'Buyers',payments:'Payments',reports:'Reports',
    totalCows:'Total Cows',todayMilk:"Today's Milk",monthlyExpenses:'Monthly Expenses',
    activeBuyers:'Active Buyers',healthyCows:'healthy',addNew:'Add New',
    addCow:'Add Cow',addMilkEntry:'Add Milk Entry',addExpense:'Add Expense',
    addLabour:'Add Labour',addBuyer:'Add Buyer',addPayment:'Add Payment',
    save:'Save',cancel:'Cancel',delete:'Delete',edit:'Edit',export:'Export',
    share:'Share',morning:'Morning',evening:'Evening',litres:'Litres',rate:'Rate',
    total:'Total',confirmDelete:'Are you sure you want to delete this?',
    confirmLogout:'Are you sure you want to logout?',deleteTitle:'Delete Confirmation',
    logoutTitle:'Logout Confirmation',name:'Name',email:'Email',password:'Password',
    confirmPassword:'Confirm Password',phone:'Phone',address:'Address',farmName:'Farm Name',
    signIn:'Sign In',register:'Register',createAccount:'Create Account',
    rememberMe:'Remember me',shareAllReports:'Share All Reports',logout:'Logout'
  },
  hindi: {
    dashboard:'डैशबोर्ड',cows:'गाय प्रोफ़ाइल',milk:'दूध रिकॉर्ड',expenses:'खर्च',
    labour:'मज़दूर',buyers:'खरीदार',payments:'भुगतान',reports:'रिपोर्ट',
    totalCows:'कुल गायें',todayMilk:'आज का दूध',monthlyExpenses:'मासिक खर्च',
    activeBuyers:'सक्रिय खरीदार',healthyCows:'स्वस्थ',addNew:'नया जोड़ें',
    addCow:'गाय जोड़ें',addMilkEntry:'दूध एंट्री जोड़ें',addExpense:'खर्च जोड़ें',
    addLabour:'मज़दूर जोड़ें',addBuyer:'खरीदार जोड़ें',addPayment:'भुगतान जोड़ें',
    save:'सेव करें',cancel:'रद्द करें',delete:'हटाएं',edit:'संपादित करें',
    export:'निर्यात',share:'साझा करें',morning:'सुबह',evening:'शाम',litres:'लीटर',
    rate:'दर',total:'कुल',confirmDelete:'क्या आप वाकई इसे हटाना चाहते हैं?',
    confirmLogout:'क्या आप वाकई लॉगआउट करना चाहते हैं?',deleteTitle:'हटाने की पुष्टि',
    logoutTitle:'लॉगआउट की पुष्टि',name:'नाम',email:'ईमेल',password:'पासवर्ड',
    confirmPassword:'पासवर्ड की पुष्टि करें',phone:'फोन',address:'पता',farmName:'खेत का नाम',
    signIn:'साइन इन',register:'रजिस्टर',createAccount:'खाता बनाएं',
    rememberMe:'मुझे याद रखें',shareAllReports:'सभी रिपोर्ट साझा करें',logout:'लॉगआउट'
  }
};

const BREEDS = ['Holstein Friesian','Jersey','Gir','Sahiwal','Red Sindhi','Tharparkar','Rathi','Hariana','Ongole','Crossbred'];
const EXPENSE_CATEGORIES = [
  {value:'feed',label:'Feed & Fodder',icon:'📦'},
  {value:'medical',label:'Medical & Veterinary',icon:'➕'},
  {value:'labour',label:'Labour Charges',icon:'👷'},
  {value:'transport',label:'Transport',icon:'🚛'},
  {value:'electricity',label:'Electricity',icon:'⚡'},
  {value:'maintenance',label:'Maintenance',icon:'🔧'},
  {value:'other',label:'Other Expenses',icon:'💰'}
];

// ===== APP STATE =====
let state = {
  isLoggedIn: false,
  isRegistering: false,
  currentFarmer: null,
  activeTab: 'dashboard',
  showProfileMenu: false,
  rememberMe: false,
  cows: [],
  milkEntries: [],
  expenses: [],
  labour: [],
  buyers: [],
  payments: [],
  currentRate: 45,
  // Modal states
  showModal: null, // 'cow','milk','expense','labour','buyer','payment','editRate','confirm'
  editingItem: null,
  confirmAction: null
};

function getT() { return TRANSLATIONS[state.currentFarmer?.language || 'english']; }
function today() { return new Date().toISOString().split('T')[0]; }
function genId() { return Date.now().toString() + Math.random().toString(36).substr(2,5); }

// ===== DATA PERSISTENCE =====
function saveData(key, data) {
  if (state.currentFarmer) {
    localStorage.setItem(`dairy_${key}_${state.currentFarmer.id}`, JSON.stringify(data));
  }
}

function loadFarmerData(farmerId) {
  const load = (key, def) => {
    const d = localStorage.getItem(`dairy_${key}_${farmerId}`);
    return d ? JSON.parse(d) : def;
  };
  state.cows = load('cows', []);
  state.milkEntries = load('milk', []);
  state.expenses = load('expenses', []);
  state.labour = load('labour', []);
  state.buyers = load('buyers', []);
  state.payments = load('payments', []);
  state.currentRate = load('milkRate', 45);
}

// ===== DASHBOARD STATS =====
function getStats() {
  const todayStr = today();
  const now = new Date();
  return {
    totalCows: state.cows.length,
    healthyCows: state.cows.filter(c => c.healthStatus === 'healthy').length,
    todayMilk: state.milkEntries.filter(e => e.date === todayStr).reduce((s,e) => s + e.litres, 0),
    monthlyExpenses: state.expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s,e) => s + e.amount, 0),
    activeBuyers: state.buyers.filter(b => b.isActive).length,
    todayIncome: state.payments.filter(p => p.date === todayStr && p.type === 'income').reduce((s,p) => s + p.amount, 0),
    activeLabour: state.labour.filter(l => l.isActive).length
  };
}

// ===== AUTH =====
function handleLogin(email, password) {
  const farmers = JSON.parse(localStorage.getItem('dairy_farmers') || '[]');
  const farmer = farmers.find(f => f.email === email);
  if (farmer && farmer.password === password) {
    if (state.rememberMe) {
      localStorage.setItem('dairy_remembered', JSON.stringify({email, password}));
    } else {
      localStorage.removeItem('dairy_remembered');
    }
    state.currentFarmer = farmer;
    state.isLoggedIn = true;
    localStorage.setItem('dairy_currentFarmer', JSON.stringify(farmer));
    loadFarmerData(farmer.id);
    render();
    return true;
  }
  return false;
}

function handleRegister(data) {
  const farmers = JSON.parse(localStorage.getItem('dairy_farmers') || '[]');
  if (farmers.some(f => f.email === data.email)) return 'Email already exists';
  
  const newFarmer = { id: genId(), ...data, language: 'english', createdAt: new Date().toISOString() };
  farmers.push(newFarmer);
  localStorage.setItem('dairy_farmers', JSON.stringify(farmers));
  state.currentFarmer = newFarmer;
  state.isLoggedIn = true;
  localStorage.setItem('dairy_currentFarmer', JSON.stringify(newFarmer));
  render();
  return true;
}

function handleLogout() {
  state.isLoggedIn = false;
  state.currentFarmer = null;
  state.showProfileMenu = false;
  localStorage.removeItem('dairy_currentFarmer');
  state.activeTab = 'dashboard';
  state.cows = []; state.milkEntries = []; state.expenses = [];
  state.labour = []; state.buyers = []; state.payments = [];
  render();
}

// ===== CRUD OPERATIONS =====
function addCow(data) {
  if (state.editingItem) {
    state.cows = state.cows.map(c => c.id === state.editingItem.id ? {...data, id: c.id, farmerId: state.currentFarmer.id} : c);
  } else {
    state.cows.push({...data, id: genId(), farmerId: state.currentFarmer.id});
  }
  saveData('cows', state.cows);
  state.showModal = null; state.editingItem = null;
  render();
}

function addMilkEntry(data) {
  const existing = state.milkEntries.filter(e => e.date === data.date && (data.cowId === 'all' || e.cowId === data.cowId));
  if (existing.length >= 2) { alert('Only 2 entries per day allowed'); return; }
  if (existing.some(e => e.session === data.session)) { alert(`${data.session} entry already exists for this date`); return; }
  
  const entry = { ...data, id: genId(), farmerId: state.currentFarmer.id, rate: state.currentRate, total: data.litres * state.currentRate };
  state.milkEntries.push(entry);
  saveData('milk', state.milkEntries);
  state.showModal = null;
  render();
}

function addExpense(data) {
  if (state.editingItem) {
    state.expenses = state.expenses.map(e => e.id === state.editingItem.id ? {...data, id: e.id, farmerId: state.currentFarmer.id} : e);
  } else {
    state.expenses.push({...data, id: genId(), farmerId: state.currentFarmer.id});
  }
  saveData('expenses', state.expenses);
  state.showModal = null; state.editingItem = null;
  render();
}

function addLabour(data) {
  if (state.editingItem) {
    state.labour = state.labour.map(l => l.id === state.editingItem.id ? {...data, id: l.id, farmerId: state.currentFarmer.id} : l);
  } else {
    state.labour.push({...data, id: genId(), farmerId: state.currentFarmer.id});
  }
  saveData('labour', state.labour);
  state.showModal = null; state.editingItem = null;
  render();
}

function addBuyer(data) {
  if (state.editingItem) {
    state.buyers = state.buyers.map(b => b.id === state.editingItem.id ? {...data, id: b.id, farmerId: state.currentFarmer.id} : b);
  } else {
    state.buyers.push({...data, id: genId(), farmerId: state.currentFarmer.id, isActive: true});
  }
  saveData('buyers', state.buyers);
  state.showModal = null; state.editingItem = null;
  render();
}

function addPayment(data) {
  if (state.editingItem) {
    state.payments = state.payments.map(p => p.id === state.editingItem.id ? {...data, id: p.id, farmerId: state.currentFarmer.id} : p);
  } else {
    state.payments.push({...data, id: genId(), farmerId: state.currentFarmer.id});
  }
  saveData('payments', state.payments);
  state.showModal = null; state.editingItem = null;
  render();
}

function deleteItem(id, type) {
  state.showModal = 'confirm';
  state.confirmAction = () => {
    if (type === 'cow') { state.cows = state.cows.filter(c => c.id !== id); saveData('cows', state.cows); }
    if (type === 'milk') { state.milkEntries = state.milkEntries.filter(m => m.id !== id); saveData('milk', state.milkEntries); }
    if (type === 'expense') { state.expenses = state.expenses.filter(e => e.id !== id); saveData('expenses', state.expenses); }
    if (type === 'labour') { state.labour = state.labour.filter(l => l.id !== id); saveData('labour', state.labour); }
    if (type === 'buyer') { state.buyers = state.buyers.filter(b => b.id !== id); saveData('buyers', state.buyers); }
    if (type === 'payment') { state.payments = state.payments.filter(p => p.id !== id); saveData('payments', state.payments); }
    state.showModal = null; state.confirmAction = null;
    render();
  };
  render();
}

// ===== EXPORT & SHARE =====
function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const stats = getStats();
  let y = 20;

  doc.setFontSize(20); doc.setTextColor(40,120,40);
  doc.text(`${state.currentFarmer.farmName} - Dairy Report`, 20, y);
  y += 10; doc.setFontSize(10); doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
  y += 15; doc.setFontSize(14); doc.setTextColor(0);
  doc.text('Dashboard Summary', 20, y); y += 10;

  doc.autoTable({
    startY: y,
    head: [['Metric','Value']],
    body: [
      ['Total Cows', stats.totalCows.toString()],
      ['Healthy Cows', stats.healthyCows.toString()],
      ["Today's Milk", stats.todayMilk + ' L'],
      ['Monthly Expenses', '₹' + stats.monthlyExpenses],
      ['Active Buyers', stats.activeBuyers.toString()],
      ['Active Labour', stats.activeLabour.toString()]
    ],
    theme: 'striped',
    headStyles: { fillColor: [40,120,40] }
  });

  if (state.cows.length > 0) {
    doc.addPage(); y = 20;
    doc.setFontSize(14); doc.text('Cow Profiles', 20, y);
    doc.autoTable({
      startY: y + 10,
      head: [['Tag','Name','Breed','Health','Milk Prod.']],
      body: state.cows.map(c => [c.tagNo, c.name, c.breed, c.healthStatus, c.milkProduction||'N/A']),
      theme: 'grid', headStyles: { fillColor: [40,120,40] }
    });
  }

  if (state.milkEntries.length > 0) {
    doc.addPage(); y = 20;
    doc.setFontSize(14); doc.text('Milk Records', 20, y);
    doc.autoTable({
      startY: y + 10,
      head: [['Date','Session','Litres','Fat%','Rate','Total']],
      body: state.milkEntries.slice(-20).map(e => [e.date, e.session, e.litres+'L', e.fatPercent+'%', '₹'+e.rate, '₹'+e.total]),
      theme: 'grid', headStyles: { fillColor: [40,120,40] }
    });
  }

  if (state.expenses.length > 0) {
    doc.addPage(); y = 20;
    doc.setFontSize(14); doc.text('Expenses', 20, y);
    doc.autoTable({
      startY: y + 10,
      head: [['Date','Category','Description','Recipient','Amount']],
      body: state.expenses.slice(-20).map(e => [e.date, e.category, e.description, e.recipient, '₹'+e.amount]),
      theme: 'grid', headStyles: { fillColor: [40,120,40] }
    });
  }

  doc.save(`dairy-report-${today()}.pdf`);
}

function shareOnWhatsApp() {
  const stats = getStats();
  const msg = `🐄 Dairy Report\n\nFarm: ${state.currentFarmer.farmName}\nToday's Milk: ${stats.todayMilk}L\nTotal Cows: ${stats.totalCows}\nMonthly Expenses: ₹${stats.monthlyExpenses}\nDate: ${new Date().toLocaleDateString()}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function shareAllReports() {
  const stats = getStats();
  const totalIncome = state.payments.filter(p => p.type === 'income').reduce((s,p) => s + p.amount, 0);
  const totalExpense = state.payments.filter(p => p.type === 'expense').reduce((s,p) => s + p.amount, 0);
  let msg = `*🐄 ${state.currentFarmer.farmName} - COMPLETE DAIRY REPORT*\n\n`;
  msg += `📊 *DASHBOARD*\nTotal Cows: ${stats.totalCows}\nToday's Milk: ${stats.todayMilk}L\nMonthly Expenses: ₹${stats.monthlyExpenses}\n`;
  msg += `Active Buyers: ${stats.activeBuyers}\nActive Workers: ${stats.activeLabour}\n\n`;
  msg += `💳 *FINANCES*\nTotal Income: ₹${totalIncome}\nTotal Expenses: ₹${totalExpense}\nNet Balance: ₹${totalIncome - totalExpense}\n`;
  msg += `\n📅 Generated: ${new Date().toLocaleDateString()}\n📱 Dairy Management App`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== RENDER ENGINE =====
function render() {
  const app = document.getElementById('app');
  if (!state.isLoggedIn) {
    app.innerHTML = renderAuth();
  } else {
    app.innerHTML = renderMain();
  }
  attachEvents();
}

// ===== AUTH SCREEN =====
function renderAuth() {
  const t = getT();
  const remembered = JSON.parse(localStorage.getItem('dairy_remembered') || 'null');
  
  if (state.isRegistering) {
    return `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon">🐄</div>
          <h1 class="auth-title">Register Farm</h1>
          <p class="auth-subtitle">Create your farm account</p>
        </div>
        <form id="registerForm">
          <div class="form-group">
            <label class="form-label">${t.name} *</label>
            <div class="form-input-icon"><span class="icon">👤</span>
              <input class="form-input" type="text" name="name" placeholder="Your full name" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.farmName} *</label>
            <div class="form-input-icon"><span class="icon">🏠</span>
              <input class="form-input" type="text" name="farmName" placeholder="Your farm name" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.phone}</label>
            <div class="form-input-icon"><span class="icon">📞</span>
              <input class="form-input" type="tel" name="phone" placeholder="Phone number">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.address}</label>
            <div class="form-input-icon"><span class="icon">📍</span>
              <textarea class="form-textarea" name="address" placeholder="Farm address" style="padding-left:36px"></textarea>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.email} *</label>
            <div class="form-input-icon"><span class="icon">✉️</span>
              <input class="form-input" type="email" name="email" placeholder="Enter your email" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.password} *</label>
            <div class="form-input-icon"><span class="icon">🔒</span>
              <input class="form-input" type="password" name="password" placeholder="Enter password" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.confirmPassword} *</label>
            <div class="form-input-icon"><span class="icon">🔒</span>
              <input class="form-input" type="password" name="confirmPassword" placeholder="Confirm password" required>
            </div>
          </div>
          <div id="authError" class="form-error" style="margin-bottom:12px"></div>
          <button type="submit" class="btn btn-primary btn-full">${t.createAccount}</button>
          <p class="text-center mt-4" style="font-size:13px">
            Already have an account? <a href="#" id="switchToLogin" style="color:var(--primary)">Sign in</a>
          </p>
        </form>
      </div>
    </div>`;
  }

  return `
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">🐄</div>
        <h1 class="auth-title">Dairy Manager</h1>
        <p class="auth-subtitle">Sign in to manage your dairy</p>
      </div>
      <form id="loginForm">
        <div class="form-group">
          <label class="form-label">${t.email}</label>
          <div class="form-input-icon"><span class="icon">✉️</span>
            <input class="form-input" type="email" name="email" placeholder="Enter your email" required value="${remembered?.email || ''}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${t.password}</label>
          <div class="form-input-icon"><span class="icon">🔒</span>
            <input class="form-input" type="password" name="password" placeholder="Enter password" required value="${remembered?.password || ''}">
          </div>
        </div>
        <div class="form-group checkbox-group">
          <input type="checkbox" id="rememberMe" ${remembered ? 'checked' : ''}>
          <label for="rememberMe">${t.rememberMe}</label>
        </div>
        <div id="authError" class="form-error" style="margin-bottom:12px"></div>
        <button type="submit" class="btn btn-primary btn-full">${t.signIn}</button>
        <p class="text-center mt-4" style="font-size:13px">
          Don't have an account? <a href="#" id="switchToRegister" style="color:var(--primary)">Register</a>
        </p>
      </form>
    </div>
  </div>`;
}

// ===== MAIN APP =====
function renderMain() {
  const t = getT();
  const tabs = [
    {id:'dashboard',label:t.dashboard,icon:'📊'},
    {id:'cows',label:t.cows,icon:'🐄'},
    {id:'milk',label:t.milk,icon:'🥛'},
    {id:'expenses',label:t.expenses,icon:'💰'},
    {id:'labour',label:t.labour,icon:'👷'},
    {id:'buyers',label:t.buyers,icon:'🚛'},
    {id:'payments',label:t.payments,icon:'💳'},
    {id:'reports',label:t.reports,icon:'📈'}
  ];

  let content = '';
  switch(state.activeTab) {
    case 'dashboard': content = renderDashboard(); break;
    case 'cows': content = renderCows(); break;
    case 'milk': content = renderMilk(); break;
    case 'expenses': content = renderExpenses(); break;
    case 'labour': content = renderLabour(); break;
    case 'buyers': content = renderBuyers(); break;
    case 'payments': content = renderPayments(); break;
    case 'reports': content = renderReports(); break;
  }

  let modal = '';
  if (state.showModal === 'cow') modal = renderCowModal();
  else if (state.showModal === 'milk') modal = renderMilkModal();
  else if (state.showModal === 'expense') modal = renderExpenseModal();
  else if (state.showModal === 'labour') modal = renderLabourModal();
  else if (state.showModal === 'buyer') modal = renderBuyerModal();
  else if (state.showModal === 'payment') modal = renderPaymentModal();
  else if (state.showModal === 'editRate') modal = renderEditRateModal();
  else if (state.showModal === 'confirm') modal = renderConfirmDialog();

  return `
  <nav class="navbar">
    <div class="navbar-inner">
      <div class="navbar-brand">
        <span class="navbar-logo">🐄</span>
        <span class="navbar-title">${state.currentFarmer.farmName}</span>
        <div class="rate-badge">
          🥛 Rate: ₹${state.currentRate}/L
          <button class="btn btn-ghost btn-sm" onclick="state.showModal='editRate';render()">✏️</button>
        </div>
      </div>
      <div style="position:relative">
        <button class="profile-btn" onclick="state.showProfileMenu=!state.showProfileMenu;render()">
          👤 <span>${state.currentFarmer.name}</span>
        </button>
        ${state.showProfileMenu ? `
        <div class="profile-menu">
          <div class="profile-menu-header">
            <div class="profile-menu-name">${state.currentFarmer.name}</div>
            <div class="profile-menu-email">${state.currentFarmer.email}</div>
          </div>
          <div style="padding:8px 16px;border-bottom:1px solid var(--border)">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px">Language / भाषा</div>
            <button class="lang-btn ${state.currentFarmer.language==='english'?'active':''}" onclick="setLanguage('english')">🇺🇸 English</button>
            <button class="lang-btn ${state.currentFarmer.language==='hindi'?'active':''}" onclick="setLanguage('hindi')">🇮🇳 हिन्दी</button>
          </div>
          <button class="profile-menu-item" onclick="confirmLogout()">🚪 ${t.logout}</button>
        </div>` : ''}
      </div>
    </div>
  </nav>
  <div class="tabs">
    ${tabs.map(tab => `
      <button class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}" onclick="state.activeTab='${tab.id}';render()">
        ${tab.icon} ${tab.label}
      </button>
    `).join('')}
  </div>
  <div class="content">${content}</div>
  ${modal}`;
}

function setLanguage(lang) {
  state.currentFarmer.language = lang;
  localStorage.setItem('dairy_currentFarmer', JSON.stringify(state.currentFarmer));
  state.showProfileMenu = false;
  render();
}

function confirmLogout() {
  state.showModal = 'confirm';
  state.confirmAction = () => { handleLogout(); };
  render();
}

// ===== DASHBOARD =====
function renderDashboard() {
  const t = getT();
  const stats = getStats();
  return `
  <div class="grid-4 mb-6">
    <div class="stat-card">
      <div class="stat-icon green">🐄</div>
      <div>
        <div class="stat-label">${t.totalCows}</div>
        <div class="stat-value">${stats.totalCows}</div>
        <div class="stat-sub">${stats.healthyCows} ${t.healthyCows}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon yellow">🥛</div>
      <div>
        <div class="stat-label">${t.todayMilk}</div>
        <div class="stat-value">${stats.todayMilk}L</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">💰</div>
      <div>
        <div class="stat-label">${t.monthlyExpenses}</div>
        <div class="stat-value">₹${stats.monthlyExpenses}</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">₹</div>
      <div>
        <div class="stat-label">Today's Income</div>
        <div class="stat-value">₹${stats.todayIncome}</div>
      </div>
    </div>
  </div>
  <div class="grid-4 mb-6">
    <button class="btn btn-primary btn-tall" onclick="state.showModal='milk';render()">🥛 Add Milk</button>
    <button class="btn btn-outline btn-tall" onclick="state.showModal='expense';render()">💰 Add Expense</button>
    <button class="btn btn-outline btn-tall" onclick="exportToPDF()">📥 ${t.export} PDF</button>
    <button class="btn btn-outline btn-tall" onclick="shareOnWhatsApp()">📱 Share Report</button>
  </div>
  <div class="grid-3">
    <div class="card">
      <div class="card-header">Recent Milk Entries</div>
      <div class="card-body">
        ${state.milkEntries.length === 0 ? '<div class="empty-state"><div class="empty-icon">🥛</div><p class="text-muted">No milk entries yet</p></div>' :
          state.milkEntries.slice(-3).map(e => {
            const cow = state.cows.find(c => c.id === e.cowId);
            return `<div style="display:flex;justify-content:space-between;padding:8px;background:var(--muted-bg);border-radius:8px;margin-bottom:6px">
              <div><div style="font-weight:600;font-size:13px">${cow?.name || 'All Cows'}</div><div style="font-size:11px;color:var(--text-muted)">${e.date} • ${e.session}</div></div>
              <div style="text-align:right"><div style="font-size:13px;font-weight:600">${e.litres}L</div><div style="font-size:11px;color:var(--text-muted)">₹${e.total}</div></div>
            </div>`;
          }).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header">Recent Expenses</div>
      <div class="card-body">
        ${state.expenses.length === 0 ? '<div class="empty-state"><div class="empty-icon">💰</div><p class="text-muted">No expenses yet</p></div>' :
          state.expenses.slice(-3).map(e => `<div style="display:flex;justify-content:space-between;padding:8px;background:var(--muted-bg);border-radius:8px;margin-bottom:6px">
            <div><div style="font-weight:600;font-size:13px">${e.description}</div><div style="font-size:11px;color:var(--text-muted)">${e.category} • ${e.date}</div></div>
            <div style="font-size:13px;font-weight:600">₹${e.amount}</div>
          </div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-header">Today's Summary</div>
      <div class="card-body">
        <div class="report-detail"><span class="text-muted">Milk Collection</span><span class="report-detail-value">${getStats().todayMilk}L</span></div>
        <div class="report-detail"><span class="text-muted">Income</span><span class="report-detail-value text-success">₹${getStats().todayIncome}</span></div>
        <div class="report-detail"><span class="text-muted">Active Buyers</span><span class="report-detail-value">${getStats().activeBuyers}</span></div>
        <div class="report-detail"><span class="text-muted">Labour</span><span class="report-detail-value">${getStats().activeLabour}</span></div>
      </div>
    </div>
  </div>`;
}

// ===== COWS TAB =====
function renderCows() {
  const t = getT();
  return `
  <div class="section-header">
    <h2 class="section-title">${t.cows}</h2>
    <div class="section-actions">
      <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='cow';render()">➕ ${t.addNew}</button>
      ${state.cows.length > 0 ? `<button class="btn btn-outline" onclick="shareCowReport()">📱 Share All</button>` : ''}
    </div>
  </div>
  ${state.cows.length === 0 ? `
    <div class="card"><div class="card-body"><div class="empty-state">
      <div class="empty-icon">🐄</div>
      <h3 class="empty-title">No Cows Added</h3>
      <p class="empty-desc">Start by adding your first cow profile</p>
      <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='cow';render()">➕ Add First Cow</button>
    </div></div></div>` : `
    <div class="grid-3">
      ${state.cows.map(cow => {
        const age = new Date().getFullYear() - new Date(cow.dob).getFullYear();
        const healthClass = cow.healthStatus === 'healthy' ? 'badge-success' : cow.healthStatus === 'sick' ? 'badge-danger' : 'badge-warning';
        let pregnancyHtml = '';
        if (cow.healthStatus === 'pregnant' && cow.semenDate && cow.deliveryDate) {
          const diffDays = Math.max(0, Math.ceil((new Date(cow.deliveryDate) - new Date()) / 86400000));
          const months = Math.floor(diffDays / 30), days = diffDays % 30;
          const remaining = diffDays === 0 ? 'Due today' : months > 0 ? `${months}m ${days}d` : `${days}d`;
          pregnancyHtml = `<div class="pregnancy-info">
            <div class="pregnancy-row"><span>Semen:</span><span>${cow.semenDate}</span></div>
            <div class="pregnancy-row"><span>Due:</span><span>${cow.deliveryDate}</span></div>
            <div class="pregnancy-row"><span><b>Remaining:</b></span><span><b>${remaining}</b></span></div>
          </div>`;
        }
        return `<div class="card cow-card">
          <div class="cow-card-header">
            <div><div class="cow-name">${cow.name}</div><div class="cow-tag">Tag: ${cow.tagNo}</div></div>
            <div>
              <button class="btn btn-ghost btn-sm" onclick="state.editingItem=state.cows.find(c=>c.id==='${cow.id}');state.showModal='cow';render()">✏️</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteItem('${cow.id}','cow')">🗑️</button>
            </div>
          </div>
          <div class="cow-detail"><span class="cow-detail-label">Breed:</span><span>${cow.breed}</span></div>
          <div class="cow-detail"><span class="cow-detail-label">Age:</span><span>${age} years</span></div>
          <div class="cow-detail"><span class="cow-detail-label">Lactation:</span><span class="capitalize">${cow.lactationStage}</span></div>
          <div class="cow-detail"><span class="cow-detail-label">Health:</span><span class="badge ${healthClass}">${cow.healthStatus}</span></div>
          <div class="cow-detail"><span class="cow-detail-label">Milk Prod:</span><span class="capitalize">${cow.milkProduction || 'N/A'}</span></div>
          ${pregnancyHtml}
        </div>`;
      }).join('')}
    </div>`}`;
}

function shareCowReport() {
  let msg = `🐄 *${state.currentFarmer.farmName} - Cow Report*\n📅 ${new Date().toLocaleDateString()}\n\n`;
  msg += `Total: ${state.cows.length} | Healthy: ${state.cows.filter(c=>c.healthStatus==='healthy').length} | Sick: ${state.cows.filter(c=>c.healthStatus==='sick').length} | Pregnant: ${state.cows.filter(c=>c.healthStatus==='pregnant').length}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== MILK TAB =====
function renderMilk() {
  const t = getT();
  return `
  <div class="section-header">
    <h2 class="section-title">${t.milk}</h2>
    <div class="section-actions">
      <button class="btn btn-primary" onclick="state.showModal='milk';render()">➕ Add Entry</button>
      <button class="btn btn-outline" onclick="shareMilkReport()">📱 ${t.share}</button>
    </div>
  </div>
  <div class="card">
    <div class="card-body">
      ${state.milkEntries.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🥛</div>
          <h3 class="empty-title">No Milk Entries</h3>
          <p class="empty-desc">Start recording your daily milk production</p>
          <button class="btn btn-primary" onclick="state.showModal='milk';render()">➕ Add First Entry</button>
        </div>` : `
        <div class="table-container">
          <table>
            <thead><tr><th>Date</th><th>Cow</th><th>Session</th><th>Litres</th><th>Fat%</th><th>SNF%</th><th>Rate</th><th>Total</th><th>Actions</th></tr></thead>
            <tbody>
              ${state.milkEntries.map(e => {
                const cow = state.cows.find(c => c.id === e.cowId);
                return `<tr>
                  <td>${e.date}</td><td>${cow?.name || 'All Cows'}</td><td class="capitalize">${e.session}</td>
                  <td>${e.litres}L</td><td>${e.fatPercent}%</td><td>${e.snfPercent}%</td>
                  <td>₹${e.rate}</td><td class="font-bold">₹${e.total}</td>
                  <td><button class="btn btn-ghost btn-sm" onclick="deleteItem('${e.id}','milk')">🗑️</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`}
    </div>
  </div>`;
}

function shareMilkReport() {
  const stats = getStats();
  let msg = `🥛 *${state.currentFarmer.farmName} - Milk Report*\nToday: ${stats.todayMilk}L\nTotal Records: ${state.milkEntries.length}\nRevenue: ₹${state.milkEntries.reduce((s,e)=>s+e.total,0)}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== EXPENSES TAB =====
function renderExpenses() {
  const t = getT();
  return `
  <div class="section-header">
    <h2 class="section-title">${t.expenses}</h2>
    <div class="section-actions">
      <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='expense';render()">➕ ${t.addExpense}</button>
      <button class="btn btn-outline" onclick="shareExpenseReport()">📱 ${t.share}</button>
    </div>
  </div>
  <div class="grid-4 mb-6">
    ${EXPENSE_CATEGORIES.map(cat => {
      const catExp = state.expenses.filter(e => e.category === cat.value);
      const total = catExp.reduce((s,e) => s + e.amount, 0);
      return `<div class="card expense-summary-card">
        <div class="expense-summary-icon">${cat.icon}</div>
        <div class="expense-summary-amount">₹${total}</div>
        <div class="expense-summary-label">${cat.label}</div>
        <div class="expense-summary-count">${catExp.length} entries</div>
      </div>`;
    }).join('')}
  </div>
  <div class="card"><div class="card-body">
    ${state.expenses.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">💰</div>
        <h3 class="empty-title">No Expenses Added</h3>
        <p class="empty-desc">Start managing your farm expenses</p>
        <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='expense';render()">➕ Add First Expense</button>
      </div>` : `
      <div class="table-container">
        <table>
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th>Recipient</th><th>Actions</th></tr></thead>
          <tbody>
            ${state.expenses.map(e => {
              const cat = EXPENSE_CATEGORIES.find(c => c.value === e.category);
              return `<tr>
                <td>${e.date}</td><td>${cat?.icon||''} ${cat?.label||e.category}</td><td>${e.description}</td>
                <td class="text-danger font-bold">₹${e.amount}</td><td>${e.recipient||'-'}</td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="state.editingItem=state.expenses.find(x=>x.id==='${e.id}');state.showModal='expense';render()">✏️</button>
                  <button class="btn btn-ghost btn-sm" onclick="deleteItem('${e.id}','expense')">🗑️</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`}
  </div></div>`;
}

function shareExpenseReport() {
  let msg = `💰 *${state.currentFarmer.farmName} - Expenses*\nTotal: ₹${state.expenses.reduce((s,e)=>s+e.amount,0)}\nEntries: ${state.expenses.length}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== LABOUR TAB =====
function renderLabour() {
  const t = getT();
  return `
  <div class="section-header">
    <h2 class="section-title">${t.labour}</h2>
    <div class="section-actions">
      <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='labour';render()">➕ ${t.addLabour}</button>
    </div>
  </div>
  ${state.labour.length === 0 ? `
    <div class="card"><div class="card-body"><div class="empty-state">
      <div class="empty-icon">👷</div>
      <h3 class="empty-title">No Workers Added</h3>
      <p class="empty-desc">Start managing your farm workers</p>
      <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='labour';render()">➕ Add First Worker</button>
    </div></div></div>` : `
    <div class="card"><div class="card-body">
      <div class="grid-3">
        ${state.labour.map(w => `
          <div class="card worker-card" style="border:1px solid var(--border)">
            <div class="worker-header">
              <div><div class="worker-name">${w.name}</div><div class="worker-phone">📞 ${w.phone}</div></div>
              <div>
                <button class="btn btn-ghost btn-sm" onclick="state.editingItem=state.labour.find(x=>x.id==='${w.id}');state.showModal='labour';render()">✏️</button>
                <button class="btn btn-ghost btn-sm" onclick="deleteItem('${w.id}','labour')">🗑️</button>
              </div>
            </div>
            <div class="cow-detail"><span class="cow-detail-label">Daily Wage:</span><span>₹${w.dailyWage}</span></div>
            <div class="cow-detail"><span class="cow-detail-label">Hourly Wage:</span><span>₹${w.hourlyWage}</span></div>
            <div class="cow-detail"><span class="cow-detail-label">Status:</span><span class="${w.isActive?'text-success':'text-muted'}">${w.isActive?'Active':'Inactive'}</span></div>
          </div>
        `).join('')}
      </div>
    </div></div>`}`;
}

// ===== BUYERS TAB =====
function renderBuyers() {
  const t = getT();
  return `
  <div class="section-header">
    <h2 class="section-title">${t.buyers}</h2>
    <div class="section-actions">
      <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='buyer';render()">➕ ${t.addBuyer}</button>
    </div>
  </div>
  ${state.buyers.length === 0 ? `
    <div class="card"><div class="card-body"><div class="empty-state">
      <div class="empty-icon">🚛</div>
      <h3 class="empty-title">No Buyers Added</h3>
      <p class="empty-desc">Start managing your milk buyers</p>
      <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='buyer';render()">➕ Add First Buyer</button>
    </div></div></div>` : `
    <div class="card"><div class="card-body">
      <div class="table-container">
        <table>
          <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Rate/L</th><th>Contract</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${state.buyers.map(b => `<tr>
              <td>${b.name}</td><td>${b.company||'-'}</td><td>${b.phone}</td>
              <td>₹${b.ratePerLiter}</td><td class="capitalize">${b.contractType}</td>
              <td><span class="badge ${b.isActive?'badge-success':'badge-danger'}">${b.isActive?'Active':'Inactive'}</span></td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="state.editingItem=state.buyers.find(x=>x.id==='${b.id}');state.showModal='buyer';render()">✏️</button>
                <button class="btn btn-ghost btn-sm" onclick="deleteItem('${b.id}','buyer')">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div></div>`}`;
}

// ===== PAYMENTS TAB =====
function renderPayments() {
  const t = getT();
  const totalIncome = state.payments.filter(p => p.type === 'income').reduce((s,p) => s + p.amount, 0);
  const totalExpense = state.payments.filter(p => p.type === 'expense').reduce((s,p) => s + p.amount, 0);
  return `
  <div class="section-header">
    <h2 class="section-title">${t.payments}</h2>
    <div class="section-actions">
      <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='payment';render()">➕ ${t.addPayment}</button>
    </div>
  </div>
  <div class="grid-3 mb-6">
    <div class="card report-stat"><div class="report-stat-icon">💚</div><div class="report-stat-value text-success">₹${totalIncome}</div><div class="report-stat-label">Total Income</div></div>
    <div class="card report-stat"><div class="report-stat-icon">💔</div><div class="report-stat-value text-danger">₹${totalExpense}</div><div class="report-stat-label">Total Expenses</div></div>
    <div class="card report-stat"><div class="report-stat-icon">📊</div><div class="report-stat-value" style="color:${totalIncome-totalExpense>=0?'var(--success)':'var(--danger)'}">₹${totalIncome-totalExpense}</div><div class="report-stat-label">Net Balance</div></div>
  </div>
  <div class="card"><div class="card-body">
    ${state.payments.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">💳</div>
        <h3 class="empty-title">No Payments Recorded</h3>
        <p class="empty-desc">Track your income and expenses</p>
        <button class="btn btn-primary" onclick="state.editingItem=null;state.showModal='payment';render()">➕ Add First Payment</button>
      </div>` : `
      <div class="table-container">
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>To/From</th><th>Amount</th><th>Mode</th><th>Invoice</th><th>Actions</th></tr></thead>
          <tbody>
            ${state.payments.map(p => `<tr>
              <td>${p.date}</td>
              <td><span class="badge ${p.type==='income'?'badge-success':'badge-danger'}">${p.type}</span></td>
              <td>${p.toFrom}</td>
              <td class="${p.type==='income'?'text-success':'text-danger'} font-bold">${p.type==='income'?'+':'-'}₹${p.amount}</td>
              <td class="capitalize">${p.mode}</td><td>${p.invoiceId||'-'}</td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="state.editingItem=state.payments.find(x=>x.id==='${p.id}');state.showModal='payment';render()">✏️</button>
                <button class="btn btn-ghost btn-sm" onclick="deleteItem('${p.id}','payment')">🗑️</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
  </div></div>`;
}

// ===== REPORTS TAB =====
function renderReports() {
  const t = getT();
  const stats = getStats();
  const totalRevenue = state.milkEntries.reduce((s,e) => s + e.total, 0);
  const totalExpenses = state.expenses.reduce((s,e) => s + e.amount, 0);
  return `
  <div class="section-header">
    <h2 class="section-title">${t.reports}</h2>
    <div class="section-actions">
      <button class="btn btn-outline" onclick="exportToPDF()">📥 ${t.export} PDF</button>
      <button class="btn btn-outline" onclick="shareAllReports()">📱 ${t.shareAllReports}</button>
    </div>
  </div>
  <div class="grid-4 mb-6">
    <div class="card report-stat"><div class="report-stat-icon">🐄</div><div class="report-stat-value">${state.cows.length}</div><div class="report-stat-label">Total Cows</div></div>
    <div class="card report-stat"><div class="report-stat-icon">🥛</div><div class="report-stat-value">${state.milkEntries.reduce((s,e)=>s+e.litres,0)}L</div><div class="report-stat-label">Total Milk</div></div>
    <div class="card report-stat"><div class="report-stat-icon">💰</div><div class="report-stat-value">₹${totalExpenses}</div><div class="report-stat-label">Total Expenses</div></div>
    <div class="card report-stat"><div class="report-stat-icon">📈</div><div class="report-stat-value">₹${totalRevenue}</div><div class="report-stat-label">Milk Revenue</div></div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-header">This Month's Performance</div>
      <div class="card-body">
        <div class="report-detail"><span>Milk Production:</span><span class="report-detail-value">${stats.todayMilk*30}L (est.)</span></div>
        <div class="report-detail"><span>Total Expenses:</span><span class="report-detail-value">₹${stats.monthlyExpenses}</span></div>
        <div class="report-detail"><span>Revenue:</span><span class="report-detail-value">₹${stats.todayMilk*30*state.currentRate} (est.)</span></div>
        <div class="report-detail font-bold"><span>Net Profit:</span><span class="text-success">₹${(stats.todayMilk*30*state.currentRate)-stats.monthlyExpenses}</span></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">Quick Stats</div>
      <div class="card-body">
        <div class="report-detail"><span>Active Workers:</span><span class="report-detail-value">${stats.activeLabour}</span></div>
        <div class="report-detail"><span>Active Buyers:</span><span class="report-detail-value">${stats.activeBuyers}</span></div>
        <div class="report-detail"><span>Healthy Cows:</span><span class="report-detail-value">${stats.healthyCows}/${stats.totalCows}</span></div>
        <div class="report-detail"><span>Avg Milk/Day/Cow:</span><span class="report-detail-value">${stats.totalCows?(stats.todayMilk/stats.totalCows).toFixed(1):0}L</span></div>
      </div>
    </div>
  </div>`;
}

// ===== MODALS =====
function renderCowModal() {
  const item = state.editingItem;
  return `<div class="modal-overlay" onclick="if(event.target===this){state.showModal=null;state.editingItem=null;render()}">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🐄 ${item ? 'Edit Cow' : 'Add New Cow'}</div>
        <button class="modal-close" onclick="state.showModal=null;state.editingItem=null;render()">✕</button>
      </div>
      <div class="modal-body">
        <form id="cowForm">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Tag Number *</label><input class="form-input" name="tagNo" value="${item?.tagNo||''}" placeholder="COW001" required></div>
            <div class="form-group"><label class="form-label">Name *</label><input class="form-input" name="name" value="${item?.name||''}" placeholder="Cow name" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Breed</label>
              <select class="form-select" name="breed">${BREEDS.map(b=>`<option value="${b}" ${item?.breed===b?'selected':''}>${b}</option>`).join('')}</select>
            </div>
            <div class="form-group"><label class="form-label">Lactation Stage</label>
              <select class="form-select" name="lactationStage">
                <option value="dry" ${item?.lactationStage==='dry'?'selected':''}>Dry</option>
                <option value="early" ${item?.lactationStage==='early'||!item?'selected':''}>Early Lactation</option>
                <option value="peak" ${item?.lactationStage==='peak'?'selected':''}>Peak Lactation</option>
                <option value="late" ${item?.lactationStage==='late'?'selected':''}>Late Lactation</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Color</label><input class="form-input" name="color" value="${item?.color||''}" placeholder="White, Brown"></div>
            <div class="form-group"><label class="form-label">Health Status</label>
              <select class="form-select" name="healthStatus" onchange="document.getElementById('pregnancyFields').style.display=this.value==='pregnant'?'block':'none'">
                <option value="healthy" ${item?.healthStatus==='healthy'||!item?'selected':''}>Healthy</option>
                <option value="sick" ${item?.healthStatus==='sick'?'selected':''}>Sick</option>
                <option value="pregnant" ${item?.healthStatus==='pregnant'?'selected':''}>Pregnant</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Milk Production</label>
              <select class="form-select" name="milkProduction">
                <option value="good" ${item?.milkProduction==='good'||!item?'selected':''}>Good</option>
                <option value="average" ${item?.milkProduction==='average'?'selected':''}>Average</option>
                <option value="low" ${item?.milkProduction==='low'?'selected':''}>Low</option>
                <option value="dry" ${item?.milkProduction==='dry'?'selected':''}>Dry</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Last Checkup</label><input class="form-input" type="date" name="lastCheckup" value="${item?.lastCheckup||today()}"></div>
          </div>
          <div id="pregnancyFields" style="display:${item?.healthStatus==='pregnant'?'block':'none'}">
            <div class="form-row">
              <div class="form-group"><label class="form-label">Semen Date</label><input class="form-input" type="date" name="semenDate" value="${item?.semenDate||''}" onchange="autoDeliveryDate(this.value)"></div>
              <div class="form-group"><label class="form-label">Expected Delivery</label><input class="form-input" type="date" name="deliveryDate" value="${item?.deliveryDate||''}" id="deliveryDateInput" readonly style="background:var(--muted-bg)"></div>
            </div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" name="notes" placeholder="Additional notes...">${item?.notes||''}</textarea></div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button type="submit" class="btn btn-primary" style="flex:1">${item ? 'Update Cow' : 'Add Cow'}</button>
            <button type="button" class="btn btn-outline" onclick="state.showModal=null;state.editingItem=null;render()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function autoDeliveryDate(semenDate) {
  if (semenDate) {
    const d = new Date(semenDate);
    d.setDate(d.getDate() + 283);
    document.getElementById('deliveryDateInput').value = d.toISOString().split('T')[0];
  }
}

function renderMilkModal() {
  return `<div class="modal-overlay" onclick="if(event.target===this){state.showModal=null;render()}">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🥛 Add Milk Entry</div>
        <button class="modal-close" onclick="state.showModal=null;render()">✕</button>
      </div>
      <div class="modal-body">
        <form id="milkForm">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Cow *</label>
              <select class="form-select" name="cowId">
                <option value="all">All Cows</option>
                ${state.cows.map(c=>`<option value="${c.id}">${c.name} (${c.tagNo})</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="form-label">Date *</label><input class="form-input" type="date" name="date" value="${today()}" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Session</label>
              <select class="form-select" name="session"><option value="morning">Morning</option><option value="evening">Evening</option></select>
            </div>
            <div class="form-group"><label class="form-label">Litres *</label><input class="form-input" type="number" step="0.1" name="litres" placeholder="10.5" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Fat % *</label><input class="form-input" type="number" step="0.1" name="fatPercent" placeholder="3.5" required></div>
            <div class="form-group"><label class="form-label">SNF % *</label><input class="form-input" type="number" step="0.1" name="snfPercent" placeholder="8.5" required></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" name="notes" placeholder="Additional notes..."></textarea></div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button type="submit" class="btn btn-primary" style="flex:1">Add Entry</button>
            <button type="button" class="btn btn-outline" onclick="state.showModal=null;render()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function renderExpenseModal() {
  const item = state.editingItem;
  return `<div class="modal-overlay" onclick="if(event.target===this){state.showModal=null;state.editingItem=null;render()}">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">💰 ${item ? 'Edit Expense' : 'Add New Expense'}</div>
        <button class="modal-close" onclick="state.showModal=null;state.editingItem=null;render()">✕</button>
      </div>
      <div class="modal-body">
        <form id="expenseForm">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" name="date" value="${item?.date||today()}" required></div>
            <div class="form-group"><label class="form-label">Category</label>
              <select class="form-select" name="category">${EXPENSE_CATEGORIES.map(c=>`<option value="${c.value}" ${item?.category===c.value?'selected':''}>${c.label}</option>`).join('')}</select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Amount (₹) *</label><input class="form-input" type="number" step="0.01" name="amount" value="${item?.amount||''}" placeholder="0.00" required></div>
            <div class="form-group"><label class="form-label">Recipient *</label><input class="form-input" name="recipient" value="${item?.recipient||''}" placeholder="Vendor name" required></div>
          </div>
          <div class="form-group"><label class="form-label">Description *</label><textarea class="form-textarea" name="description" required>${item?.description||''}</textarea></div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button type="submit" class="btn btn-primary" style="flex:1">${item ? 'Update' : 'Add'} Expense</button>
            <button type="button" class="btn btn-outline" onclick="state.showModal=null;state.editingItem=null;render()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function renderLabourModal() {
  const item = state.editingItem;
  return `<div class="modal-overlay" onclick="if(event.target===this){state.showModal=null;state.editingItem=null;render()}">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">👷 ${item ? 'Edit Worker' : 'Add New Worker'}</div>
        <button class="modal-close" onclick="state.showModal=null;state.editingItem=null;render()">✕</button>
      </div>
      <div class="modal-body">
        <form id="labourForm">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Name *</label><input class="form-input" name="name" value="${item?.name||''}" required></div>
            <div class="form-group"><label class="form-label">Phone *</label><input class="form-input" type="tel" name="phone" value="${item?.phone||''}" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Daily Wage (₹) *</label><input class="form-input" type="number" step="0.01" name="dailyWage" value="${item?.dailyWage||''}" required></div>
            <div class="form-group"><label class="form-label">Hourly Wage (₹) *</label><input class="form-input" type="number" step="0.01" name="hourlyWage" value="${item?.hourlyWage||''}" required></div>
          </div>
          <div class="form-group checkbox-group">
            <input type="checkbox" id="labourActive" name="isActive" ${item?.isActive!==false?'checked':''}>
            <label for="labourActive">Currently Active</label>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button type="submit" class="btn btn-primary" style="flex:1">${item ? 'Update' : 'Add'} Worker</button>
            <button type="button" class="btn btn-outline" onclick="state.showModal=null;state.editingItem=null;render()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function renderBuyerModal() {
  const item = state.editingItem;
  const nextYear = new Date(Date.now()+365*86400000).toISOString().split('T')[0];
  return `<div class="modal-overlay" onclick="if(event.target===this){state.showModal=null;state.editingItem=null;render()}">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">🚛 ${item ? 'Edit Buyer' : 'Add New Buyer'}</div>
        <button class="modal-close" onclick="state.showModal=null;state.editingItem=null;render()">✕</button>
      </div>
      <div class="modal-body">
        <form id="buyerForm">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Contact Name *</label><input class="form-input" name="name" value="${item?.name||''}" required></div>
            <div class="form-group"><label class="form-label">Company</label><input class="form-input" name="company" value="${item?.company||''}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Phone *</label><input class="form-input" type="tel" name="phone" value="${item?.phone||''}" required></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" name="email" value="${item?.email||''}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Contract Type</label>
              <select class="form-select" name="contractType">
                <option value="fixed" ${item?.contractType==='fixed'||!item?'selected':''}>Fixed Rate</option>
                <option value="sliding" ${item?.contractType==='sliding'?'selected':''}>Sliding Rate</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Rate/Liter (₹) *</label><input class="form-input" type="number" step="0.01" name="ratePerLiter" value="${item?.ratePerLiter||''}" required></div>
          </div>
          <div class="form-group"><label class="form-label">Payment Terms</label><textarea class="form-textarea" name="paymentTerms">${item?.paymentTerms||''}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" type="date" name="startDate" value="${item?.startDate||today()}"></div>
            <div class="form-group"><label class="form-label">End Date</label><input class="form-input" type="date" name="endDate" value="${item?.endDate||nextYear}"></div>
          </div>
          <div class="form-group checkbox-group">
            <input type="checkbox" id="buyerActive" name="isActive" ${item?.isActive!==false?'checked':''}>
            <label for="buyerActive">Currently Active</label>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button type="submit" class="btn btn-primary" style="flex:1">${item ? 'Update' : 'Add'} Buyer</button>
            <button type="button" class="btn btn-outline" onclick="state.showModal=null;state.editingItem=null;render()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function renderPaymentModal() {
  const item = state.editingItem;
  return `<div class="modal-overlay" onclick="if(event.target===this){state.showModal=null;state.editingItem=null;render()}">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">💳 ${item ? 'Edit Payment' : 'Add New Payment'}</div>
        <button class="modal-close" onclick="state.showModal=null;state.editingItem=null;render()">✕</button>
      </div>
      <div class="modal-body">
        <form id="paymentForm">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Payment Type</label>
              <select class="form-select" name="type">
                <option value="income" ${item?.type==='income'||!item?'selected':''}>Income (Received)</option>
                <option value="expense" ${item?.type==='expense'?'selected':''}>Expense (Paid)</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" name="date" value="${item?.date||today()}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">To/From *</label><input class="form-input" name="toFrom" value="${item?.toFrom||''}" required></div>
            <div class="form-group"><label class="form-label">Amount (₹) *</label><input class="form-input" type="number" step="0.01" name="amount" value="${item?.amount||''}" required></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Payment Mode</label>
              <select class="form-select" name="mode">
                <option value="cash" ${item?.mode==='cash'||!item?'selected':''}>Cash</option>
                <option value="upi" ${item?.mode==='upi'?'selected':''}>UPI</option>
                <option value="bank" ${item?.mode==='bank'?'selected':''}>Bank Transfer</option>
                <option value="cheque" ${item?.mode==='cheque'?'selected':''}>Cheque</option>
              </select>
            </div>
            <div class="form-group"><label class="form-label">Invoice ID</label><input class="form-input" name="invoiceId" value="${item?.invoiceId||''}"></div>
          </div>
          <div class="form-group"><label class="form-label">Notes</label><textarea class="form-textarea" name="notes">${item?.notes||''}</textarea></div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button type="submit" class="btn btn-primary" style="flex:1">${item ? 'Update' : 'Add'} Payment</button>
            <button type="button" class="btn btn-outline" onclick="state.showModal=null;state.editingItem=null;render()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function renderEditRateModal() {
  return `<div class="modal-overlay" onclick="if(event.target===this){state.showModal=null;render()}">
    <div class="modal" style="max-width:400px">
      <div class="modal-header">
        <div class="modal-title">✏️ Edit Milk Rate</div>
        <button class="modal-close" onclick="state.showModal=null;render()">✕</button>
      </div>
      <div class="modal-body">
        <form id="rateForm">
          <div class="form-group"><label class="form-label">Rate per Liter (₹) *</label>
            <input class="form-input" type="number" step="0.1" name="rate" value="${state.currentRate}" required autofocus>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button type="submit" class="btn btn-primary" style="flex:1">Save Rate</button>
            <button type="button" class="btn btn-outline" onclick="state.showModal=null;render()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function renderConfirmDialog() {
  const t = getT();
  return `<div class="modal-overlay">
    <div class="modal" style="max-width:400px">
      <div class="modal-body confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">${t.deleteTitle}</div>
        <div class="confirm-desc">${t.confirmDelete}</div>
        <div class="confirm-actions">
          <button class="btn btn-outline" onclick="state.showModal=null;state.confirmAction=null;render()">${t.cancel}</button>
          <button class="btn btn-danger" onclick="if(state.confirmAction)state.confirmAction()">Confirm</button>
        </div>
      </div>
    </div>
  </div>`;
}

// ===== EVENT ATTACHMENT =====
function attachEvents() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      state.rememberMe = document.getElementById('rememberMe')?.checked || false;
      if (!handleLogin(fd.get('email'), fd.get('password'))) {
        document.getElementById('authError').textContent = 'Invalid email or password';
      }
    });
  }

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(registerForm);
      if (fd.get('password') !== fd.get('confirmPassword')) {
        document.getElementById('authError').textContent = 'Passwords do not match';
        return;
      }
      const result = handleRegister({
        name: fd.get('name'), email: fd.get('email'), password: fd.get('password'),
        phone: fd.get('phone')||'', address: fd.get('address')||'', farmName: fd.get('farmName')
      });
      if (result !== true) document.getElementById('authError').textContent = result;
    });
  }

  // Switch auth mode
  document.getElementById('switchToRegister')?.addEventListener('click', (e) => { e.preventDefault(); state.isRegistering = true; render(); });
  document.getElementById('switchToLogin')?.addEventListener('click', (e) => { e.preventDefault(); state.isRegistering = false; render(); });

  // Cow form
  document.getElementById('cowForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    addCow({
      tagNo: fd.get('tagNo'), name: fd.get('name'), breed: fd.get('breed'),
      dob: fd.get('semenDate') || today(), lactationStage: fd.get('lactationStage'),
      weight: 400, color: fd.get('color'), healthStatus: fd.get('healthStatus'),
      lastCheckup: fd.get('lastCheckup'), notes: fd.get('notes'),
      milkProduction: fd.get('milkProduction'), semenDate: fd.get('semenDate'),
      deliveryDate: fd.get('deliveryDate')
    });
  });

  // Milk form
  document.getElementById('milkForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    addMilkEntry({
      cowId: fd.get('cowId'), date: fd.get('date'), session: fd.get('session'),
      litres: parseFloat(fd.get('litres')), fatPercent: parseFloat(fd.get('fatPercent')),
      snfPercent: parseFloat(fd.get('snfPercent')), notes: fd.get('notes')||''
    });
  });

  // Expense form
  document.getElementById('expenseForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    addExpense({
      date: fd.get('date'), category: fd.get('category'), amount: parseFloat(fd.get('amount')),
      description: fd.get('description'), recipient: fd.get('recipient')
    });
  });

  // Labour form
  document.getElementById('labourForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    addLabour({
      name: fd.get('name'), phone: fd.get('phone'),
      dailyWage: parseFloat(fd.get('dailyWage')), hourlyWage: parseFloat(fd.get('hourlyWage')),
      isActive: document.getElementById('labourActive').checked
    });
  });

  // Buyer form
  document.getElementById('buyerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    addBuyer({
      name: fd.get('name'), company: fd.get('company'), phone: fd.get('phone'),
      email: fd.get('email'), contractType: fd.get('contractType'),
      ratePerLiter: parseFloat(fd.get('ratePerLiter')), paymentTerms: fd.get('paymentTerms'),
      startDate: fd.get('startDate'), endDate: fd.get('endDate'),
      isActive: document.getElementById('buyerActive').checked
    });
  });

  // Payment form
  document.getElementById('paymentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    addPayment({
      type: fd.get('type'), date: fd.get('date'), toFrom: fd.get('toFrom'),
      amount: parseFloat(fd.get('amount')), mode: fd.get('mode'),
      invoiceId: fd.get('invoiceId'), notes: fd.get('notes')
    });
  });

  // Rate form
  document.getElementById('rateForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.currentRate = parseFloat(fd.get('rate'));
    saveData('milkRate', state.currentRate);
    state.showModal = null;
    render();
  });

  // Close profile menu on outside click
  document.addEventListener('click', (e) => {
    if (state.showProfileMenu && !e.target.closest('.profile-btn') && !e.target.closest('.profile-menu')) {
      state.showProfileMenu = false;
      render();
    }
  });
}

// ===== HYPER TOUCH/CLICK ANIMATION SYSTEM =====
function initHyperAnimations() {
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('button, .btn, .tab-btn, .card, .stat-card, .profile-btn, .profile-menu-item, .lang-btn, .badge, a, input[type="submit"], select, .cow-card, .worker-card, .expense-summary-card, .report-stat, tr, .checkbox-group');
    if (!el) return;
    const ripple = document.createElement('span');
    ripple.className = 'hyper-ripple';
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    el.style.position = el.style.position || 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    el.classList.add('hyper-pressed');
    setTimeout(() => ripple.remove(), 700);
  });

  document.addEventListener('pointerup', () => {
    document.querySelectorAll('.hyper-pressed').forEach(el => {
      el.classList.remove('hyper-pressed');
      el.classList.add('hyper-release');
      setTimeout(() => el.classList.remove('hyper-release'), 300);
    });
  });

  document.addEventListener('pointercancel', () => {
    document.querySelectorAll('.hyper-pressed').forEach(el => el.classList.remove('hyper-pressed'));
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .tab-btn');
    if (!btn) return;
    const colors = ['#1a8c3a', '#22b84a', '#e6a817', '#f0c040', '#146b2d'];
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span');
      p.className = 'hyper-particle';
      p.style.left = e.clientX + 'px';
      p.style.top = e.clientY + 'px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.setProperty('--tx', (Math.random() - 0.5) * 120 + 'px');
      p.style.setProperty('--ty', (Math.random() - 0.5) * 120 + 'px');
      p.style.setProperty('--r', Math.random() * 720 + 'deg');
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
  });
}

// ===== INIT =====
function init() {
  const savedFarmer = localStorage.getItem('dairy_currentFarmer');
  if (savedFarmer) {
    state.currentFarmer = JSON.parse(savedFarmer);
    state.isLoggedIn = true;
    loadFarmerData(state.currentFarmer.id);
  }
  render();
  initHyperAnimations();
}

init();
