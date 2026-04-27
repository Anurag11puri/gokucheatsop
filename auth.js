/* ================================================================
   GOKU CHEATS — SUPABASE AUTH SYSTEM
   ================================================================
   SETUP: Fill in your Supabase URL and anon key below.
   See INSTRUCTIONS in the artifact for how to get these.
   ================================================================ */

const SUPABASE_URL = 'https://kiffmcsmfnfmzuwmtjsi.supabase.co';   // e.g. https://xyzxyz.supabase.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZmZtY3NtZm5mbXp1d210anNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjE4MDksImV4cCI6MjA5Mjc5NzgwOX0.g0IbqfmhCVQy576FKrpxvn2mDybMHjsAVZ3SCLO4tsE';

// Init Supabase client (loaded via CDN in index.html)
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

/* ── Init: restore session on load ────────────────────────── */
async function initAuth() {
  // Restore remembered email
  const rememberedEmail = localStorage.getItem('gc_remembered_email');
  const siUser = document.getElementById('si-user');
  const rememberChk = document.querySelector('#form-signin input[type="checkbox"]');
  if (rememberedEmail && siUser) {
    siUser.value = rememberedEmail;
    if (rememberChk) rememberChk.checked = true;
  }

  const { data: { session } } = await _sb.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    const name = session.user.user_metadata?.username || session.user.email;
    updateNavForUser(name);
  }

  _sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      currentUser = session.user;
      const name = session.user.user_metadata?.username || session.user.email;
      updateNavForUser(name);
      closeModal('auth-modal');
    }
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      revertNav();
    }
    if (event === 'USER_UPDATED' && session?.user) {
      currentUser = session.user;
    }
  });
}

/* ── Register / Sign-in ───────────────────────────────────── */
async function handleAuth(e, type) {
  e.preventDefault();

  if (type === 'register') {
    const username = document.getElementById('reg-user').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const p1 = document.getElementById('reg-pass').value;
    const p2 = document.getElementById('reg-pass2').value;

    if (username.length < 3) { showAuthMsg('error', '❌ Username needs 3+ characters.'); return; }
    if (!email.includes('@')) { showAuthMsg('error', '❌ Enter a valid email address.'); return; }
    if (p1.length < 8) { showAuthMsg('error', '❌ Password needs 8+ characters.'); return; }
    if (p1 !== p2) { showAuthMsg('error', '❌ Passwords do not match.'); return; }

    setLoadingBtn('register-submit-btn', true, 'Creating account...');

    const { data, error } = await _sb.auth.signUp({
      email,
      password: p1,
      options: { data: { username } }
    });

    setLoadingBtn('register-submit-btn', false, 'Create Account →');

    if (error) {
      showAuthMsg('error', '❌ ' + (error.message || 'Registration failed.'));
      return;
    }

    if (data.user && !data.session) {
      // Email confirmation required (Supabase default)
      showAuthMsg('success', '✅ Check your email to confirm your account, then sign in!');
    } else {
      showAuthMsg('success', `✅ Welcome, ${username}!`);
    }

  } else {
    const identifier = document.getElementById('si-user').value.trim();
    const password = document.getElementById('si-pass').value;
    const rememberMe = document.querySelector('#form-signin input[type="checkbox"]')?.checked;

    if (!identifier) { showAuthMsg('error', '❌ Enter your email.'); return; }
    if (!password) { showAuthMsg('error', '❌ Enter your password.'); return; }

    setLoadingBtn('signin-submit-btn', true, 'Signing in...');

    const { data, error } = await _sb.auth.signInWithPassword({
      email: identifier,
      password
    });

    setLoadingBtn('signin-submit-btn', false, 'Sign In →');

    if (error) {
      showAuthMsg('error', '❌ Invalid email or password.');
      shakeBtn('signin-submit-btn');
      return;
    }

    // Handle Remember Me
    if (rememberMe) {
      localStorage.setItem('gc_remembered_email', identifier);
    } else {
      localStorage.removeItem('gc_remembered_email');
    }

    showAuthMsg('success', `✅ Welcome back, ${data.user.user_metadata?.username || data.user.email}!`);
  }
}

