/* =============================================
   A(i)mazon — main.js
   Canvas animations: hero canopy, lidar, globe
   ============================================= */

// ---- HERO CANOPY CANVAS ----
(function initCanopy() {
  const canvas = document.getElementById('canopy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Particles represent leaves / data points floating
  const particles = [];
  const count = 160;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
      hue: Math.random() > 0.6 ? 140 : (Math.random() > 0.5 ? 165 : 190),
      saturation: 60 + Math.random() * 30,
      lightness: 45 + Math.random() * 30,
    });
  }

  // Tree silhouette nodes
  const trees = [];
  const treeCount = 8;
  for (let i = 0; i < treeCount; i++) {
    trees.push({
      x: (i / (treeCount - 1)) * window.innerWidth,
      baseY: window.innerHeight,
      height: window.innerHeight * (0.35 + Math.random() * 0.3),
      spread: 60 + Math.random() * 120,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.003 + Math.random() * 0.003,
    });
  }

  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw gradient bg
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(5, 12, 4, 1)');
    grad.addColorStop(0.6, 'rgba(10, 22, 8, 0.8)');
    grad.addColorStop(1, 'rgba(14, 26, 12, 0.3)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw trees
    for (const t of trees) {
      const sway = Math.sin(frame * t.swaySpeed + t.sway) * 8;
      const tipX = t.x + sway;
      const tipY = t.baseY - t.height;

      // Trunk
      ctx.beginPath();
      ctx.moveTo(t.x, t.baseY);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = 'rgba(20, 45, 18, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Canopy blobs
      const canopyGrad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, t.spread);
      canopyGrad.addColorStop(0, 'rgba(30, 90, 30, 0.35)');
      canopyGrad.addColorStop(0.5, 'rgba(20, 60, 20, 0.2)');
      canopyGrad.addColorStop(1, 'rgba(10, 30, 10, 0)');
      ctx.beginPath();
      ctx.arc(tipX, tipY, t.spread, 0, Math.PI * 2);
      ctx.fillStyle = canopyGrad;
      ctx.fill();
    }

    // Grid lines (data aesthetic)
    ctx.strokeStyle = 'rgba(93, 255, 110, 0.035)';
    ctx.lineWidth = 1;
    const cols = 24;
    const rows = 14;
    for (let i = 0; i <= cols; i++) {
      ctx.beginPath();
      ctx.moveTo((i / cols) * canvas.width, 0);
      ctx.lineTo((i / cols) * canvas.width, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j <= rows; j++) {
      ctx.beginPath();
      ctx.moveTo(0, (j / rows) * canvas.height);
      ctx.lineTo(canvas.width, (j / rows) * canvas.height);
      ctx.stroke();
    }

    // Floating particles
    for (const p of particles) {
      p.x += p.vx + Math.sin(frame * 0.01 + p.y * 0.01) * 0.15;
      p.y += p.vy;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha})`;
      ctx.fill();
    }

    // Scan line effect
    const scanY = (frame * 1.2) % (canvas.height + 60) - 30;
    const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
    scanGrad.addColorStop(0, 'rgba(93, 255, 110, 0)');
    scanGrad.addColorStop(0.5, 'rgba(93, 255, 110, 0.04)');
    scanGrad.addColorStop(1, 'rgba(93, 255, 110, 0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 40, canvas.width, 80);

    frame++;
    requestAnimationFrame(draw);
  }
  draw();
})();


// ---- LIDAR CANVAS ----
(function initLidar() {
  const canvas = document.getElementById('lidar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.offsetWidth;
  const H = 260;
  canvas.width = W;
  canvas.height = H;

  // Generate fake tree crown cross-sections
  const crowns = [];
  const nCrowns = 12;
  for (let i = 0; i < nCrowns; i++) {
    crowns.push({
      cx: (i + 0.5 + (Math.random() - 0.5) * 0.6) * (W / nCrowns),
      baseY: H - 20 - Math.random() * 30,
      height: 60 + Math.random() * 80,
      width: 20 + Math.random() * 40,
      pointCount: 80 + Math.floor(Math.random() * 120),
    });
  }

  // Generate point cloud
  const points = [];
  for (const crown of crowns) {
    // Crown points
    for (let i = 0; i < crown.pointCount; i++) {
      const t = Math.random();
      const angle = Math.random() * Math.PI * 2;
      const radius = crown.width * 0.5 * Math.sqrt(t);
      const heightFrac = 1 - t * t;
      const x = crown.cx + Math.cos(angle) * radius;
      const y = crown.baseY - crown.height * heightFrac + (Math.random() - 0.5) * 8;
      const intensity = 0.3 + heightFrac * 0.7;
      points.push({ x, y, intensity, type: 'crown' });
    }
    // Trunk
    for (let i = 0; i < 8; i++) {
      points.push({
        x: crown.cx + (Math.random() - 0.5) * 4,
        y: crown.baseY - (i / 8) * 20,
        intensity: 0.6,
        type: 'trunk'
      });
    }
  }

  // Ground points
  for (let i = 0; i < 200; i++) {
    points.push({
      x: Math.random() * W,
      y: H - 10 - Math.random() * 10,
      intensity: 0.15 + Math.random() * 0.15,
      type: 'ground'
    });
  }

  function getColor(p) {
    if (p.type === 'ground') return `rgba(180, 120, 40, ${p.intensity * 0.8})`;
    const hue = 100 + p.intensity * 60;
    const lightness = 30 + p.intensity * 45;
    return `hsla(${hue}, 75%, ${lightness}%, ${p.intensity * 0.9})`;
  }

  let frame = 0;
  function drawLidar() {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0a1208';
    ctx.fillRect(0, 0, W, H);

    // Ground line
    ctx.strokeStyle = 'rgba(180, 120, 40, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 12);
    ctx.lineTo(W, H - 12);
    ctx.stroke();

    // Scan beam effect
    const beamX = ((frame * 1.5) % (W + 40)) - 20;
    const beamGrad = ctx.createLinearGradient(beamX - 30, 0, beamX + 30, 0);
    beamGrad.addColorStop(0, 'rgba(0, 229, 192, 0)');
    beamGrad.addColorStop(0.5, 'rgba(0, 229, 192, 0.07)');
    beamGrad.addColorStop(1, 'rgba(0, 229, 192, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(beamX - 30, 0, 60, H);

    // Points
    for (const p of points) {
      const wiggle = Math.sin(frame * 0.02 + p.x * 0.05) * 0.3;
      ctx.beginPath();
      ctx.arc(p.x + wiggle, p.y, p.type === 'ground' ? 1.2 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = getColor(p);
      ctx.fill();
    }

    // Height bar (legend)
    const gradBar = ctx.createLinearGradient(W - 20, H - 20, W - 20, 10);
    gradBar.addColorStop(0, 'rgba(120, 180, 40, 0.3)');
    gradBar.addColorStop(1, 'rgba(200, 255, 100, 0.7)');
    ctx.fillStyle = gradBar;
    ctx.fillRect(W - 18, 10, 8, H - 30);
    ctx.fillStyle = 'rgba(93, 255, 110, 0.5)';
    ctx.font = '9px Space Mono, monospace';
    ctx.fillText('↑ ht', W - 18, 8);

    frame++;
    requestAnimationFrame(drawLidar);
  }
  drawLidar();
})();


// ---- GLOBE CANVAS ----
(function initGlobe() {
  const canvas = document.getElementById('globe-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const SIZE = 320;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const cx = SIZE / 2, cy = SIZE / 2, R = 130;

  // Sites: [lon, lat] in degrees → [phi, theta]
  const sites = [
    { name: 'Manaus, Brazil', lon: -60.0, lat: -3.1, color: '#5dff6e' },
    { name: 'Belém, Brazil', lon: -48.5, lat: -1.4, color: '#5dff6e' },
    { name: 'Santarém, Brazil', lon: -54.7, lat: -2.4, color: '#5dff6e' },
    { name: 'Liverpool, UK', lon: -2.98, lat: 53.4, color: '#00e5c0' },
    { name: 'Sheffield, UK', lon: -1.47, lat: 53.38, color: '#00e5c0' },
    { name: 'Manchester, UK', lon: -2.24, lat: 53.48, color: '#00e5c0' },
    { name: 'Stirling, UK', lon: -3.94, lat: 56.12, color: '#00e5c0' },
    { name: 'Leeds, UK', lon: -1.55, lat: 53.8, color: '#00e5c0' },
    { name: 'Uppsala, Sweden', lon: 17.64, lat: 59.86, color: '#3ab6ff' },
  ];

  function lonLatToXYZ(lon, lat, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return {
      x: -r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.cos(phi),
      z: r * Math.sin(phi) * Math.sin(theta),
    };
  }

  let rotation = 0;
  let frame = 0;

  function drawGlobe() {
    ctx.clearRect(0, 0, SIZE, SIZE);

    rotation += 0.004;

    // Globe base
    const gGlobe = ctx.createRadialGradient(cx - 30, cy - 30, 20, cx, cy, R);
    gGlobe.addColorStop(0, 'rgba(22, 55, 20, 0.9)');
    gGlobe.addColorStop(0.7, 'rgba(12, 30, 12, 0.95)');
    gGlobe.addColorStop(1, 'rgba(5, 15, 5, 1)');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = gGlobe;
    ctx.fill();
    ctx.strokeStyle = 'rgba(93, 255, 110, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Lat/lon grid
    ctx.strokeStyle = 'rgba(93, 255, 110, 0.06)';
    ctx.lineWidth = 0.5;

    // Parallels
    for (let lat = -60; lat <= 60; lat += 30) {
      const phi = (90 - lat) * Math.PI / 180;
      const radiusAtLat = R * Math.sin(phi);
      const yAtLat = cy + R * Math.cos(phi);
      ctx.beginPath();
      ctx.ellipse(cx, yAtLat, radiusAtLat, radiusAtLat * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Meridians
    for (let lon = 0; lon < 360; lon += 30) {
      const angle = (lon + rotation * 180 / Math.PI) * Math.PI / 180;
      ctx.beginPath();
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * Math.PI / 180;
        const x = cx + R * Math.sin(phi) * Math.cos(angle);
        const y = cy - R * Math.cos(phi);
        const visible = Math.sin(phi) * Math.sin(angle) > -0.1;
        if (lat === -90 || !visible) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Amazon region highlight
    const amazonLon = -60 + rotation * 180 / Math.PI;
    const pt = lonLatToXYZ(-60 + 0, -3, R);
    const visCheck = pt.z;
    if (visCheck > 0) {
      const screenX = cx + pt.x;
      const screenY = cy - pt.y;
      const amazonGrad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, 55);
      amazonGrad.addColorStop(0, 'rgba(93, 255, 110, 0.12)');
      amazonGrad.addColorStop(1, 'rgba(93, 255, 110, 0)');
      ctx.beginPath();
      ctx.arc(screenX, screenY, 55, 0, Math.PI * 2);
      ctx.fillStyle = amazonGrad;
      ctx.fill();
    }

    // Sites
    for (const site of sites) {
      const angle = (site.lon + 180 + rotation * 180 / Math.PI) % 360 * Math.PI / 180;
      const phi = (90 - site.lat) * Math.PI / 180;
      const x3 = -R * Math.sin(phi) * Math.cos(angle);
      const y3 = R * Math.cos(phi);
      const z3 = R * Math.sin(phi) * Math.sin(angle);

      // Only draw if on visible hemisphere
      if (z3 < 0) continue;

      const sx = cx + x3;
      const sy = cy - y3;
      const fade = (z3 / R);

      // Pulse ring
      const pulseR = 3 + (Math.sin(frame * 0.05 + site.lon) + 1) * 3;
      ctx.beginPath();
      ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
      ctx.strokeStyle = site.color + Math.floor(fade * 80).toString(16).padStart(2, '0');
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Dot
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = site.color;
      ctx.globalAlpha = fade * 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Connection lines (Brazil ↔ UK)
    const brazilSites = sites.filter(s => s.color === '#5dff6e');
    const ukSites = sites.filter(s => s.color === '#00e5c0');

    for (const b of brazilSites) {
      for (const u of ukSites.slice(0, 2)) {
        const bAngle = (b.lon + 180 + rotation * 180 / Math.PI) % 360 * Math.PI / 180;
        const uAngle = (u.lon + 180 + rotation * 180 / Math.PI) % 360 * Math.PI / 180;
        const bPhi = (90 - b.lat) * Math.PI / 180;
        const uPhi = (90 - u.lat) * Math.PI / 180;

        const bx = cx - R * Math.sin(bPhi) * Math.cos(bAngle);
        const by = cy - R * Math.cos(bPhi);
        const bz = R * Math.sin(bPhi) * Math.sin(bAngle);

        const ux = cx - R * Math.sin(uPhi) * Math.cos(uAngle);
        const uy = cy - R * Math.cos(uPhi);
        const uz = R * Math.sin(uPhi) * Math.sin(uAngle);

        if (bz < 0 || uz < 0) continue;

        const midX = (bx + ux) / 2;
        const midY = (by + uy) / 2 - 20;

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(midX, midY, ux, uy);
        ctx.strokeStyle = `rgba(93, 255, 110, 0.08)`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }

    // Atmosphere glow
    const atmoGrad = ctx.createRadialGradient(cx, cy, R - 5, cx, cy, R + 15);
    atmoGrad.addColorStop(0, 'rgba(93, 255, 110, 0.06)');
    atmoGrad.addColorStop(1, 'rgba(93, 255, 110, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, R + 15, 0, Math.PI * 2);
    ctx.fillStyle = atmoGrad;
    ctx.fill();

    frame++;
    requestAnimationFrame(drawGlobe);
  }
  drawGlobe();
})();


// ---- NAV MOBILE TOGGLE ----
(function initNav() {
  const burger = document.querySelector('.nav-burger');
  const nav = document.querySelector('nav');
  if (!burger) return;
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => nav.classList.remove('open'));
  });
})();


// ---- SCROLL REVEAL ----
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.research-card, .team-card, .pub-item, .stat'
  );

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeUp 0.6s ease both';
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });

  targets.forEach((t, i) => {
    t.style.opacity = '0';
    t.style.animationDelay = `${(i % 6) * 0.07}s`;
    observer.observe(t);
  });
})();
