const navbar = document.getElementById('navbar');
let allProducts = [];
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── Cursor glow tracker (RAF throttled) ───────────────────────
(function() {
  const cg = document.getElementById('cursor-glow');
  if (!cg) return;
  let mx = 0, my = 0, ticking = false;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        cg.style.left = mx + 'px';
        cg.style.top  = my + 'px';
        ticking = false;
      });
    }
  }, { passive: true });
})();

// ── Mobile hamburger ──────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── 3D Parallax Particles canvas ───────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles = [];
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  // Debounced resize
  let resizeTimer;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  }, { passive: true });

  // Track mouse for parallax
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  const COLORS = ['168,85,247', '34,211,238', '245,158,11'];
  function rand(a, b) { return Math.random() * (b - a) + a; }

  function createParticle() {
    const z = rand(0.2, 1); // Depth: 0.2 (far) to 1 (near)
    return {
      x: rand(0, W), y: rand(0, H),
      z: z,
      vx: rand(-0.4, 0.4) * z, // Near particles move faster
      vy: rand(-0.4, 0.4) * z,
      r: rand(1, 3.5) * z,     // Near particles are larger
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: rand(0.3, 0.8) * z // Near particles are more opaque
    };
  }

  // Fewer particles on mobile for perf
  const isMobile = window.innerWidth < 768;
  const COUNT = isMobile ? 35 : Math.min(75, Math.floor(window.innerWidth / 15));
  for (let i = 0; i < COUNT; i++) particles.push(createParticle());

  // Use squared distance to avoid Math.sqrt (O(n²) hot path)
  const MAX_DIST = 130;
  const MAX_DIST_SQ = MAX_DIST * MAX_DIST;
  let frameCount = 0;

  function loop() {
    frameCount++;
    ctx.clearRect(0, 0, W, H);

    const parallaxX = (mouseX - W / 2) * 0.05;
    const parallaxY = (mouseY - H / 2) * 0.05;

    // Move + draw dots
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      
      // Wrap around with a buffer so they don't pop in/out
      if (p.x < -100) p.x = W + 100; if (p.x > W + 100) p.x = -100;
      if (p.y < -100) p.y = H + 100; if (p.y > H + 100) p.y = -100;

      // Calculate 3D projected position (parallax)
      p.renderX = p.x + parallaxX * p.z;
      p.renderY = p.y + parallaxY * p.z;

      ctx.beginPath();
      ctx.arc(p.renderX, p.renderY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    });

    // Draw lines every other frame — halves O(n²) cost
    if (frameCount % 2 === 0) {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          // Only connect particles that are on a similar depth plane (creates 3D layered illusion)
          if (Math.abs(particles[i].z - particles[j].z) > 0.3) continue;

          const dx = particles[i].renderX - particles[j].renderX;
          const dy = particles[i].renderY - particles[j].renderY;
          const dSq = dx * dx + dy * dy; // no sqrt!
          
          if (dSq < MAX_DIST_SQ) {
            const zAvg = (particles[i].z + particles[j].z) / 2;
            const alpha = (1 - dSq / MAX_DIST_SQ) * 0.3 * zAvg;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
            ctx.lineWidth = 0.6 * zAvg;
            ctx.moveTo(particles[i].renderX, particles[i].renderY);
            ctx.lineTo(particles[j].renderX, particles[j].renderY);
            ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(loop);
  }
  loop();
})();

// ── Counter animation ─────────────────────────────────────────
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = +el.dataset.target;
    const suffix = target === 99 ? '%' : target === 24 ? '/7' : '+';
    let current  = 0;
    const step   = target / 60;
    const timer  = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString() + suffix;
    }, 25);
  });
}

// ── Scroll-reveal ─────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); }
  });
}, { threshold: 0.12 });

let staggerIdx = {};
document.querySelectorAll(
  '.product-card,.free-panel-card,.service-card,.why-card,.hero-content,.hero-3d-card'
).forEach(el => {
  const parent = el.parentElement;
  if (!staggerIdx[parent]) staggerIdx[parent] = 0;
  const d = staggerIdx[parent];
  if (d >= 1 && d <= 6) el.classList.add('delay-' + d);
  staggerIdx[parent]++;
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// Trigger counters when hero is visible
const heroObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { animateCounters(); heroObserver.disconnect(); }
}, { threshold: 0.3 });
heroObserver.observe(document.querySelector('.hero'));