/* ── Logout ───────────────────────────────────────────────── */
async function logoutUser() {
  await _sb.auth.signOut();
}

/* ── Nav update ───────────────────────────────────────────── */
function updateNavForUser(displayName) {
  const navLinks = document.getElementById('nav-links');
  const userArea = document.getElementById('nav-user-area');
  if (!navLinks || !userArea) return;

  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = currentUser?.user_metadata?.avatar_url;

  // Only hide the auth buttons (Sign In / Register), keep nav links visible
  const signinBtn = document.getElementById('nav-signin-btn');
  const registerBtn = document.getElementById('nav-register-btn');
  if (signinBtn) signinBtn.closest('li').style.display = 'none';
  if (registerBtn) registerBtn.closest('li').style.display = 'none';

  userArea.style.cssText = 'display:flex;align-items:center;';
  
  const avatarHtml = avatarUrl 
    ? `<img src="${avatarUrl}" class="nav-user-avatar" style="object-fit:cover;border:1.5px solid #a855f7;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
       <div class="nav-user-avatar" style="display:none;">${initials}</div>`
    : `<div class="nav-user-avatar">${initials}</div>`;

  const isAdmin = currentUser?.user_metadata?.is_admin === true;
  const adminLinkHtml = isAdmin ? `
        <button class="dropdown-item" onclick="window.location.href='admin.html'" style="color:#22d3ee;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          Admin Panel
        </button>
  ` : '';

  userArea.innerHTML = `
    <div class="nav-user-dropdown-wrap" tabindex="0">
      <div class="nav-user-chip">
        ${avatarHtml}
        <span class="user-display-name">${displayName}</span>
        <svg class="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </div>
      
      <div class="user-dropdown-menu">
        ${adminLinkHtml}
        <button class="dropdown-item" onclick="window.location.href='reseller.html'" style="color:#fcd34d;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          Reseller Panel
        </button>
        <button class="dropdown-item" onclick="openSettings()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          Account Settings
        </button>
        <button class="dropdown-item logout-btn-item" onclick="logoutUser()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Log Out
        </button>
      </div>
    </div>
  `;
}

function revertNav() {
  const signinBtn = document.getElementById('nav-signin-btn');
  const registerBtn = document.getElementById('nav-register-btn');
  if (signinBtn) signinBtn.closest('li').style.display = '';
  if (registerBtn) registerBtn.closest('li').style.display = '';
  const userArea = document.getElementById('nav-user-area');
  if (userArea) { userArea.style.display = 'none'; userArea.innerHTML = ''; }
}

