// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {

  // --- 0. Smooth Scrolling (Lenis) ---
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  // Prevent flash of unstyled content
  gsap.set('.hero-badge, .title-line, .hero-subtitle, .hero-actions, .stat-item, .navbar', { opacity: 0 });

  // --- 1. Custom Cursor & Interactive Neon Background ---
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  
  if (window.innerWidth > 768) {
    document.addEventListener('mousemove', (e) => {
      // Cursor
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      setTimeout(() => {
        follower.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }, 60);

      // Neon Background gradient tracking
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    });

    const hoverElements = document.querySelectorAll('a, button, .magnetic-btn, .skill-card, .project-card, .service-card');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('active');
        follower.classList.add('active');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('active');
        follower.classList.remove('active');
      });
    });
  }

  // --- 1.5 Mobile Navigation ---
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      });
    });
  } else {
    cursor.style.display = 'none';
    follower.style.display = 'none';
  }

  // --- 2. Universal 3D Tilt Effect & Magnetic Buttons ---
  const magnets = document.querySelectorAll('.magnetic-btn');
  magnets.forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
      const position = btn.getBoundingClientRect();
      const x = e.clientX - position.left - position.width / 2;
      const y = e.clientY - position.top - position.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.transform = 'translate(0px, 0px)';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });

  const tiltCards = document.querySelectorAll('.contact-form, .contact-info, .service-card, .project-card, .skill-card, .about-card-3d');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -8; // Negative for natural tilt
      const rotateY = ((x - centerX) / centerX) * 8;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      
      // Inject coordinates for dynamic lighting gradient
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      setTimeout(() => { card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease'; }, 100);
    });
    
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
    });
  });

  // --- 3. Navbar Auto-Hide & Scroll Progress ---
  const navbar = document.getElementById('navbar');
  const scrollProgress = document.getElementById('scroll-progress');
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    // Navbar visual effects
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
      
      // Auto hide logic
      if (currentScroll > lastScrollY && currentScroll > 200) {
        navbar.classList.add('hidden');
      } else if (currentScroll < lastScrollY) {
        navbar.classList.remove('hidden');
      }
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.remove('hidden');
    }
    
    lastScrollY = currentScroll;
    
    if (scrollProgress) {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = `${(totalScroll / windowHeight) * 100}%`;
      scrollProgress.style.height = scroll;
    }
  });

  // --- 4. Advanced 3D Background with Premium Lighting ---
  let mouseX = 0;
  let mouseY = 0;
  
  const initThreeJS = () => {
    const canvas = document.getElementById('bg-canvas');
    if(!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Move camera further back on mobile to fit the shapes
    camera.position.z = window.innerWidth < 768 ? 7 : 5;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio, 2));

    // Optimize mobile performance
    if (window.innerWidth < 768) {
      renderer.powerPreference = "low-power";
    }

    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);

    // Enhanced Lighting for high visibility and cool reflections
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5); // Much brighter
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f2ff, 15, 40);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7000ff, 15, 40);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xff0060, 10, 30);
    scene.add(pointLight3);

    // Ultra Premium Glass Material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x111122, // Base glow to prevent pitch black
      metalness: 0.15,
      roughness: 0.05,
      transmission: 0.95, // Highly transmissive glass
      ior: 2.0, // High index of refraction for crystal look
      thickness: 1.5,
      transparent: true,
      opacity: 1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    const meshes = [];
    
    // 1. Hero
    const heroGeo = new THREE.TorusKnotGeometry(1.4, 0.45, 256, 32);
    const heroMesh = new THREE.Mesh(heroGeo, glassMat);
    heroMesh.position.set(2.5, 0, -2);
    objectsGroup.add(heroMesh);
    meshes.push(heroMesh);

    // 2. About 
    const aboutGeo = new THREE.IcosahedronGeometry(1.8, 0);
    const aboutMesh = new THREE.Mesh(aboutGeo, glassMat);
    aboutMesh.position.set(-2.5, -8, -3);
    objectsGroup.add(aboutMesh);
    meshes.push(aboutMesh);

    // 3. Services 
    const servicesGeo = new THREE.TorusGeometry(1.8, 0.6, 64, 100);
    const servicesMesh = new THREE.Mesh(servicesGeo, glassMat);
    servicesMesh.position.set(2.5, -16, -2);
    objectsGroup.add(servicesMesh);
    meshes.push(servicesMesh);

    // 4. Experience
    const expGeo = new THREE.OctahedronGeometry(1.8, 0);
    const expMesh = new THREE.Mesh(expGeo, glassMat);
    expMesh.position.set(-2.5, -24, -3);
    objectsGroup.add(expMesh);
    meshes.push(expMesh);

    // 5. Skills
    const skillsGeo = new THREE.DodecahedronGeometry(1.8, 0);
    const skillsMesh = new THREE.Mesh(skillsGeo, glassMat);
    skillsMesh.position.set(2.5, -32, -2);
    objectsGroup.add(skillsMesh);
    meshes.push(skillsMesh);

    // 6. Projects
    const projectsGeo = new THREE.TorusKnotGeometry(1.5, 0.4, 128, 16, 3, 4);
    const projectsMesh = new THREE.Mesh(projectsGeo, glassMat);
    projectsMesh.position.set(-2.5, -40, -3);
    objectsGroup.add(projectsMesh);
    meshes.push(projectsMesh);

    // 7. Contact
    const contactGeo = new THREE.SphereGeometry(1.8, 64, 64);
    const contactMesh = new THREE.Mesh(contactGeo, glassMat);
    contactMesh.position.set(2.5, -48, -2);
    objectsGroup.add(contactMesh);
    meshes.push(contactMesh);

    // Background Particles
    const particlesCount = 800;
    const posArray = new Float32Array(particlesCount * 3);
    for(let i = 0; i < particlesCount * 3; i++) {
      posArray[i*3] = (Math.random() - 0.5) * 30;
      posArray[i*3+1] = (Math.random() - 0.5) * 60 - 20; 
      posArray[i*3+2] = (Math.random() - 0.5) * 20 - 5; 
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const createGlowTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 32;
      const context = canvas.getContext('2d');
      const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(0, 242, 255, 1)');
      gradient.addColorStop(1, 'rgba(0, 242, 255, 0)');
      context.fillStyle = gradient; context.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(canvas);
    };

    const particlesMat = new THREE.PointsMaterial({
      size: 0.15, map: createGlowTexture(), blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false, opacity: 0.6, color: 0x00f2ff
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);
    });

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Rotate and float all objects uniquely
      meshes.forEach((mesh, index) => {
        mesh.rotation.x += 0.002 + (index * 0.0005);
        mesh.rotation.y += 0.003 - (index * 0.0002);
        mesh.position.y = -(index * 8) + Math.sin(time * (0.4 + index * 0.1)) * 0.5;
      });

      particlesMesh.rotation.y += 0.0003;

      // Dynamic light movements for rich reflections
      pointLight1.position.x = Math.sin(time * 0.8) * 6;
      pointLight1.position.y = camera.position.y + Math.cos(time * 0.6) * 4;
      pointLight1.position.z = 2 + Math.sin(time * 0.5) * 3;
      
      pointLight2.position.x = Math.cos(time * 0.7) * 6;
      pointLight2.position.y = camera.position.y + Math.sin(time * 0.9) * 4;
      pointLight2.position.z = 2 + Math.cos(time * 0.6) * 3;

      pointLight3.position.x = Math.sin(time * 0.4) * 4;
      pointLight3.position.y = camera.position.y - 2;
      pointLight3.position.z = 1 + Math.cos(time * 0.4) * 2;
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollRatio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const targetCameraY = -scrollRatio * 48; 
      
      // Advanced 3D Camera Movements
      const baseZ = window.innerWidth < 768 ? 7 : 5;
      const targetCameraZ = baseZ - (scrollRatio * 3); // Dive closer
      const targetCameraRotX = scrollRatio * 0.5; // Look up slightly
      const targetCameraRotY = scrollRatio * 1.5; // Epic orbital pan
      const targetCameraRotZ = scrollRatio * 0.2; // Slight cinematic tilt

      camera.position.y += (targetCameraY - camera.position.y) * 0.08;
      camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
      
      camera.rotation.x += (targetCameraRotX - camera.rotation.x) * 0.08;
      camera.rotation.y += (targetCameraRotY - camera.rotation.y) * 0.08;
      camera.rotation.z += (targetCameraRotZ - camera.rotation.z) * 0.08;

      camera.position.x += (mouseX * 0.0015 - camera.position.x) * 0.05;
      
      renderer.render(scene, camera);
    };

    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };

  // Initialize ThreeJS for all devices
  initThreeJS();

  // --- 5. Loader & Motion Graphics Reveals ---
  const playHeroAnimations = () => {
    const tl = gsap.timeline();
    tl.fromTo('.hero-badge', { y: 30, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.5)' })
      .fromTo('.title-line', { y: 60, opacity: 0, filter: 'blur(10px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, stagger: 0.15, ease: 'power4.out' }, "-=0.6")
      .fromTo('.hero-subtitle', { y: 30, opacity: 0, filter: 'blur(5px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power4.out' }, "-=0.6")
      .fromTo('.hero-actions', { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.2)' }, "-=0.8")
      .fromTo('.stat-item', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power4.out' }, "-=0.6")
      .fromTo('.navbar', { yPercent: -150, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, ease: 'power4.out', clearProps: 'all' }, "-=1.5");

    const numbers = document.querySelectorAll('.stat-number');
    numbers.forEach(num => {
      const target = parseInt(num.getAttribute('data-target'));
      gsap.to(num, { innerHTML: target, duration: 2.5, snap: { innerHTML: 1 }, ease: "power2.out", scrollTrigger: { trigger: ".hero-stats", start: "top 90%" } });
    });
  };

  let progress = 0;
  const progressEl = document.getElementById('loader-progress');
  
  const loadingInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 12) + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadingInterval);
      
      gsap.to('.loader', {
        yPercent: -100,
        opacity: 0,
        duration: 1.2,
        ease: 'power4.inOut',
        delay: 0.4,
        onComplete: () => {
          document.getElementById('loader').style.display = 'none';
          playHeroAnimations();
        }
      });
    }
    const pStr = progress.toString().padStart(2, '0') + '%';
    if(progressEl) {
      progressEl.innerText = pStr;
      progressEl.setAttribute('data-progress', pStr);
      progressEl.style.setProperty('--p-width', pStr);
    }
    const barFill = document.getElementById('loader-bar-fill');
    if(barFill) barFill.style.width = pStr;
  }, 100);

  const revealElements = document.querySelectorAll('.reveal-up');
  revealElements.forEach(el => {
    gsap.fromTo(el, 
      { y: 80, opacity: 0, scale: 0.95, filter: 'blur(10px)' },
      {
        y: 0, opacity: 1, scale: 1, filter: 'blur(0px)',
        duration: 1.4, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" }
      }
    );
  });

  // Advanced Parallax Scroll Animations
  const parallaxElements = document.querySelectorAll('.project-card, .service-card');
  parallaxElements.forEach(el => {
    gsap.fromTo(el,
      { y: 60 },
      { y: -30, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 } }
    );
  });

  const about3d = document.querySelector('.about-card-3d');
  if(about3d) {
    gsap.to(about3d, {
      y: -50, rotationY: 10, rotationX: 5, ease: "none",
      scrollTrigger: { trigger: '.about-grid', start: "top bottom", end: "bottom top", scrub: 1 }
    });
  }

  const skillBars = document.querySelectorAll('.skill-fill');
  skillBars.forEach(bar => {
    const width = bar.getAttribute('data-width');
    gsap.fromTo(bar, 
      { width: '0%' },
      { width: `${width}%`, duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: bar.closest('.skills-grid'), start: "top 80%" } }
    );
  });

  // --- 6. Sync Timeline, Guide Orb & Animations ---
  const timelineContainer = document.getElementById('timeline-container');
  const timelineProgress = document.getElementById('timeline-progress');
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  // Site Guide Orb Animation
  const guideOrb = document.getElementById('site-guide');
  if (guideOrb) {
    const guideTl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5 // Smooth following delay
      }
    });

    guideTl.to(guideOrb, { x: '-70vw', y: '20vh', duration: 1, ease: 'power1.inOut' })
           .to(guideOrb, { x: '0vw', y: '40vh', duration: 1, ease: 'power1.inOut' })
           .to(guideOrb, { x: '-70vw', y: '60vh', duration: 1, ease: 'power1.inOut' })
           .to(guideOrb, { x: '-35vw', y: '70vh', duration: 1, ease: 'power1.inOut' });

    // Spawn trails dynamically based on lenis velocity
    let lastSpawn = 0;
    const spawnTrail = () => {
      const now = Date.now();
      if(now - lastSpawn > 40) { 
        lastSpawn = now;
        const rect = guideOrb.getBoundingClientRect();
        const trail = document.createElement('div');
        trail.className = 'orb-trail';
        trail.style.left = `${rect.left + rect.width/2}px`;
        trail.style.top = `${rect.top + rect.height/2}px`;
        document.body.appendChild(trail);
        
        setTimeout(() => {
          if (trail.parentNode) trail.parentNode.removeChild(trail);
        }, 800);
      }
    };

    lenis.on('scroll', (e) => {
      if (Math.abs(e.velocity) > 0.5) {
        spawnTrail();
      }
    });
  }

  if (timelineContainer && timelineProgress) {
    gsap.to(timelineProgress, {
      height: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: timelineContainer,
        start: "top center",
        end: "bottom center",
        scrub: true
      }
    });

    timelineItems.forEach((item) => {
      const dot = item.querySelector('.timeline-dot');
      gsap.fromTo(dot, 
        { backgroundColor: '#03010a', borderColor: 'rgba(255,255,255,0.2)', boxShadow: 'none', scale: 1 },
        {
          backgroundColor: '#00f2ff', borderColor: '#00f2ff',
          boxShadow: '0 0 30px #00f2ff, 0 0 10px #ffffff',
          scale: 1.5, duration: 0.4, ease: "back.out(2)",
          scrollTrigger: {
            trigger: dot,
            start: "center center", 
            toggleActions: "play reverse play reverse"
          }
        }
      );
    });
  }

  // --- 7. Skills Filtering Logic ---
  const skillBtns = document.querySelectorAll('.skill-cat-btn');
  const skillCards = document.querySelectorAll('.skill-card');
  
  skillBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      skillBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      
      skillCards.forEach(card => {
        if (cat === 'all' || card.getAttribute('data-cat') === cat) {
          card.style.display = 'block';
          gsap.fromTo(card, { opacity: 0, scale: 0.8, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'back.out(1.5)' });
        } else {
          card.style.display = 'none';
        }
      });
      // Refresh ScrollTriggers after layout shift
      setTimeout(() => ScrollTrigger.refresh(), 100);
    });
  });

  // --- 8. Contact Form Simulation ---
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');

  if(contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if(!contactForm.checkValidity()) { contactForm.reportValidity(); return; }

      btnText.innerHTML = "Sending...";
      submitBtn.style.opacity = "0.7";
      submitBtn.style.pointerEvents = "none";

      setTimeout(() => {
        btnText.innerHTML = "Send Message ✦";
        submitBtn.style.opacity = "1";
        submitBtn.style.pointerEvents = "all";
        formSuccess.style.display = "block";
        contactForm.reset();
        setTimeout(() => { formSuccess.style.display = "none"; }, 5000);
      }, 1500);
    });
  }
});
