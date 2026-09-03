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
localStorage.setItem(dairy_${key}_${state.currentFarmer.id}, JSON.stringify(data));
}
}
function loadFarmerData(farmerId) {
const load = (key, def) => {
const d = localStorage.getItem(dairy_${key}_${farmerId});
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
if (existing.some(e => e.session === data.session)) { alert(${data.session} entry already exists for this date); return; }
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
doc.text(${state.currentFarmer.farmName} - Dairy Report, 20, y);
y += 10; doc.setFontSize(10); doc.setTextColor(100);
doc.text(Generated: ${new Date().toLocaleDateString()}, 20, y);
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
doc.save(dairy-report-${today()}.pdf);
}
function shareOnWhatsApp() {
const stats = getStats();
const msg = 🐄 Dairy Report\n\nFarm: ${state.currentFarmer.farmName}\nToday's Milk: ${stats.todayMilk}L\nTotal Cows: ${stats.totalCows}\nMonthly Expenses: ₹${stats.monthlyExpenses}\nDate: ${new Date().toLocaleDateString()};
window.open(https://wa.me/?text=${encodeURIComponent(msg)}, '_blank');
}
function shareAllReports() {
const stats = getStats();
const totalIncome = state.payments.filter(p => p.type === 'income').reduce((s,p) => s + p.amount, 0);
const totalExpense = state.payments.filter(p => p.type === 'expense').reduce((s,p) => s + p.amount, 0);
let msg = *🐄 ${state.currentFarmer.farmName} - COMPLETE DAIRY REPORT*\n\n;
msg += 📊 *DASHBOARD*\nTotal Cows: ${stats.totalCows}\nToday's Milk: ${stats.todayMilk}L\nMonthly Expenses: ₹${stats.monthlyExpenses}\n;
msg += Active Buyers: ${stats.activeBuyers}\nActive Workers: ${stats.activeLabour}\n\n;
msg += 💳 *FINANCES*\nTotal Income: ₹${totalIncome}\nTotal Expenses: ₹${totalExpense}\nNet Balance: ₹${totalIncome - totalExpense}\n;
msg += \n📅 Generated: ${new Date().toLocaleDateString()}\n📱 Dairy Management App;
window.open(https://wa.me/?text=${encodeURIComponent(msg)}, '_blank');
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
return <div class="auth-container"> <div class="auth-card"> <div class="auth-header"> <div class="auth-icon">🐄</div> <h1 class="auth-title">Register Farm</h1> <p class="auth-subtitle">Create your farm account</p> </div> <form id="registerForm"> <div class="form-group"> <label class="form-label">${t.name} *</label> <div class="form-input-icon"><span class="icon">👤</span> <input class="form-input" type="text" name="name" placeholder="Your full name" required> </div> </div> <div class="form-group"> <label class="form-label">${t.farmName} *</label> <div class="form-input-icon"><span class="icon">🏠</span> <input class="form-input" type="text" name="farmName" placeholder="Your farm name" required> </div> </div> <div class="form-group"> <label class="form-label">${t.phone}</label> <div class="form-input-icon"><span class="icon">📞</span> <input class="form-input" type="tel" name="phone" placeholder="Phone number"> </div> </div> <div class="form-group"> <label class="form-label">${t.address}</label> <div class="form-input-icon"><span class="icon">📍</span> <textarea class="form-textarea" name="address" placeholder="Farm address" style="padding-left:36px"></textarea> </div> </div> <div class="form-group"> <label class="form-label">${t.email} *</label> <div class="form-input-icon"><span class="icon">✉️</span> <input class="form-input" type="email" name="email" placeholder="Enter your email" required> </div> </div> <div class="form-group"> <label class="form-label">${t.password} *</label> <div class="form-input-icon"><span class="icon">🔒</span> <input class="form-input" type="password" name="password" placeholder="Enter password" required> </div> </div> <div class="form-group"> <label class="form-label">${t.confirmPassword} *</label> <div class="form-input-icon"><span class="icon">🔒</span> <input class="form-input" type="password" name="confirmPassword" placeholder="Confirm password" required> </div> </div> <div id="authError" class="form-error" style="margin-bottom:12px"></div> <button type="submit" class="btn btn-primary btn-full">${t.createAccount}</button> <p class="text-center mt-4" style="font-size:13px"> Already have an account? <a href="#" id="switchToLogin" style="color:var(--primary)">Sign in</a> </p> </form> </div> </div>;
}
return `
🐄
Dairy Manager
Sign in to manage your dairy
${t.email} 
✉️ 
${t.password} 
🔒 
${t.rememberMe} 
${t.signIn} 
Don't have an account? Register 
`; } // ===== MAIN APP ===== function renderMain() { const t = getT(); const tabs = [ {id:'dashboard',label:t.dashboard,icon:'📊'}, {id:'cows',label:t.cows,icon:'🐄'}, {id:'milk',label:t.milk,icon:'🥛'}, {id:'expenses',label:t.expenses,icon:'💰'}, {id:'labour',label:t.labour,icon:'👷'}, {id:'buyers',label:t.buyers,icon:'🚛'}, {id:'payments',label:t.payments,icon:'💳'}, {id:'reports',label:t.reports,icon:'📈'} ]; let content = ''; switch(state.activeTab) { case 'dashboard': content = renderDashboard(); break; case 'cows': content = renderCows(); break; case 'milk': content = renderMilk(); break; case 'expenses': content = renderExpenses(); break; case 'labour': content = renderLabour(); break; case 'buyers': content = renderBuyers(); break; case 'payments': content = renderPayments(); break; case 'reports': content = renderReports(); break; } let modal = ''; if (state.showModal === 'cow') modal = renderCowModal(); else if (state.showModal === 'milk') modal = renderMilkModal(); else if (state.showModal === 'expense') modal = renderExpenseModal(); else if (state.showModal === 'labour') modal = renderLabourModal(); else if (state.showModal === 'buyer') modal = renderBuyerModal(); else if (state.showModal === 'payment') modal = renderPaymentModal(); else if (state.showModal === 'editRate') modal = renderEditRateModal(); else if (state.showModal === 'confirm') modal = renderConfirmDialog(); return ` 
🐄 ${state.currentFarmer.farmName} 
🥛 Rate: ₹${state.currentRate}/L ✏️ 
👤 ${state.currentFarmer.name} ${state.showProfileMenu ? ` 
${state.currentFarmer.name}
${state.currentFarmer.email}
Language / भाषा
🇺🇸 English 🇮🇳 हिन्दी 
🚪 ${t.logout} 
` : ''} 
${tabs.map(tab => ` ${tab.icon} ${tab.label} `).join('')} 
${content}
${modal}`; } function setLanguage(lang) { state.currentFarmer.language = lang; localStorage.setItem('dairy_currentFarmer', JSON.stringify(state.currentFarmer)); state.showProfileMenu = false; render(); } function confirmLogout() { state.showModal = 'confirm'; state.confirmAction = () => { handleLogout(); }; render(); } // ===== DASHBOARD ===== function renderDashboard() { const t = getT(); const stats = getStats(); return ` 
🐄
${t.totalCows}
${stats.totalCows}
${stats.healthyCows} ${t.healthyCows}
🥛
${t.todayMilk}
${stats.todayMilk}L
💰
${t.monthlyExpenses}
₹${stats.monthlyExpenses}
₹
Today's Income
₹${stats.todayIncome}
🥛 Add Milk 💰 Add Expense 📥 ${t.export} PDF 📱 Share Report 
Recent Milk Entries
${state.milkEntries.length === 0 ? '
🥛
No milk entries yet
' : state.milkEntries.slice(-3).map(e => { const cow = state.cows.find(c => c.id === e.cowId); return `
${cow?.name || 'All Cows'}
${e.date} • ${e.session}
${e.litres}L
₹${e.total}
`; }).join('')} 
Recent Expenses
${state.expenses.length === 0 ? '
💰
No expenses yet
' : state.expenses.slice(-3).map(e => `
${e.description}
${e.category} • ${e.date}
₹${e.amount}
`).join('')} 
Today's Summary
Milk Collection${getStats().todayMilk}L
Income₹${getStats().todayIncome}
Active Buyers${getStats().activeBuyers}
Labour${getStats().activeLabour}
`; } // ===== COWS TAB ===== function renderCows() { const t = getT(); return ` 
${t.cows}
➕ ${t.addNew} ${state.cows.length > 0 ? `📱 Share All` : ''} 
${state.cows.length === 0 ? ` 
🐄
No Cows Added
Start by adding your first cow profile
➕ Add First Cow 
` : ` 
${state.cows.map(cow => { const age = new Date().getFullYear() - new Date(cow.dob).getFullYear(); const healthClass = cow.healthStatus === 'healthy' ? 'badge-success' : cow.healthStatus === 'sick' ? 'badge-danger' : 'badge-warning'; let pregnancyHtml = ''; if (cow.healthStatus === 'pregnant' && cow.semenDate && cow.deliveryDate) { const diffDays = Math.max(0, Math.ceil((new Date(cow.deliveryDate) - new Date()) / 86400000)); const months = Math.floor(diffDays / 30), days = diffDays % 30; const remaining = diffDays === 0 ? 'Due today' : months > 0 ? `${months}m ${days}d` : `${days}d`; pregnancyHtml = `
Semen:${cow.semenDate}
Due:${cow.deliveryDate}
Remaining:${remaining}
`; } return `
${cow.name}
Tag: ${cow.tagNo}
✏️ 🗑️ 
Breed:${cow.breed}
Age:${age} years
Lactation:${cow.lactationStage}
Health:${cow.healthStatus}
Milk Prod:${cow.milkProduction || 'N/A'}
${pregnancyHtml} 
`; }).join('')} 
`}`; } function shareCowReport() { let msg = `🐄 *${state.currentFarmer.farmName} - Cow Report*\n📅 ${new Date().toLocaleDateString()}\n\n`; msg += `Total: ${state.cows.length} | Healthy: ${state.cows.filter(c=>c.healthStatus==='healthy').length} | Sick: ${state.cows.filter(c=>c.healthStatus==='sick').length} | Pregnant: ${state.cows.filter(c=>c.healthStatus==='pregnant').length}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); } // ===== MILK TAB ===== function renderMilk() { const t = getT(); return ` 
${t.milk}
➕ Add Entry 📱 ${t.share} 
${state.milkEntries.length === 0 ? ` 
🥛
No Milk Entries
Start recording your daily milk production
➕ Add First Entry 
` : ` 
DateCowSessionLitresFat%SNF%RateTotalActions ${state.milkEntries.map(e => { const cow = state.cows.find(c => c.id === e.cowId); return `${e.date}${cow?.name || 'All Cows'}${e.session}${e.litres}L${e.fatPercent}%${e.snfPercent}%₹${e.rate}₹${e.total}🗑️`; }).join('')} 
`} 
`; } function shareMilkReport() { const stats = getStats(); let msg = `🥛 *${state.currentFarmer.farmName} - Milk Report*\nToday: ${stats.todayMilk}L\nTotal Records: ${state.milkEntries.length}\nRevenue: ₹${state.milkEntries.reduce((s,e)=>s+e.total,0)}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); } // ===== EXPENSES TAB ===== function renderExpenses() { const t = getT(); return ` 
${t.expenses}
➕ ${t.addExpense} 📱 ${t.share} 
${EXPENSE_CATEGORIES.map(cat => { const catExp = state.expenses.filter(e => e.category === cat.value); const total = catExp.reduce((s,e) => s + e.amount, 0); return `
${cat.icon}
₹${total}
${cat.label}
${catExp.length} entries
`; }).join('')} 
${state.expenses.length === 0 ? ` 
💰
No Expenses Added
Start managing your farm expenses
➕ Add First Expense 
` : ` 
DateCategoryDescriptionAmountRecipientActions ${state.expenses.map(e => { const cat = EXPENSE_CATEGORIES.find(c => c.value === e.category); return `${e.date}${cat?.icon||''} ${cat?.label||e.category}${e.description}₹${e.amount}${e.recipient||'-'} ✏️ 🗑️ `; }).join('')} 
`} 
`; } function shareExpenseReport() { let msg = `💰 *${state.currentFarmer.farmName} - Expenses*\nTotal: ₹${state.expenses.reduce((s,e)=>s+e.amount,0)}\nEntries: ${state.expenses.length}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); } // ===== LABOUR TAB ===== function renderLabour() { const t = getT(); return ` 
${t.labour}
➕ ${t.addLabour} 
${state.labour.length === 0 ? ` 
👷
No Workers Added
Start managing your farm workers
➕ Add First Worker 
` : ` 
${state.labour.map(w => ` 
${w.name}
📞 ${w.phone}
✏️ 🗑️ 
Daily Wage:₹${w.dailyWage}
Hourly Wage:₹${w.hourlyWage}
Status:${w.isActive?'Active':'Inactive'}
`).join('')} 
`}`; } // ===== BUYERS TAB ===== function renderBuyers() { const t = getT(); return ` 
${t.buyers}
➕ ${t.addBuyer} 
${state.buyers.length === 0 ? ` 
🚛
No Buyers Added
Start managing your milk buyers
➕ Add First Buyer 
` : ` 
NameCompanyPhoneRate/LContractStatusActions ${state.buyers.map(b => `${b.name}${b.company||'-'}${b.phone}₹${b.ratePerLiter}${b.contractType}${b.isActive?'Active':'Inactive'} ✏️ 🗑️ `).join('')} 
`}`; } // ===== PAYMENTS TAB ===== function renderPayments() { const t = getT(); const totalIncome = state.payments.filter(p => p.type === 'income').reduce((s,p) => s + p.amount, 0); const totalExpense = state.payments.filter(p => p.type === 'expense').reduce((s,p) => s + p.amount, 0); return ` 
${t.payments}
➕ ${t.addPayment} 
💚
₹${totalIncome}
Total Income
💔
₹${totalExpense}
Total Expenses
📊
₹${totalIncome-totalExpense}
Net Balance
${state.payments.length === 0 ? ` 
💳
No Payments Recorded
Track your income and expenses
➕ Add First Payment 
` : ` 
DateTypeTo/FromAmountModeInvoiceActions ${state.payments.map(p => `${p.date}${p.type}${p.toFrom}${p.type==='income'?'+':'-'}₹${p.amount}${p.mode}${p.invoiceId||'-'} ✏️ 🗑️ `).join('')} 
`} 
`; } // ===== REPORTS TAB ===== function renderReports() { const t = getT(); const stats = getStats(); const totalRevenue = state.milkEntries.reduce((s,e) => s + e.total, 0); const totalExpenses = state.expenses.reduce((s,e) => s + e.amount, 0); return ` 
${t.reports}
📥 ${t.export} PDF 📱 ${t.shareAllReports} 
🐄
${state.cows.length}
Total Cows
🥛
${state.milkEntries.reduce((s,e)=>s+e.litres,0)}L
Total Milk
💰
₹${totalExpenses}
Total Expenses
📈
₹${totalRevenue}
Milk Revenue
This Month's Performance
Milk Production:${stats.todayMilk*30}L (est.)
Total Expenses:₹${stats.monthlyExpenses}
Revenue:₹${stats.todayMilk*30*state.currentRate} (est.)
Net Profit:₹${(stats.todayMilk*30*state.currentRate)-stats.monthlyExpenses}
Quick Stats
Active Workers:${stats.activeLabour}
Active Buyers:${stats.activeBuyers}
Healthy Cows:${stats.healthyCows}/${stats.totalCows}
Avg Milk/Day/Cow:${stats.totalCows?(stats.todayMilk/stats.totalCows).toFixed(1):0}L
`; } // ===== MODALS ===== function renderCowModal() { const item = state.editingItem; return `
🐄 ${item ? 'Edit Cow' : 'Add New Cow'}
✕ 
Tag Number *
Name *
Breed ${BREEDS.map(b=>`${b}`).join('')} 
Lactation Stage DryEarly LactationPeak LactationLate Lactation 
Color
Health Status HealthySickPregnant 
Milk Production GoodAverageLowDry 
Last Checkup
Semen Date
Expected Delivery
Notes${item?.notes||''}
${item ? 'Update Cow' : 'Add Cow'} Cancel 
`; } function autoDeliveryDate(semenDate) { if (semenDate) { const d = new Date(semenDate); d.setDate(d.getDate() + 283); document.getElementById('deliveryDateInput').value = d.toISOString().split('T')[0]; } } function renderMilkModal() { return `
🥛 Add Milk Entry
✕ 
Cow * All Cows ${state.cows.map(c=>`${c.name} (${c.tagNo})`).join('')} 
Date *
Session MorningEvening 
Litres *
Fat % *
SNF % *
Notes
Add Entry Cancel 
`; } function renderExpenseModal() { const item = state.editingItem; return `
💰 ${item ? 'Edit Expense' : 'Add New Expense'}
✕ 
Date
Category ${EXPENSE_CATEGORIES.map(c=>`${c.label}`).join('')} 
Amount (₹) *
Recipient *
Description *${item?.description||''}
${item ? 'Update' : 'Add'} Expense Cancel 
`; } function renderLabourModal() { const item = state.editingItem; return `
👷 ${item ? 'Edit Worker' : 'Add New Worker'}
✕ 
Name *
Phone *
Daily Wage (₹) *
Hourly Wage (₹) *
Currently Active 
${item ? 'Update' : 'Add'} Worker Cancel 
`; } function renderBuyerModal() { const item = state.editingItem; const nextYear = new Date(Date.now()+365*86400000).toISOString().split('T')[0]; return `
🚛 ${item ? 'Edit Buyer' : 'Add New Buyer'}
✕ 
Contact Name *
Company
Phone *
Email
Contract Type Fixed RateSliding Rate 
Rate/Liter (₹) *
Payment Terms${item?.paymentTerms||''}
Start Date
End Date
Currently Active 
${item ? 'Update' : 'Add'} Buyer Cancel 
`; } function renderPaymentModal() { const item = state.editingItem; return `
💳 ${item ? 'Edit Payment' : 'Add New Payment'}
✕ 
Payment Type Income (Received)Expense (Paid) 
Date
To/From *
Amount (₹) *
Payment Mode CashUPIBank TransferCheque 
Invoice ID
Notes${item?.notes||''}
${item ? 'Update' : 'Add'} Payment Cancel 
`; } function renderEditRateModal() { return `
✏️ Edit Milk Rate
✕ 
Rate per Liter (₹) * 
Save Rate Cancel 
`; } function renderConfirmDialog() { const t = getT(); return `
⚠️
${t.deleteTitle}
${t.confirmDelete}
${t.cancel} Confirm 
`; } // ===== EVENT ATTACHMENT ===== function attachEvents() { // Login form const loginForm = document.getElementById('loginForm'); if (loginForm) { loginForm.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(loginForm); state.rememberMe = document.getElementById('rememberMe')?.checked || false; if (!handleLogin(fd.get('email'), fd.get('password'))) { document.getElementById('authError').textContent = 'Invalid email or password'; } }); } // Register form const registerForm = document.getElementById('registerForm'); if (registerForm) { registerForm.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(registerForm); if (fd.get('password') !== fd.get('confirmPassword')) { document.getElementById('authError').textContent = 'Passwords do not match'; return; } const result = handleRegister({ name: fd.get('name'), email: fd.get('email'), password: fd.get('password'), phone: fd.get('phone')||'', address: fd.get('address')||'', farmName: fd.get('farmName') }); if (result !== true) document.getElementById('authError').textContent = result; }); } // Switch auth mode document.getElementById('switchToRegister')?.addEventListener('click', (e) => { e.preventDefault(); state.isRegistering = true; render(); }); document.getElementById('switchToLogin')?.addEventListener('click', (e) => { e.preventDefault(); state.isRegistering = false; render(); }); // Cow form document.getElementById('cowForm')?.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(e.target); addCow({ tagNo: fd.get('tagNo'), name: fd.get('name'), breed: fd.get('breed'), dob: fd.get('semenDate') || today(), lactationStage: fd.get('lactationStage'), weight: 400, color: fd.get('color'), healthStatus: fd.get('healthStatus'), lastCheckup: fd.get('lastCheckup'), notes: fd.get('notes'), milkProduction: fd.get('milkProduction'), semenDate: fd.get('semenDate'), deliveryDate: fd.get('deliveryDate') }); }); // Milk form document.getElementById('milkForm')?.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(e.target); addMilkEntry({ cowId: fd.get('cowId'), date: fd.get('date'), session: fd.get('session'), litres: parseFloat(fd.get('litres')), fatPercent: parseFloat(fd.get('fatPercent')), snfPercent: parseFloat(fd.get('snfPercent')), notes: fd.get('notes')||'' }); }); // Expense form document.getElementById('expenseForm')?.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(e.target); addExpense({ date: fd.get('date'), category: fd.get('category'), amount: parseFloat(fd.get('amount')), description: fd.get('description'), recipient: fd.get('recipient') }); }); // Labour form document.getElementById('labourForm')?.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(e.target); addLabour({ name: fd.get('name'), phone: fd.get('phone'), dailyWage: parseFloat(fd.get('dailyWage')), hourlyWage: parseFloat(fd.get('hourlyWage')), isActive: document.getElementById('labourActive').checked }); }); // Buyer form document.getElementById('buyerForm')?.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(e.target); addBuyer({ name: fd.get('name'), company: fd.get('company'), phone: fd.get('phone'), email: fd.get('email'), contractType: fd.get('contractType'), ratePerLiter: parseFloat(fd.get('ratePerLiter')), paymentTerms: fd.get('paymentTerms'), startDate: fd.get('startDate'), endDate: fd.get('endDate'), isActive: document.getElementById('buyerActive').checked }); }); // Payment form document.getElementById('paymentForm')?.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(e.target); addPayment({ type: fd.get('type'), date: fd.get('date'), toFrom: fd.get('toFrom'), amount: parseFloat(fd.get('amount')), mode: fd.get('mode'), invoiceId: fd.get('invoiceId'), notes: fd.get('notes') }); }); // Rate form document.getElementById('rateForm')?.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(e.target); state.currentRate = parseFloat(fd.get('rate')); saveData('milkRate', state.currentRate); state.showModal = null; render(); }); // Close profile menu on outside click document.addEventListener('click', (e) => { if (state.showProfileMenu && !e.target.closest('.profile-btn') && !e.target.closest('.profile-menu')) { state.showProfileMenu = false; render(); } }); } // ===== INIT ===== function init() { const savedFarmer = localStorage.getItem('dairy_currentFarmer'); if (savedFarmer) { state.currentFarmer = JSON.parse(savedFarmer); state.isLoggedIn = true; loadFarmerData(state.currentFarmer.id); } render(); } init(); 