/* ── Settings Modal ───────────────────────────────────────── */
function openSettings() {
  if (!currentUser) return;
  const username = currentUser.user_metadata?.username || currentUser.email;
  const avatarUrl = currentUser.user_metadata?.avatar_url || '';
  
  const el = document.getElementById('settings-current-user');
  const em = document.getElementById('settings-email-display');
  const av = document.getElementById('settings-avatar-preview');
  
  if (el) el.textContent = username;
  if (em) em.textContent = currentUser.email;
  if (av) {
    av.src = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=0D1117&color=fff&size=128`;
    av.style.display = 'block';
  }
  
  document.getElementById('new-username').value = username;
  document.getElementById('new-avatar-url').value = avatarUrl;
  
  document.getElementById('settings-msg').className = 'auth-msg';
  document.getElementById('settings-msg').textContent = '';
  document.getElementById('settings-modal').classList.add('active');
  showSettingsTab('profile');
}

function showSettingsTab(tab) {
  ['profile', 'email', 'security', 'purchases'].forEach(t => {
    document.getElementById('stab-' + t)?.classList.toggle('active', t === tab);
    const form = document.getElementById('sform-' + t);
    if(form) form.style.display = t === tab ? 'flex' : 'none';
  });
  document.getElementById('settings-msg').className = 'auth-msg';
  document.getElementById('settings-msg').textContent = '';
  
  if (tab === 'purchases') {
    loadUserPurchases();
  }
}

async function loadUserPurchases() {
  if (!currentUser) return;
  const listEl = document.getElementById('user-purchases-list');
  listEl.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:0.85rem;">Loading products...</p>';
  
  const { data, error } = await _sb.from('orders')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
    
  if (error || !data || !data.length) {
    listEl.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:0.85rem;">You have not purchased any products yet.</p>';
    return;
  }
  
  listEl.innerHTML = data.map(o => `
    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(168,85,247,0.3); border-radius:8px; padding:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
        <strong style="color:#22d3ee; font-size:0.9rem;">${o.product_name}</strong>
        <span style="font-size:0.7rem; color:${o.status === 'approved' ? '#4ade80' : (o.status === 'pending' ? '#f59e0b' : '#ef4444')}; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px;">${o.status.toUpperCase()}</span>
      </div>
      <div style="font-size:0.8rem; color:#94a3b8;">
        ${o.status === 'approved' ? `<div style="margin-top:5px; padding:8px; background:rgba(34,211,238,0.1); border:1px dashed #22d3ee; border-radius:6px; color:#e2e8f0; word-break:break-all;"><strong>Your Key / Link:</strong><br/>${o.deliverable || 'No details provided'}</div>` : '<p style="margin:0; font-size:0.75rem;">Waiting for admin verification. You will receive an email once approved.</p>'}
      </div>
    </div>
  `).join('');
}

/* ── Change Profile (Avatar & Username) ──────────────────── */
async function handleProfileChange(e) {
  e.preventDefault();
  const newName = document.getElementById('new-username').value.trim();
  let newAvatarUrl = document.getElementById('new-avatar-url').value.trim();
  const fileInput = document.getElementById('avatar-upload');
  
  if (newName.length < 3) { showSettingsMsg('error', '❌ Username needs 3+ characters.'); return; }

  const btn = document.getElementById('save-profile-btn');
  btn.disabled = true; btn.textContent = 'Saving...';

  // Handle File Upload if selected
  if (fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    btn.textContent = 'Uploading image...';
    const { data: uploadData, error: uploadError } = await _sb.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });
      
    if (uploadError) {
      btn.disabled = false; btn.textContent = 'Save Profile';
      showSettingsMsg('error', '❌ Upload failed: ' + uploadError.message);
      return;
    }
    
    const { data: publicUrlData } = _sb.storage.from('avatars').getPublicUrl(fileName);
    newAvatarUrl = publicUrlData.publicUrl;
  }

  btn.textContent = 'Updating profile...';
  const { error } = await _sb.auth.updateUser({ 
    data: { username: newName, avatar_url: newAvatarUrl } 
  });

  btn.disabled = false; btn.textContent = 'Save Profile';

  if (error) { showSettingsMsg('error', '❌ ' + (error.message || 'Update failed.')); return; }
  showSettingsMsg('success', '✅ Profile updated!');
  
  if (currentUser) {
    currentUser.user_metadata.username = newName;
    currentUser.user_metadata.avatar_url = newAvatarUrl;
  }
  
  const av = document.getElementById('settings-avatar-preview');
  if (av) {
    av.src = newAvatarUrl;
    av.style.display = newAvatarUrl ? 'block' : 'none';
  }
  document.getElementById('settings-current-user').textContent = newName;
  updateNavForUser(newName);
  
  // Clear file input
  fileInput.value = '';
}

/* ── Change Email ────────────────────────────────────────── */
async function handleEmailChange(e) {
  e.preventDefault();
  const newEmail = document.getElementById('new-email').value.trim();
  if (!newEmail.includes('@')) { showSettingsMsg('error', '❌ Invalid email.'); return; }

  const btn = document.getElementById('save-email-btn');
  btn.disabled = true; btn.textContent = 'Updating...';

  const { error } = await _sb.auth.updateUser({ email: newEmail });

  btn.disabled = false; btn.textContent = 'Update Email';

  if (error) { showSettingsMsg('error', '❌ ' + (error.message || 'Failed to update email.')); return; }
  showSettingsMsg('success', '✅ Confirmation links sent to both emails. Please verify.');
  document.getElementById('new-email').value = '';
}

/* ── Change password with email OTP ──────────────────────── */
let _otpSent = false;

async function sendPasswordOtp() {
  if (!currentUser) return;
  const btn = document.getElementById('send-otp-btn');
  btn.disabled = true; btn.textContent = 'Sending OTP...';

  const { error } = await _sb.auth.signInWithOtp({
    email: currentUser.email,
    options: { shouldCreateUser: false }
  });

  btn.disabled = false;
  if (error) {
    btn.textContent = 'Send OTP';
    showSettingsMsg('error', '❌ Could not send OTP: ' + error.message);
    return;
  }
  btn.textContent = 'Resend OTP';
  _otpSent = true;
  document.getElementById('otp-section').style.display = 'flex';
  showSettingsMsg('success', `✅ OTP sent to ${currentUser.email}. Check your inbox!`);
}

async function handlePasswordChange(e) {
  e.preventDefault();
  if (!_otpSent) { showSettingsMsg('error', '❌ Please send OTP first.'); return; }

  const otp = document.getElementById('pw-otp').value.trim();
  const newPw = document.getElementById('new-password').value;
  const confPw = document.getElementById('confirm-password').value;

  if (!otp) { showSettingsMsg('error', '❌ Enter the OTP from your email.'); return; }
  if (newPw.length < 8) { showSettingsMsg('error', '❌ Password needs 8+ characters.'); return; }
  if (newPw !== confPw) { showSettingsMsg('error', '❌ Passwords do not match.'); return; }

  const btn = document.getElementById('change-pw-btn');
  btn.disabled = true; btn.textContent = 'Verifying OTP...';

  // Verify OTP (this refreshes the session token)
  const { error: otpErr } = await _sb.auth.verifyOtp({
    email: currentUser.email,
    token: otp,
    type: 'email'
  });

  if (otpErr) {
    btn.disabled = false; btn.textContent = 'Change Password';
    showSettingsMsg('error', '❌ Invalid or expired OTP.'); return;
  }

  btn.textContent = 'Updating password...';

  const { error: pwErr } = await _sb.auth.updateUser({ password: newPw });

  btn.disabled = false; btn.textContent = 'Change Password';

  if (pwErr) { showSettingsMsg('error', '❌ ' + (pwErr.message || 'Password update failed.')); return; }

  showSettingsMsg('success', '✅ Password changed successfully!');
  _otpSent = false;
  document.getElementById('otp-section').style.display = 'none';
  ['pw-otp', 'new-password', 'confirm-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

/* ── Helpers ──────────────────────────────────────────────── */
function showAuthMsg(type, text) {
  const el = document.getElementById('auth-msg');
  if (!el) return;
  el.className = 'auth-msg ' + type;
  el.textContent = text;
}
function clearAuthMsg() {
  const el = document.getElementById('auth-msg');
  if (el) { el.className = 'auth-msg'; el.textContent = ''; }
}
function showSettingsMsg(type, text) {
  const el = document.getElementById('settings-msg');
  if (!el) return;
  el.className = 'auth-msg ' + type;
  el.textContent = text;
}
function switchTab(tab) {
  const isSignin = tab === 'signin';
  document.getElementById('tab-signin').classList.toggle('active', isSignin);
  document.getElementById('tab-register').classList.toggle('active', !isSignin);
  document.getElementById('form-signin').classList.toggle('hidden', !isSignin);
  document.getElementById('form-register').classList.toggle('hidden', isSignin);
  clearAuthMsg();
}
function openAuth(tab) {
  switchTab(tab);
  document.getElementById('auth-modal').classList.add('active');
}
function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}
function setLoadingBtn(id, loading, text) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = text;
}
function shakeBtn(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.style.animation = 'none';
  void btn.offsetHeight;
  btn.style.animation = 'shake .4s ease';
}

// Start auth on DOM ready
document.addEventListener('DOMContentLoaded', initAuth);