// ── FAQ accordion ─────────────────────────────────────────────
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ── Free Panel grab ───────────────────────────────────────────
function grabPanel(btn, slotsId) {
  const slotsEl = document.getElementById(slotsId);
  const current = parseInt(slotsEl.textContent.replace(/\D/g, '')) || 0;

  if (current <= 0) {
    btn.textContent = 'Slots Full';
    btn.disabled = true;
    btn.classList.add('btn-grab-disabled');
    return;
  }

  const newCount = current - 1;
  slotsEl.textContent = newCount > 0 ? `⏳ ${newCount} slots left` : '0 slots left';

  if (newCount === 0) {
    btn.textContent = 'Slots Full';
    btn.disabled = true;
    btn.classList.add('btn-grab-disabled');
    slotsEl.classList.add('expired');
  }

  document.getElementById('grab-modal').classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ── Auth modal helpers ────────────────────────────────────────
function openAuth(tab) {
  switchTab(tab);
  document.getElementById('auth-modal').classList.add('active');
}
function switchTab(tab) {
  const isSignin = tab === 'signin';
  document.getElementById('tab-signin').classList.toggle('active', isSignin);
  document.getElementById('tab-register').classList.toggle('active', !isSignin);
  document.getElementById('form-signin').classList.toggle('hidden', !isSignin);
  document.getElementById('form-register').classList.toggle('hidden', isSignin);
  clearAuthMsg();
}
function showAuthMsg(type, text) {
  const el = document.getElementById('auth-msg');
  el.className = 'auth-msg ' + type;
  el.textContent = text;
}
function clearAuthMsg() {
  const el = document.getElementById('auth-msg');
  if (el) { el.className = 'auth-msg'; el.textContent = ''; }
}
function togglePw(inputId, btn) {
  const inp = document.getElementById(inputId);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  btn.textContent = show ? '🙈' : '👁';
}

// Auth handled via auth.js (Supabase)

// ── Dynamic Site Data Loader ──────────────────────────────────
async function loadSiteData() {
  if (typeof _sb === 'undefined') return;
  
  // 1. Load Products
  const { data: prods } = await _sb.from('products').select('*').order('created_at', { ascending: true });
  if (prods && prods.length > 0) {
    allProducts = prods;
    document.getElementById('products-grid').innerHTML = prods.map(p => `
      <div class="product-card" id="prod-${p.id}">
        ${p.tag ? `<div class="card-ribbon ${p.tag === 'BEST VALUE' ? 'ribbon-gold' : 'ribbon-popular'}">${p.tag}</div>` : ''}
        <div class="product-icon">${p.name.includes('Diamond') ? '💠' : p.name.includes('Bundle') ? '⚡' : p.name.includes('Panel') ? '💎' : '🎯'}</div>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <ul class="product-features">
          ${(p.features || []).map(f => `<li>${f}</li>`).join('')}
        </ul>
        <div class="product-price">
          <span class="price-new">₹${p.price}</span>
        </div>
        <div style="display:flex; gap:0.5rem; margin-top:1.5rem;">
          ${p.video_url ? `<a href="${p.video_url}" target="_blank" class="btn-buy" style="background:rgba(34,211,238,0.1); border:1px solid #22d3ee; color:#22d3ee; flex:1;">Watch Now</a>` : ''}
          <button onclick="openPlanModal('${p.id}')" class="btn-buy ${p.tag === 'BEST VALUE' ? 'btn-gold' : ''}" style="flex:2;">Buy Now →</button>
        </div>
      </div>
    `).join('');
  } else {
    document.getElementById('products-grid').innerHTML = '<p style="text-align:center;color:#94a3b8;width:100%;">No products available right now.</p>';
  }

  // 2. Load Free Panels
  const { data: panels } = await _sb.from('free_panels').select('*').order('created_at', { ascending: true });
  if (panels && panels.length > 0) {
    document.getElementById('free-panels-grid').innerHTML = panels.map(p => `
      <div class="free-panel-card">
        <div class="fp-header">
          <span class="fp-badge ${p.status === 'expired' ? 'fp-badge-expired' : ''}">${p.status === 'expired' ? '⏰ EXPIRED' : '🔓 FREE'}</span>
          <span class="fp-slots ${p.status === 'expired' ? 'expired' : ''}" id="fpslot-${p.id}">${p.status === 'expired' ? '0 slots left' : `⏳ ${p.slots} slots left`}</span>
        </div>
        <div class="fp-icon" style="${p.status === 'expired' ? 'opacity:0.4;' : ''}">👁</div>
        <h3 class="fp-name" style="${p.status === 'expired' ? 'opacity:0.5;' : ''}">${p.name}</h3>
        <p class="fp-desc" style="${p.status === 'expired' ? 'opacity:0.5;' : ''}">Claim your free access before slots run out.</p>
        <button class="btn-grab ${p.status === 'expired' ? 'btn-grab-disabled' : ''}" ${p.status === 'expired' ? 'disabled' : `onclick="grabPanel(this, 'fpslot-${p.id}')"`}>${p.status === 'expired' ? 'Slots Full' : 'Grab Now'}</button>
      </div>
    `).join('');
  } else {
    document.getElementById('free-panels-grid').innerHTML = '<p style="text-align:center;color:#94a3b8;width:100%;">No free panels right now.</p>';
  }


  // Re-apply interactions
  applyInteractions();
}

function applyInteractions() {
  if (window.innerWidth > 768) {
    document.querySelectorAll('.product-card, .service-card, .why-card, .free-panel-card').forEach(card => {
      if(card._hasTilt) return;
      card._hasTilt = true;
      let bounds;
      card.addEventListener('mouseenter', () => {
        bounds = card.getBoundingClientRect();
        card.style.transition = 'none'; 
      });
      card.addEventListener('mousemove', e => {
        if (!bounds) bounds = card.getBoundingClientRect();
        const dx = ((e.clientX - bounds.left) / bounds.width - 0.5) * 15;
        const dy = ((e.clientY - bounds.top) / bounds.height - 0.5) * 15;
        window.requestAnimationFrame(() => {
          card.style.transform = `perspective(800px) rotateY(${dx}deg) rotateX(${-dy}deg) scale3d(1.02, 1.02, 1.02)`;
        });
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        card.style.transform = '';
        bounds = null;
      });
    });

    const tiltCard = document.querySelector('.hero-3d-card');
    if (tiltCard && !tiltCard._hasTilt) {
      tiltCard._hasTilt = true;
      let tBounds;
      const inner = tiltCard.querySelector('.card-inner');
      tiltCard.addEventListener('mouseenter', () => {
        tBounds = tiltCard.getBoundingClientRect();
        inner.style.transition = 'none';
      });
      tiltCard.addEventListener('mousemove', e => {
        if (!tBounds) tBounds = tiltCard.getBoundingClientRect();
        const dx = ((e.clientX - tBounds.left) / tBounds.width - 0.5) * 20;
        const dy = ((e.clientY - tBounds.top) / tBounds.height - 0.5) * 20;
        window.requestAnimationFrame(() => {
          inner.style.transform = `perspective(800px) rotateY(${dx}deg) rotateX(${-dy}deg)`;
        });
      });
      tiltCard.addEventListener('mouseleave', () => {
        inner.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        inner.style.transform = '';
        tBounds = null;
      });
    }
  }

  document.querySelectorAll('.btn-primary,.btn-grab,.btn-buy,.btn-auth-submit,.nav-cta').forEach(btn => {
    if(btn._hasRipple) return;
    btn._hasRipple = true;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', e => {
      const r    = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const x    = e.clientX - r.left - size / 2;
      const y    = e.clientY - r.top  - size / 2;
      const rip  = document.createElement('span');
      rip.className = 'ripple';
      Object.assign(rip.style, {
        width: size + 'px', height: size + 'px',
        left: x + 'px', top: y + 'px'
      });
      btn.appendChild(rip);
      setTimeout(() => rip.remove(), 650);
    });
  });
}

