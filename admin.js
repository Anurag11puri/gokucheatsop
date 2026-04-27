// Admin Panel Logic

// Wait for auth to initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Give auth.js a moment to restore session
  setTimeout(checkAdminAuth, 1000);
});

async function checkAdminAuth() {
  const { data: { session } } = await _sb.auth.getSession();
  if (!session || session.user.user_metadata?.is_admin !== true) {
    document.body.innerHTML = '<div style="text-align:center; margin-top:20vh; font-family:sans-serif;"><h2>Access Denied</h2><p>You do not have administrative privileges.</p><a href="index.html" style="color:#a855f7;">Return Home</a></div>';
    return;
  }
  
  // Load initial data
  loadDashboardStats();
  loadProducts();
  loadOrders();
  loadPanels();
  loadPurchases();
  loadAnnouncements();
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
  
  event.target.classList.add('active');
  document.getElementById('sec-' + tab).classList.add('active');
  
  if (tab === 'resellers') loadResellers();
}

// --- PRODUCTS ---
let allProducts = [];
async function loadProducts() {
  const { data, error } = await _sb.from('products').select('*').order('created_at', { ascending: false });
  const tbody = document.getElementById('products-tbody');
  if (error || !data.length) { tbody.innerHTML = '<tr><td colspan="4">No products found.</td></tr>'; return; }
  
  allProducts = data;
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>$${p.price}</td>
      <td><span style="background:rgba(168,85,247,0.2); padding:2px 6px; border-radius:4px; font-size:0.75rem;">${p.tag || 'None'}</span></td>
      <td>
        <button class="btn-sm" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn-sm btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function editProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if(!p) return;
  document.getElementById('product-form-title').textContent = 'Edit Product';
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.name;
  
  // Load plans
  const plans = p.plans || {};
  document.getElementById('price-1d-inr').value = plans['1 Day']?.inr || '';
  document.getElementById('price-1d-usd').value = plans['1 Day']?.usd || '';
  document.getElementById('price-7d-inr').value = plans['1 Week']?.inr || '';
  document.getElementById('price-7d-usd').value = plans['1 Week']?.usd || '';
  document.getElementById('price-30d-inr').value = plans['1 Month']?.inr || '';
  document.getElementById('price-30d-usd').value = plans['1 Month']?.usd || '';
  document.getElementById('price-perm-inr').value = plans['Permanent']?.inr || '';
  document.getElementById('price-perm-usd').value = plans['Permanent']?.usd || '';

  document.getElementById('prod-tag').value = p.tag || '';
  document.getElementById('prod-video').value = p.video_url || '';
  document.getElementById('prod-desc').value = p.description || '';
  document.getElementById('prod-features').value = p.features && Array.isArray(p.features) ? p.features.join('\n') : '';
  document.getElementById('add-product-form').style.display = 'block';
}

function cancelProductEdit() {
  document.getElementById('product-form-title').textContent = 'Add New Product';
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-name').value = '';
  
  // Clear prices
  ['1d-inr', '1d-usd', '7d-inr', '7d-usd', '30d-inr', '30d-usd', 'perm-inr', 'perm-usd'].forEach(id => {
    document.getElementById('price-' + id).value = '';
  });

  document.getElementById('prod-tag').value = '';
  document.getElementById('prod-video').value = '';
  document.getElementById('prod-desc').value = '';
  document.getElementById('prod-features').value = '';
  document.getElementById('add-product-form').style.display = 'none';
}