// Inject shake keyframe dynamically
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake{
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-8px)}
  40%{transform:translateX(8px)}
  60%{transform:translateX(-5px)}
  80%{transform:translateX(5px)}
}`;
document.head.appendChild(shakeStyle);

// ── Escape key closes modals ─────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal('grab-modal');
    closeModal('auth-modal');
    closeModal('settings-modal');
    closeModal('announcement-modal');
    closeModal('payment-modal');
  }
});

// ── Check for Global Announcements ──────────────────────────
async function checkAnnouncements() {
  if (typeof _sb === 'undefined') return;
  const { data } = await _sb.from('announcements')
                           .select('*')
                           .eq('is_active', true)
                           .order('created_at', { ascending: false })
                           .limit(1);
                           
  if (data && data.length > 0) {
    const ann = data[0];
    if (sessionStorage.getItem('seen_announcement') === ann.id) return;
    document.getElementById('announcement-text').textContent = ann.message;
    document.getElementById('announcement-modal').classList.add('active');
    sessionStorage.setItem('seen_announcement', ann.id);
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

// ── Payment Modal logic ───────────────────────────────────────────
let currentPayPriceInr = 0;
let currentPayPriceUsd = 0;

function openPlanModal(productId) {
  console.log("Opening plan modal for ID:", productId);
  if (!allProducts || allProducts.length === 0) {
    console.warn("allProducts is empty, attempting to reload...");
    loadSiteData();
    return;
  }
  const p = allProducts.find(x => String(x.id) === String(productId));
  if(!p) {
    console.error("Product not found in allProducts array!");
    return;
  }
  
  document.getElementById('plan-product-name').textContent = p.name;
  const container = document.getElementById('plan-options-container');
  container.innerHTML = '';
  
  const plans = p.plans || {};
  console.log("Product plans:", plans);
  
  const durationIcons = {
    '1 Day': '🕐',
    '1 Week': '📅',
    '1 Month': '🗓️',
    'Permanent': '♾️'
  };

  Object.entries(plans).forEach(([name, prices]) => {
    if(prices.inr || prices.usd) {
      const btn = document.createElement('button');
      btn.className = 'plan-option-btn';
      btn.style.cssText = `
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        margin-bottom: 8px;
        width: 100%;
        color: #fff;
      `;
      
      btn.onmouseover = () => {
        btn.style.background = 'rgba(168, 85, 247, 0.1)';
        btn.style.borderColor = 'rgba(168, 85, 247, 0.5)';
        btn.style.transform = 'translateY(-2px) scale(1.02)';
        btn.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3), 0 0 15px rgba(168, 85, 247, 0.2)';
      };
      btn.onmouseout = () => {
        btn.style.background = 'rgba(255, 255, 255, 0.03)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        btn.style.transform = 'none';
        btn.style.boxShadow = 'none';
      };
      
      btn.onclick = () => {
        closeModal('plan-modal');
        openPaymentModal(p.name + ' (' + name + ')', prices.inr, prices.usd);
      };
      
      const icon = durationIcons[name] || '📦';
      
      btn.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:1.5rem; background:rgba(255,255,255,0.05); width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:10px; border:1px solid rgba(255,255,255,0.1);">${icon}</div>
          <div style="text-align:left;">
            <div style="font-family:var(--font-head); font-size:0.9rem; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#fff;">${name}</div>
            <div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Subscription</div>
          </div>
        </div>
        <div style="text-align:right;">
          ${prices.inr ? `<div style="font-family:var(--font-head); color:#22d3ee; font-size:1.1rem; font-weight:900; text-shadow:0 0 10px rgba(34,211,238,0.3);">₹${prices.inr}</div>` : ''}
          ${prices.usd ? `<div style="color:#fcd535; font-size:0.8rem; font-weight:600; opacity:0.8; margin-top:2px;">$${prices.usd}</div>` : ''}
        </div>
        <div style="position:absolute; bottom:0; left:0; width:100%; height:2px; background:linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent); opacity:0; transition:0.3s;" class="hover-line"></div>
      `;
      
      container.appendChild(btn);
    }
  });
  
  if(container.innerHTML === '') {
    container.innerHTML = '<p style="color:#ef4444;">No plans available for this product.</p>';
  }
  
  document.getElementById('plan-modal').classList.add('active');
}