async function saveProduct() {
  const id = document.getElementById('prod-id').value;
  const name = document.getElementById('prod-name').value;
  const tag = document.getElementById('prod-tag').value;
  const video_url = document.getElementById('prod-video').value;
  const desc = document.getElementById('prod-desc').value;
  
  // Build plans object
  const plans = {
    '1 Day': { inr: document.getElementById('price-1d-inr').value, usd: document.getElementById('price-1d-usd').value },
    '1 Week': { inr: document.getElementById('price-7d-inr').value, usd: document.getElementById('price-7d-usd').value },
    '1 Month': { inr: document.getElementById('price-30d-inr').value, usd: document.getElementById('price-30d-usd').value },
    'Permanent': { inr: document.getElementById('price-perm-inr').value, usd: document.getElementById('price-perm-usd').value }
  };

  // Find lowest INR price to use as the display 'price' column
  let minPrice = 0;
  Object.values(plans).forEach(p => {
    const val = parseFloat(p.inr);
    if(val > 0 && (minPrice === 0 || val < minPrice)) minPrice = val;
  });

  const fVal = document.getElementById('prod-features').value.trim();
  let features = fVal ? fVal.split('\n').map(s => s.trim()).filter(s => s) : null;
  
  if(!name) return alert("Name required");
  
  const productData = { name, price: minPrice, plans, tag, video_url, description: desc, features };
  console.log("Saving product data:", productData);

  let result;
  if(id) {
    result = await _sb.from('products').update(productData).eq('id', id);
  } else {
    result = await _sb.from('products').insert([productData]);
  }
  
  if (result.error) {
    console.error("Supabase Error:", result.error);
    alert("Error saving product: " + result.error.message + "\n\nTip: Make sure you added the 'plans' column (JSONB) to your products table in Supabase!");
    return;
  }
  
  cancelProductEdit();
  loadProducts();
  loadDashboardStats();
}

async function deleteProduct(id) {
  if(!confirm("Delete this product?")) return;
  await _sb.from('products').delete().eq('id', id);
  loadProducts();
  loadDashboardStats();
}