function openPaymentModal(productName, priceInr, priceUsd) {
  const modal = document.getElementById('payment-modal');
  if (!modal) return;
  
  currentPayPriceInr = parseFloat(priceInr) || 0;
  currentPayPriceUsd = parseFloat(priceUsd) || 0;
  
  document.getElementById('pay-product-name').textContent = productName;
  document.getElementById('pay-product-price').textContent = currentPayPriceInr;
  document.getElementById('pay-currency-symbol').textContent = '₹';
  
  // Reset fields
  const utrInput = document.getElementById('pay-utr');
  if(utrInput) utrInput.value = '';
  document.getElementById('pay-msg').textContent = '';
  document.getElementById('pay-msg').className = 'auth-msg';
  
  // Reset toggle to UPI
  switchPaymentMethod('upi');
  
  modal.classList.add('active');
}

function switchPaymentMethod(method) {
  const btnUpi = document.getElementById('btn-pay-upi');
  const btnBinance = document.getElementById('btn-pay-binance');
  const uiUpi = document.getElementById('pay-method-upi');
  const uiBinance = document.getElementById('pay-method-binance');
  const priceEl = document.getElementById('pay-product-price');
  const symEl = document.getElementById('pay-currency-symbol');
  const utrInput = document.getElementById('pay-utr');
  
  if (method === 'upi') {
    btnUpi.style.background = 'linear-gradient(90deg, #22d3ee, #0ea5e9)';
    btnUpi.style.color = '#fff';
    btnUpi.style.border = 'none';
    
    btnBinance.style.background = 'rgba(255,255,255,0.05)';
    btnBinance.style.color = '#94a3b8';
    btnBinance.style.border = '1px solid rgba(255,255,255,0.1)';
    
    uiUpi.style.display = 'block';
    uiBinance.style.display = 'none';
    
    priceEl.textContent = currentPayPriceInr;
    symEl.textContent = '₹';
    symEl.style.color = '#22d3ee';
    utrInput.placeholder = 'Enter 12-digit UTR from app';
  } else {
    btnBinance.style.background = 'linear-gradient(90deg, #fcd535, #f59e0b)';
    btnBinance.style.color = '#000';
    btnBinance.style.border = 'none';
    
    btnUpi.style.background = 'rgba(255,255,255,0.05)';
    btnUpi.style.color = '#94a3b8';
    btnUpi.style.border = '1px solid rgba(255,255,255,0.1)';
    
    uiUpi.style.display = 'none';
    uiBinance.style.display = 'block';
    
    priceEl.textContent = currentPayPriceUsd;
    symEl.textContent = 'USDT ';
    symEl.style.color = '#fcd535';
    utrInput.placeholder = 'Enter Binance Pay Order/Tx ID';
  }
}

async function submitPayment(event) {
  event.preventDefault();
  
  if (typeof _sb === 'undefined') {
    alert("Supabase is not initialized. Cannot process payment.");
    return;
  }
  
  const { data: session } = await _sb.auth.getSession();
  if (!session || !session.session) {
    alert("You must be logged in to make a purchase. Please log in first.");
    closeModal('payment-modal');
    openAuth('signin');
    return;
  }
  
  const utr = document.getElementById('pay-utr').value.trim();
  const msgEl = document.getElementById('pay-msg');
  const prodName = document.getElementById('pay-product-name').textContent;
  const prodPriceNum = document.getElementById('pay-product-price').textContent;
  const currencySym = document.getElementById('pay-currency-symbol').textContent.trim();
  const prodPrice = `${currencySym} ${prodPriceNum}`;
  
  if (utr.length < 8) {
    msgEl.textContent = 'Please enter a valid Transaction / Order ID.';
    msgEl.className = 'auth-msg error';
    return;
  }
  
  msgEl.textContent = 'Verifying and submitting payment... Please wait.';
  msgEl.className = 'auth-msg';
  msgEl.style.color = '#22d3ee';
  
  try {
    // Insert into orders table
    const { error } = await _sb.from('orders').insert([{
      user_id: session.session.user.id,
      user_email: session.session.user.email,
      product_name: prodName,
      product_price: prodPrice,
      utr: utr,
      status: 'pending'
    }]);

    if (error) {
      console.error(error);
      msgEl.textContent = 'Failed to submit order. Please contact support via Discord.';
      msgEl.className = 'auth-msg error';
      return;
    }

    msgEl.textContent = 'Payment submitted! You will get your product on your registered email once approved.';
    msgEl.className = 'auth-msg success';
    msgEl.style.color = '#a855f7';
    
    setTimeout(() => {
      closeModal('payment-modal');
    }, 4000);
  } catch (err) {
    console.error(err);
    msgEl.textContent = 'An error occurred. Try again later.';
    msgEl.className = 'auth-msg error';
  }
}