// --- ORDERS & PAYMENTS ---
let allOrders = [];
async function loadOrders() {
  const { data, error } = await _sb.from('orders').select('*').order('created_at', { ascending: false });
  const tbody = document.getElementById('orders-tbody');
  if (error || !data || !data.length) { tbody.innerHTML = '<tr><td colspan="7">No orders found.</td></tr>'; return; }
  
  allOrders = data;
  tbody.innerHTML = data.map(o => `
    <tr>
      <td title="${o.user_id}">${o.user_email || o.user_id.substring(0,8)+'...'}</td>
      <td><strong>${o.product_name}</strong></td>
      <td>${o.product_price}</td>
      <td style="letter-spacing:1px; color:#22d3ee;">${o.utr}</td>
      <td><span style="color:${o.status === 'approved' ? '#4ade80' : (o.status === 'pending' ? '#f59e0b' : '#ef4444')}">${o.status.toUpperCase()}</span></td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>
        ${o.status === 'pending' ? `<button class="btn-sm" style="background:#22c55e; border-color:#22c55e; margin-bottom:4px;" onclick="approveOrder('${o.id}', '${o.user_id}', '${o.product_name}')">Approve</button>` : ''}
        ${o.user_email ? `<button class="btn-sm" style="background:#3b82f6; border-color:#3b82f6; margin-bottom:4px;" onclick="prompt('Copy the user\\'s email address to send manually:', '${o.user_email}')">Get Email</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deleteOrder('${o.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function approveOrder(id, userId, productName) {
  document.getElementById('approve-order-id').value = id;
  document.getElementById('approve-user-id').value = userId;
  document.getElementById('approve-deliverable').value = '';
  document.getElementById('approve-order-form').style.display = 'block';
  document.getElementById('approve-order-title').textContent = 'Approve: ' + productName;
}

async function confirmApproveOrder() {
  const id = document.getElementById('approve-order-id').value;
  const userId = document.getElementById('approve-user-id').value;
  const deliverable = document.getElementById('approve-deliverable').value;
  
  if(!deliverable) return alert('Please enter the key or download link to deliver!');

  // Update order status
  await _sb.from('orders').update({ status: 'approved', deliverable: deliverable }).eq('id', id);
  
  document.getElementById('approve-order-form').style.display = 'none';
  loadOrders();
}

async function deleteOrder(id) {
  if(!confirm("Delete this order?")) return;
  await _sb.from('orders').delete().eq('id', id);
  loadOrders();
}

// --- PANELS ---
let allPanels = [];
async function loadPanels() {
  const { data, error } = await _sb.from('free_panels').select('*').order('created_at', { ascending: false });
  const tbody = document.getElementById('panels-tbody');
  if (error || !data.length) { tbody.innerHTML = '<tr><td colspan="4">No panels found.</td></tr>'; return; }
  
  allPanels = data;
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.slots}</td>
      <td style="color:${p.status==='active'?'#4ade80':'#ef4444'}">${p.status.toUpperCase()}</td>
      <td>
        <button class="btn-sm" onclick="editPanel('${p.id}')">Edit</button>
        <button class="btn-sm btn-danger" onclick="deletePanel('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function editPanel(id) {
  const p = allPanels.find(x => x.id === id);
  if(!p) return;
  document.getElementById('panel-form-title').textContent = 'Edit Free Panel';
  document.getElementById('pan-id').value = p.id;
  document.getElementById('pan-name').value = p.name;
  document.getElementById('pan-slots').value = p.slots;
  document.getElementById('pan-status').value = p.status;
  document.getElementById('add-panel-form').style.display = 'block';
}

function cancelPanelEdit() {
  document.getElementById('panel-form-title').textContent = 'Add Free Panel';
  document.getElementById('pan-id').value = '';
  document.getElementById('pan-name').value = '';
  document.getElementById('pan-slots').value = '10';
  document.getElementById('pan-status').value = 'active';
  document.getElementById('add-panel-form').style.display = 'none';
}

async function savePanel() {
  const id = document.getElementById('pan-id').value;
  const name = document.getElementById('pan-name').value;
  const slots = document.getElementById('pan-slots').value;
  const status = document.getElementById('pan-status').value;
  if(!name) return alert("Name required");
  
  if (id) {
    await _sb.from('free_panels').update({ name, slots: parseInt(slots), status }).eq('id', id);
  } else {
    await _sb.from('free_panels').insert([{ name, slots: parseInt(slots), status }]);
  }
  
  cancelPanelEdit();
  loadPanels();
}

async function deletePanel(id) {
  if(!confirm("Delete this panel?")) return;
  await _sb.from('free_panels').delete().eq('id', id);
  loadPanels();
}

// --- ANNOUNCEMENTS ---
async function loadAnnouncements() {
  const { data, error } = await _sb.from('announcements').select('*').order('created_at', { ascending: false });
  const tbody = document.getElementById('announcements-tbody');
  if (error || !data.length) { tbody.innerHTML = '<tr><td colspan="3">No announcements.</td></tr>'; return; }
  
  tbody.innerHTML = data.map(a => `
    <tr>
      <td>${a.message}</td>
      <td style="color:${a.is_active?'#4ade80':'#64748b'}">${a.is_active ? 'ACTIVE' : 'INACTIVE'}</td>
      <td>
        ${a.is_active ? `<button class="btn-sm btn-danger" onclick="deactivateAnn('${a.id}')">Deactivate</button>` : ''}
        <button class="btn-sm btn-danger" onclick="deleteAnn('${a.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

async function broadcastAnnouncement() {
  const msg = document.getElementById('ann-message').value;
  if(!msg) return alert("Message required");
  
  // deactivate old ones
  await _sb.from('announcements').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  
  await _sb.from('announcements').insert([{ message: msg, is_active: true }]);
  document.getElementById('ann-message').value = '';
  loadAnnouncements();
}

async function deactivateAnn(id) {
  await _sb.from('announcements').update({ is_active: false }).eq('id', id);
  loadAnnouncements();
}

async function deleteAnn(id) {
  await _sb.from('announcements').delete().eq('id', id);
  loadAnnouncements();
}

// --- USERS & PURCHASES ---
async function loadPurchases() {
  const { data, error } = await _sb.from('purchases').select('*').order('created_at', { ascending: false });
  const tbody = document.getElementById('users-tbody');
  if (error || !data.length) { tbody.innerHTML = '<tr><td colspan="4">No subscriptions yet.</td></tr>'; return; }
  
  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.user_email}</td>
      <td><strong>${p.product_name}</strong></td>
      <td style="color:#4ade80">${p.status}</td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
    </tr>
  `).join('');
}



async function loadDashboardStats() {
  const { count: uCount } = await _sb.from('purchases').select('*', { count: 'exact', head: true });
  const { count: pCount } = await _sb.from('products').select('*', { count: 'exact', head: true });
  
  document.getElementById('stat-users').textContent = uCount || 0;
  document.getElementById('stat-prods').textContent = pCount || 0;
  document.getElementById('stat-sales').textContent = '$' + ((uCount || 0) * 15); // dummy calc
}

// --- RESELLERS ---
let allResellers = [];
let allResellerApps = [];

async function loadResellers() {
  // Load applications
  const { data: apps } = await _sb.from('reseller_applications').select('*').order('created_at', { ascending: false });
  const appTbody = document.getElementById('reseller-applications-tbody');
  if (!apps || !apps.length) {
    appTbody.innerHTML = '<tr><td colspan="5" style="color:#64748b;">No pending applications.</td></tr>';
  } else {
    allResellerApps = apps;
    appTbody.innerHTML = apps.filter(a => a.status === 'pending').map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td style="color:#94a3b8;">${a.contact}</td>
        <td style="color:#22d3ee;letter-spacing:1px;">${a.utr}</td>
        <td>${new Date(a.created_at).toLocaleDateString()}</td>
        <td>
          <button class="btn-sm" style="background:rgba(252,211,77,.2);border-color:#fcd34d;color:#fcd34d;" onclick="quickApproveApp('${a.id}','${a.name}','${a.contact}')">✅ Approve</button>
          <button class="btn-sm btn-danger" onclick="deleteResellerApp('${a.id}')">Reject</button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="color:#64748b;">No pending applications.</td></tr>';
  }

  // Load active resellers
  const { data: resellers } = await _sb.from('resellers').select('*').order('created_at', { ascending: false });
  const tbody = document.getElementById('resellers-tbody');
  if (!resellers || !resellers.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:#64748b;">No resellers yet.</td></tr>';
    return;
  }
  allResellers = resellers;
  tbody.innerHTML = resellers.map(r => `
    <tr>
      <td><strong>${r.name}</strong></td>
      <td style="color:#22d3ee;font-weight:600;">${r.username}</td>
      <td style="color:#fcd34d;font-family:monospace;letter-spacing:1px;">${r.password}</td>
      <td style="color:#94a3b8;">${r.contact || '—'}</td>
      <td>${new Date(r.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn-sm btn-danger" onclick="deleteReseller('${r.id}')">🗑 Remove</button>
      </td>
    </tr>
  `).join('');
}

async function createResellerAccount() {
  const name    = document.getElementById('res-create-name').value.trim();
  const username = document.getElementById('res-create-user').value.trim().toLowerCase();
  const password = document.getElementById('res-create-pass').value.trim();
  const contact  = document.getElementById('res-create-contact').value.trim();
  const notes    = document.getElementById('res-create-notes').value.trim();
  const msgEl    = document.getElementById('reseller-create-msg');

  if (!name || !username || !password) {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = '❌ Name, username and password are all required.';
    return;
  }

  const { error } = await _sb.from('resellers').insert([{ name, username, password, contact, notes, is_active: true }]);

  if (error) {
    msgEl.style.color = '#ef4444';
    msgEl.textContent = '❌ Error: ' + error.message;
    return;
  }

  msgEl.style.color = '#4ade80';
  msgEl.textContent = `✅ Reseller "${name}" created! Login: ${username} / ${password}`;
  
  // Clear form
  ['res-create-name','res-create-user','res-create-pass','res-create-contact','res-create-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  
  loadResellers();
}

function quickApproveApp(appId, name, contact) {
  // Pre-fill create form from application
  document.getElementById('res-create-name').value = name;
  document.getElementById('res-create-contact').value = contact;
  document.getElementById('res-create-user').value = name.toLowerCase().replace(/\s+/g, '');
  document.getElementById('res-create-pass').value = 'goku' + Math.floor(1000 + Math.random() * 9000);
  document.getElementById('add-reseller-form').style.display = 'block';
  // Mark application as approved
  _sb.from('reseller_applications').update({ status: 'approved' }).eq('id', appId).then(() => loadResellers());
}

async function deleteResellerApp(id) {
  if (!confirm('Reject and delete this application?')) return;
  await _sb.from('reseller_applications').delete().eq('id', id);
  loadResellers();
}

async function deleteReseller(id) {
  if (!confirm('Remove this reseller? They will lose dashboard access.')) return;
  await _sb.from('resellers').delete().eq('id', id);
  loadResellers();
}