// Init data
setTimeout(() => {
  loadSiteData();
  checkAnnouncements();
}, 800);

// ── Reseller Modal Helpers ────────────────────────────────────
function openResellerPurchaseModal() {
  document.getElementById('reseller-purchase-modal').classList.add('active');
}

function openResellerLoginModal() {
  document.getElementById('reseller-login-modal').classList.add('active');
}

// ── Submit Reseller Application ──────────────────────────────
async function submitResellerOrder(e) {
  e.preventDefault();
  const msgEl = document.getElementById('res-purchase-msg');
  const name    = document.getElementById('res-name').value.trim();
  const utr     = document.getElementById('res-utr').value.trim();
  const contact = document.getElementById('res-contact').value.trim();

  if (!name || !utr || !contact) {
    msgEl.className = 'auth-msg error';
    msgEl.textContent = '❌ Please fill in all fields.';
    return;
  }

  try {
    const { error } = await _sb.from('reseller_applications').insert([{
      name, utr, contact, status: 'pending'
    }]);

    if (error) {
      msgEl.className = 'auth-msg error';
      msgEl.textContent = '❌ Submission failed. Try again.';
      return;
    }

    msgEl.className = 'auth-msg success';
    msgEl.textContent = '✅ Application submitted! We will contact you within minutes to set up your reseller account.';
    msgEl.style.color = '#fcd34d';
    document.getElementById('res-name').value = '';
    document.getElementById('res-utr').value = '';
    document.getElementById('res-contact').value = '';
  } catch (err) {
    console.error(err);
    msgEl.className = 'auth-msg error';
    msgEl.textContent = '❌ An error occurred. Please try again.';
  }
}

// ── Reseller Login ───────────────────────────────────────────
async function handleResellerLogin(e) {
  e.preventDefault();
  const msgEl = document.getElementById('res-login-msg');
  const username = document.getElementById('res-login-user').value.trim().toLowerCase();
  const password = document.getElementById('res-login-pass').value;

  msgEl.className = 'auth-msg';
  msgEl.textContent = '⏳ Verifying credentials...';

  try {
    const { data, error } = await _sb
      .from('resellers')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      msgEl.className = 'auth-msg error';
      msgEl.textContent = '❌ Invalid username or password. Contact admin if you need help.';
      return;
    }

    // Store session in sessionStorage and redirect to reseller dashboard
    sessionStorage.setItem('reseller_session', JSON.stringify({ id: data.id, name: data.name, username: data.username }));
    msgEl.className = 'auth-msg success';
    msgEl.textContent = `✅ Welcome back, ${data.name}! Redirecting to your dashboard...`;
    msgEl.style.color = '#22d3ee';

    setTimeout(() => {
      window.location.href = 'reseller.html';
    }, 1500);

  } catch (err) {
    console.error(err);
    msgEl.className = 'auth-msg error';
    msgEl.textContent = '❌ An error occurred. Please try again.';
  }
}
