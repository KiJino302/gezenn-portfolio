// ==========================================================================
// GEZENN PORTFOLIO - CORE ENGINE & SUPABASE INTEGRATION
// ==========================================================================

const SB_URL = 'https://tckkhkxcflfhqlevnsjb.supabase.co';
const SB_KEY = 'sb_publishable_5B-TdZZqN6DE9PVh6EDY9A_WA6hHKHZ';
const sb = window.supabase.createClient(SB_URL, SB_KEY);
const BUCKET = 'project-images';
const ADMIN_HASH = '#gezenn-admin';

const rowToProject = r => ({
  id: r.id,
  title: r.title,
  desc: r.description,
  category: r.category_name,
  year: r.year,
  coverImageId: r.cover_image_url,
  galleryIds: r.gallery_urls || [],
  videoUrl: r.video_url || '',
  featured: r.featured,
  createdAt: new Date(r.created_at).getTime()
});

const projectToRow = p => {
  const c = state.categories.find(x => x.name === p.category);
  return {
    id: p.id,
    title: p.title,
    description: p.desc,
    category_id: c ? c.id : null,
    category_name: p.category,
    year: p.year,
    cover_image_url: p.coverImageId,
    gallery_urls: p.galleryIds || [],
    video_url: p.videoUrl || null,
    featured: !!p.featured
  };
};

const rowToSettings = r => ({
  name: r.editor_name,
  logo: r.brand_logo,
  headline: r.headline,
  heroDesc: r.hero_description,
  aboutDesc: r.about_description,
  profileImageId: r.profile_image_url || '',
  heroImageId: r.hero_image_url || '',
  whatsapp: r.whatsapp_url || '',
  instagram: r.instagram_url || '',
  email: r.email || '',
  tiktok: r.tiktok_url || '',
  spec: r.specializations || DEFAULT_SETTINGS.spec,
  software: r.software || DEFAULT_SETTINGS.software,
  services: r.services || DEFAULT_SETTINGS.services
});

const settingsToRow = s => ({
  id: 1,
  editor_name: s.name,
  brand_logo: s.logo,
  headline: s.headline,
  hero_description: s.heroDesc,
  about_description: s.aboutDesc,
  profile_image_url: s.profileImageId || null,
  hero_image_url: s.heroImageId || null,
  whatsapp_url: s.whatsapp || null,
  instagram_url: s.instagram || null,
  email: s.email || null,
  tiktok_url: s.tiktok || null,
  specializations: s.spec,
  software: s.software,
  services: s.services
});

function dbFail(error) {
  alert('Gagal: ' + error.message);
  throw error;
}

async function dbPut(t, v) {
  let q;
  if (t === 'projects') q = sb.from('projects').upsert(projectToRow(v));
  else if (t === 'categories') q = sb.from('categories').upsert({ id: v.id, name: v.name });
  else if (t === 'settings') q = sb.from('settings').upsert(settingsToRow(v.data));
  const { error } = await q;
  if (error) dbFail(error);
  return v;
}

async function dbDelete(t, k) {
  const { error } = await sb.from(t).delete().eq('id', k);
  if (error) dbFail(error);
}

async function storeImage(f) {
  const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = new Date().getFullYear() + '/' + crypto.randomUUID() + '.' + ext;
  const { error } = await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type, cacheControl: '31536000' });
  if (error) dbFail(error);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function getImageURL(id) {
  return id || '';
}

async function deleteImage(u) {
  const m = u ? u.indexOf('/' + BUCKET + '/') : -1;
  if (m > 0) {
    try {
      await sb.storage.from(BUCKET).remove([decodeURIComponent(u.slice(m + BUCKET.length + 2).split('?')[0])]);
    } catch (e) {}
  }
}

const DEFAULT_SETTINGS = {
  name: 'Raka Adnyana',
  logo: 'Gezenn',
  headline: 'Turning ideas into *visual stories.*',
  heroDesc: 'I craft cinematic edits, short-form content, and motion-driven visuals for brands, creators, and storytellers.',
  aboutDesc: 'I help brands and creators tell their stories through thoughtful editing, rhythm, and color.',
  whatsapp: 'https://wa.me/6281234567890',
  instagram: 'https://instagram.com/gezenn.studio',
  email: 'hello@gezenn.studio',
  tiktok: 'https://tiktok.com/@gezenn.studio',
  profileImageId: '',
  heroImageId: '',
  spec: ['Cinematic Editing', 'Short-form Content', 'Color Grading', 'Motion Graphics', 'Sound Design'],
  software: ['Adobe Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Lightroom', 'CapCut'],
  services: [
    { title: 'Video Editing', description: 'Full long-form editing for YouTube, documentaries, and branded content with clean pacing and structure.' },
    { title: 'Short-form Content', description: 'Reels, TikTok, and Shorts engineered for retention: fast cuts, hooks, and captions that convert.' },
    { title: 'Cinematic Editing', description: 'Film-like storytelling with color grading, sound design, and editorial rhythm for premium visuals.' },
    { title: 'Motion Graphics', description: 'Animated titles, lower thirds, and visual effects that elevate brand storytelling.' },
    { title: 'Social Media Video', description: 'Platform-native edits optimized for each feed, from teaser drops to full campaigns.' }
  ]
};

const state = {
  projects: [],
  categories: [],
  settings: { ...DEFAULT_SETTINGS },
  filter: 'all',
  editingProjectId: null,
  coverUploadId: null,
  galleryUploadIds: [],
  profileUploadId: null
};

// ==========================================================================
// VIEW SWITCHING & ROUTING
// ==========================================================================

function showPublic() {
  if (location.hash === ADMIN_HASH) history.replaceState(null, '', location.pathname + location.search);
  document.getElementById('publicView').classList.add('active');
  document.getElementById('loginView').classList.remove('active');
  document.getElementById('adminView').classList.remove('active');
  window.scrollTo(0, 0);
}

function showLogin() {
  document.getElementById('publicView').classList.remove('active');
  document.getElementById('adminView').classList.remove('active');
  document.getElementById('loginView').classList.add('active');
  document.getElementById('loginError').classList.remove('show');
  setTimeout(() => document.getElementById('loginEmail').focus(), 200);
}

function showAdmin() {
  document.getElementById('publicView').classList.remove('active');
  document.getElementById('loginView').classList.remove('active');
  document.getElementById('adminView').classList.add('active');
  window.scrollTo(0, 0);
}

async function checkAdmin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return false;
  const { data, error } = await sb.rpc('is_admin');
  return !error && data === true;
}

async function route() {
  if (location.hash !== ADMIN_HASH) {
    if (!document.getElementById('publicView').classList.contains('active')) showPublic();
    return;
  }
  if (await checkAdmin()) {
    await loadData();
    await applySettings();
    renderPublic();
    showAdmin();
    renderAdmin();
    switchAdminTab('dashboard');
  } else {
    showLogin();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const em = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPassword').value;
  const b = e.target.querySelector('button[type=submit]');
  b.disabled = true;
  const { error } = await sb.auth.signInWithPassword({ email: em, password: pw });
  let ok = !error;
  if (ok && !(await checkAdmin())) {
    await sb.auth.signOut();
    ok = false;
  }
  b.disabled = false;
  if (ok) {
    document.getElementById('loginPassword').value = '';
    await route();
  } else {
    document.getElementById('loginError').classList.add('show');
  }
}

async function handleLogout() {
  await sb.auth.signOut();
  showPublic();
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
  const el = document.getElementById('tab-' + tab);
  if (el) el.style.display = 'block';
  if (tab === 'dashboard') renderDashboard();
  if (tab === 'projects') renderAdminProjects();
  if (tab === 'settings') renderSettings();
}

// ==========================================================================
// SMOOTH NAVIGATION & FULLSCREEN MENU (Adeola Adeoti Style)
// ==========================================================================

function toggleMenu() {
  const menu = document.getElementById('cinematicMenu');
  const btn = document.getElementById('menuToggleBtn');
  const label = document.getElementById('menuToggleLabel');
  if (!menu) return;
  const isOpen = menu.classList.contains('open');

  if (isOpen) {
    closeMenu();
  } else {
    menu.classList.add('open');
    if (btn) {
      btn.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
    }
    menu.setAttribute('aria-hidden', 'false');
    if (label) label.textContent = 'CLOSE';
    document.body.style.overflow = 'hidden';
  }
}

function closeMenu() {
  const menu = document.getElementById('cinematicMenu');
  const btn = document.getElementById('menuToggleBtn');
  const label = document.getElementById('menuToggleLabel');
  if (!menu) return;
  menu.classList.remove('open');
  if (btn) {
    btn.classList.remove('menu-open');
    btn.setAttribute('aria-expanded', 'false');
  }
  menu.setAttribute('aria-hidden', 'true');
  if (label) label.textContent = 'MENU';
  document.body.style.overflow = '';
}

function handleMenuNav(targetId, e) {
  if (e) e.preventDefault();
  closeMenu();
  setTimeout(() => {
    smoothScrollTo(targetId);
  }, 120);
}

function smoothScrollTo(targetSelector, e) {
  if (e) e.preventDefault();
  const el = document.querySelector(targetSelector);
  if (!el) return;
  const navHeight = 90;
  const targetPos = el.getBoundingClientRect().top + window.pageYOffset - navHeight;
  window.scrollTo({
    top: targetPos > 0 ? targetPos : 0,
    behavior: 'smooth'
  });
}

function scrollToWorks() {
  smoothScrollTo('#works');
}

function setupScrollTracking() {
  const sections = ['home', 'works', 'about', 'services', 'contact'];
  const navLinks = document.querySelectorAll('#desktopNavLinks .nav-link');
  const progressBar = document.getElementById('scrollProgress');
  const navPill = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Update Top Progress Bar
    if (progressBar && scrollHeight > 0) {
      const progress = (scrollY / scrollHeight) * 100;
      progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }

    // Floating Pill Scroll Transition
    if (navPill) {
      if (scrollY > 30) {
        navPill.classList.add('scrolled');
      } else {
        navPill.classList.remove('scrolled');
      }
    }

    // Scrollspy section detection
    let current = 'home';
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop - 140;
        if (scrollY >= top) {
          current = id;
        }
      }
    }

    navLinks.forEach(link => {
      if (link.dataset.section === current) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }, { passive: true });
}

// Global Keyboard Accessibility
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeMenu();
    closeProjectModal();
    closeProjectForm();
  }
});

// ==========================================================================
// MOTION DESIGN & WORD-BY-WORD ANIMATION SYSTEM
// ==========================================================================

function splitHeadlineWords(el, htmlText, baseDelay = 200) {
  if (!el) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = htmlText;
  const fullText = tmp.textContent.trim();
  el.setAttribute('aria-label', fullText);

  const tokens = [];
  function walk(node, isAccent) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/\s+/).filter(Boolean);
      parts.forEach(p => tokens.push({ text: p, isAccent }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const accent = isAccent || node.tagName.toLowerCase() === 'em';
      node.childNodes.forEach(child => walk(child, accent));
    }
  }
  walk(tmp, false);

  el.innerHTML = tokens.map((t, idx) => `
    <span class="word-wrapper" aria-hidden="true">
      <span class="word-inner ${t.isAccent ? 'is-accent' : ''}" style="--w-index:${idx};--w-delay:${baseDelay}ms">${escapeHtml(t.text)}&nbsp;</span>
    </span>
  `).join('');
}

let globalScrollObserver = null;

function setupScrollAnimations() {
  if (globalScrollObserver) globalScrollObserver.disconnect();

  const options = {
    root: null,
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.12
  };

  globalScrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        globalScrollObserver.unobserve(entry.target);
      }
    });
  }, options);

  observeDynamicElements();
}

function observeDynamicElements() {
  if (!globalScrollObserver) return;
  const targets = document.querySelectorAll(
    '.reveal-on-scroll, .project-card, .service-card, .skills-group, .about-photo-frame, .contact-card, .hero-showreel-card'
  );
  targets.forEach(el => {
    if (!el.classList.contains('is-revealed')) {
      globalScrollObserver.observe(el);
    }
  });
}

// ==========================================================================
// DATA LOADING & RENDERING
// ==========================================================================

async function init() {
  const yr = document.getElementById('currentYear');
  if (yr) yr.textContent = new Date().getFullYear();

  await loadData();
  await applySettings();
  renderPublic();
  setupDragDrop();
  setupScrollTracking();
  setupScrollAnimations();

  // Trigger page-loaded for hero choreography once any active intro exits
  state.initialized = true;
  const triggerHeroLoaded = () => {
    if (!state.initialized) return;
    requestAnimationFrame(() => {
      document.body.classList.add('page-loaded');
    });
  };
  window.__finishPortfolioIntro = triggerHeroLoaded;
  if (!window.__GEZENN_PRELOADER_ACTIVE__) {
    triggerHeroLoaded();
  }

  window.addEventListener('hashchange', route);
  await route();
}

async function loadData() {
  const [c, p, s] = await Promise.all([
    sb.from('categories').select('*').order('name'),
    sb.from('projects').select('*').order('created_at', { ascending: false }),
    sb.from('settings').select('*').eq('id', 1).maybeSingle()
  ]);
  if (c.error || p.error) console.error(c.error || p.error);
  state.categories = (c.data || []).map(x => ({ id: x.id, name: x.name }));
  state.projects = (p.data || []).map(rowToProject);
  if (s.data) state.settings = { ...DEFAULT_SETTINGS, ...rowToSettings(s.data) };
}

async function applySettings() {
  const s = state.settings;

  // Headings with word-by-word reveal
  if (typeof window.__setHeroHeadline === 'function') {
    window.__setHeroHeadline(s.headline);
  } else {
    splitHeadlineWords(document.getElementById('heroHeadline'), s.headline.replace(/\*(.+?)\*/g, '<em>$1</em>'), 220);
  }
  splitHeadlineWords(document.getElementById('worksHeading'), 'Selected <em>projects</em>', 100);
  splitHeadlineWords(document.getElementById('aboutHeading'), `I'm <em id="aboutName">${escapeHtml(s.name.split(' ')[0])}</em>, a video editor.`, 100);
  splitHeadlineWords(document.getElementById('servicesHeading'), 'Services &amp; <em>expertise</em>', 100);
  splitHeadlineWords(document.getElementById('contactHeadline'), "Let's create something <em>worth watching.</em>", 100);

  // Chips with staggered delay index
  document.getElementById('specChips').innerHTML = (s.spec || []).map((x, i) => `<span class="chip" style="--chip-idx:${i}">${escapeHtml(x)}</span>`).join('');
  document.getElementById('softChips').innerHTML = (s.software || []).map((x, i) => `<span class="chip" style="--chip-idx:${i}">${escapeHtml(x)}</span>`).join('');

  // Services with staggered delay index
  document.getElementById('servicesGrid').innerHTML = (s.services || []).map((v, i) => `
    <div class="service-card" style="--svc-idx:${i}">
      <div class="service-num">${String(i + 1).padStart(2, '0')}.</div>
      <h3>${escapeHtml(v.title)}</h3>
      <p>${escapeHtml(v.description)}</p>
    </div>
  `).join('');

  // Branding & Typography
  document.title = s.logo + ' | Video Editor Portfolio';
  document.getElementById('navLogo').textContent = s.logo;
  document.getElementById('footerName').textContent = s.logo;
  document.getElementById('heroEditorName').textContent = s.name;
  document.getElementById('heroDesc').textContent = s.heroDesc;
  document.getElementById('aboutDesc').textContent = s.aboutDesc;

  // Showreel Preview
  const h = document.getElementById('heroShowreel');
  if (s.heroImageId) {
    h.src = await getImageURL(s.heroImageId);
  } else {
    const f = state.projects.find(p => p.featured) || state.projects[0];
    if (f) {
      const u = f.coverImageId?.startsWith('http') ? f.coverImageId : await getImageURL(f.coverImageId);
      h.src = u || 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&q=80';
      document.getElementById('heroShowreelMeta').textContent = f.title;
    } else {
      h.src = 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&q=80';
    }
  }

  // Profile Photo
  const a = document.getElementById('aboutPhoto');
  if (s.profileImageId) {
    a.src = await getImageURL(s.profileImageId);
  } else {
    a.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&q=80';
  }

  // Contact Links
  const links = [];
  if (s.whatsapp) links.push({ href: s.whatsapp, label: 'WhatsApp', icon: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>' });
  if (s.instagram) links.push({ href: s.instagram, label: 'Instagram', icon: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>' });
  if (s.email) links.push({ href: 'mailto:' + s.email, label: s.email, icon: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>' });
  if (s.tiktok) links.push({ href: s.tiktok, label: 'TikTok', icon: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>' });

  document.getElementById('contactLinks').innerHTML = links.map(l => `
    <a href="${l.href}" target="_blank" rel="noopener" class="contact-link">
      <svg viewBox="0 0 24 24" aria-hidden="true">${l.icon}</svg>
      <span>${escapeHtml(l.label)}</span>
    </a>
  `).join('');

  // Sync links in cinematic menu overlay
  const menuSocial = document.getElementById('menuSocialLinks');
  if (menuSocial && links.length) {
    menuSocial.innerHTML = links.map(l => `
      <a href="${l.href}" target="_blank" rel="noopener" class="menu-social-item">${escapeHtml(l.label)}</a>
    `).join('');
  }

  const p = document.getElementById('contactPrimary');
  if (s.whatsapp) {
    p.href = s.whatsapp;
    p.target = '_blank';
  } else if (s.email) {
    p.href = 'mailto:' + s.email;
  } else {
    p.href = '#contact';
  }

  // Observe elements after settings update
  observeDynamicElements();
}

async function renderPublic() {
  const f = document.getElementById('filters');
  const c = ['All', ...state.categories.map(x => x.name)];
  f.innerHTML = c.map(x => `
    <button class="filter-chip ${state.filter === (x === 'All' ? 'all' : x) ? 'active' : ''}" onclick="setFilter('${x === 'All' ? 'all' : x}')">
      ${escapeHtml(x)}
    </button>
  `).join('');
  await renderWorks();
}

async function renderWorks() {
  const ct = document.getElementById('worksContainer');
  const emp = document.getElementById('emptyWorks');
  const filtered = state.filter === 'all' ? state.projects : state.projects.filter(p => p.category === state.filter);

  if (!filtered.length) {
    ct.innerHTML = '';
    emp.style.display = 'block';
    return;
  }
  emp.style.display = 'none';
  ct.innerHTML = filtered.map(() => `<div class="skeleton"></div>`).join('');

  const cards = await Promise.all(filtered.map(async (p, idx) => {
    const cover = p.coverImageId?.startsWith('http') ? p.coverImageId : await getImageURL(p.coverImageId);
    return `
      <article class="project-card ${p.featured ? 'featured' : ''}" onclick="openProjectModal('${p.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' ')openProjectModal('${p.id}')" aria-label="${escapeHtml(p.title)}" style="transition-delay:${idx * 65}ms">
        <div class="project-thumb-box">
          ${cover ? `<img src="${cover}" alt="${escapeHtml(p.title)}" loading="lazy" width="640" height="400">` : ''}
          <span class="project-tag-badge">${p.featured ? 'Featured' : escapeHtml(p.category)}</span>
        </div>
        <div class="project-card-body">
          <div class="project-card-meta">
            <span class="project-card-category">${escapeHtml(p.category)}</span>
            <span>${p.year}</span>
          </div>
          <h3>${escapeHtml(p.title)}</h3>
          <p class="project-card-desc">${escapeHtml((p.desc || '').slice(0, 110))}${p.desc?.length > 110 ? '...' : ''}</p>
          <div class="project-card-footer">
            <span>Explore Project</span>
            <span class="arrow-disc" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }));
  ct.innerHTML = cards.join('');

  // Observe newly rendered cards
  observeDynamicElements();
}

function setFilter(f) {
  state.filter = f;
  const ct = document.getElementById('worksContainer');
  if (ct) {
    ct.style.opacity = '0';
    ct.style.transform = 'translateY(10px)';
    ct.style.transition = 'opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out)';
    setTimeout(() => {
      renderPublic();
      requestAnimationFrame(() => {
        ct.style.opacity = '1';
        ct.style.transform = 'translateY(0)';
      });
    }, 180);
  } else {
    renderPublic();
  }
}

async function openProjectModal(id) {
  const p = state.projects.find(x => x.id === id);
  if (!p) return;
  const cover = p.coverImageId?.startsWith('http') ? p.coverImageId : await getImageURL(p.coverImageId);
  const gal = await Promise.all((p.galleryIds || []).map(g => g.startsWith('http') ? g : getImageURL(g)));
  const idx = state.projects.findIndex(x => x.id === id);
  const next = state.projects[(idx + 1) % state.projects.length];

  let v = '';
  if (p.videoUrl) {
    const yt = p.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
    const vm = p.videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (yt) {
      v = `<iframe class="video-embed" src="https://www.youtube.com/embed/${yt[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else if (vm) {
      v = `<iframe class="video-embed" src="https://player.vimeo.com/video/${vm[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }
  }

  document.getElementById('projectModalBody').innerHTML = `
    ${cover ? `<img src="${cover}" class="project-cover" alt="${escapeHtml(p.title)}">` : ''}
    <div class="project-body">
      <div class="project-header">
        <div>
          <div class="section-eyebrow" style="margin-bottom:12px">${escapeHtml(p.category)}</div>
          <h2>${escapeHtml(p.title)}</h2>
        </div>
        ${p.videoUrl ? `
          <a href="${p.videoUrl}" target="_blank" rel="noopener" class="cta-primary" style="padding:10px 20px;font-size:13px;display:inline-flex;align-items:center;gap:8px">
            <span>Watch Video</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
          </a>
        ` : ''}
      </div>
      ${v}
      <div class="project-info-row">
        <div class="info-cell"><div class="lbl">Category</div><div class="val">${escapeHtml(p.category)}</div></div>
        <div class="info-cell"><div class="lbl">Year</div><div class="val">${p.year}</div></div>
        <div class="info-cell"><div class="lbl">Role</div><div class="val">Editor &amp; Colorist</div></div>
        <div class="info-cell">
          <div class="lbl">Video Link</div>
          <div class="val">${p.videoUrl ? `<a href="${p.videoUrl}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline;font-weight:500">Watch Link ↗</a>` : '<span style="color:var(--muted-2)">Not added</span>'}</div>
        </div>
      </div>
      <p class="project-desc">${escapeHtml(p.desc || '')}</p>
      ${gal.length ? `<div class="gallery">${gal.map(u => `<img src="${u}" alt="Gallery image" loading="lazy" onclick="window.open('${u}','_blank')">`).join('')}</div>` : ''}
      ${next && next.id !== p.id ? `
        <div class="next-project" onclick="closeProjectModal();openProjectModal('${next.id}')" role="button" tabindex="0">
          <div>
            <div class="lbl">Next Project</div>
            <div style="font-size:16px;font-weight:600;margin-top:4px">${escapeHtml(next.title)}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      ` : ''}
    </div>
  `;
  document.getElementById('projectModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const m = document.getElementById('projectModal');
  if (m) m.classList.remove('active');
  document.body.style.overflow = '';
}

// ==========================================================================
// ADMIN DASHBOARD & CMS
// ==========================================================================

function renderAdmin() {
  renderDashboard();
  renderAdminProjects();
  renderSettings();
}

function renderDashboard() {
  document.getElementById('statProjects').textContent = state.projects.length;
  document.getElementById('statCats').textContent = state.categories.length;
  document.getElementById('statFeatured').textContent = state.projects.filter(p => p.featured).length;
  const l = state.projects.reduce((a, p) => Math.max(a, p.createdAt || 0), 0);
  document.getElementById('statUpdated').textContent = l ? new Date(l).toLocaleDateString() : '-';

  const r = state.projects.slice(0, 5);
  const w = document.getElementById('recentProjects');
  if (!r.length) {
    w.innerHTML = '<p style="color:var(--muted);font-size:14px">No projects yet. Add your first one.</p>';
    return;
  }
  w.innerHTML = r.map(p => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--line);gap:12px">
      <div style="min-width:0;flex:1">
        <div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.title)}</div>
        <div style="font-size:12px;color:var(--muted-2);margin-top:2px">${escapeHtml(p.category)} · ${p.year}</div>
      </div>
      <div style="display:flex;gap:6px">
        <button class="btn-sm" onclick="openProjectForm('${p.id}')">Edit</button>
        <button class="btn-sm btn-danger" onclick="deleteProject('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function renderAdminProjects() {
  const s = (document.getElementById('adminSearch')?.value || '').toLowerCase();
  const f = state.projects.filter(p => !s || p.title.toLowerCase().includes(s) || (p.category || '').toLowerCase().includes(s));
  const w = document.getElementById('adminProjectsTable');
  if (!f.length) {
    w.innerHTML = '<p style="color:var(--muted);font-size:14px;padding:20px 0">No projects found.</p>';
    return;
  }
  w.innerHTML = `
    <table class="ptable">
      <thead>
        <tr>
          <th>Project</th>
          <th>Category</th>
          <th>Year</th>
          <th>Featured</th>
          <th style="text-align:right">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${f.map(p => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:12px;min-width:0">
                ${p.coverImageId?.startsWith('http') ? `<img src="${p.coverImageId}" class="ptable-thumb" loading="lazy" alt="">` : `<div class="ptable-thumb"></div>`}
                <div style="min-width:0">
                  <div style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px">${escapeHtml(p.title)}</div>
                </div>
              </div>
            </td>
            <td>${escapeHtml(p.category)}</td>
            <td>${p.year}</td>
            <td>${p.featured ? '<span class="badge">★ Featured</span>' : '-'}</td>
            <td style="text-align:right;white-space:nowrap">
              <button class="btn-sm" onclick="openProjectForm('${p.id}')">Edit</button>
              <button class="btn-sm btn-danger" onclick="deleteProject('${p.id}')" style="margin-left:4px">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  renderCategories();
}

function renderCategories() {
  const w = document.getElementById('categoriesList');
  if (!w) return;
  if (!state.categories.length) {
    w.innerHTML = '<p style="color:var(--muted);font-size:13px">No categories yet.</p>';
    return;
  }
  w.innerHTML = state.categories.map(c => `
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:var(--bg-3);border:1px solid var(--line);border-radius:999px;margin:4px;font-size:12px">
      ${escapeHtml(c.name)}
      <button onclick="deleteCategory('${c.id}')" style="color:var(--muted);width:16px;height:16px;display:flex;align-items:center;justify-content:center" title="Remove">×</button>
    </div>
  `).join('');
}

async function addCategory() {
  const i = document.getElementById('newCatInput');
  const n = i.value.trim();
  if (!n) return;
  if (state.categories.some(c => c.name.toLowerCase() === n.toLowerCase())) {
    alert('Category already exists');
    return;
  }
  const c = { id: crypto.randomUUID(), name: n };
  await dbPut('categories', c);
  state.categories.push(c);
  state.categories.sort((a, b) => a.name.localeCompare(b.name));
  i.value = '';
  renderCategories();
  renderPublic();
  renderAdmin();
  renderProjectFormSelect();
}

async function deleteCategory(id) {
  if (!confirm('Delete this category? Projects using it will keep their category name.')) return;
  await dbDelete('categories', id);
  state.categories = state.categories.filter(c => c.id !== id);
  renderCategories();
  renderPublic();
  renderAdmin();
}

async function deleteProject(id) {
  if (!confirm('Delete this project permanently?')) return;
  const p = state.projects.find(x => x.id === id);
  await dbDelete('projects', id);
  if (p) {
    await deleteImage(p.coverImageId);
    for (const g of (p.galleryIds || [])) await deleteImage(g);
  }
  state.projects = state.projects.filter(x => x.id !== id);
  renderPublic();
  renderAdmin();
}

function renderProjectFormSelect() {
  const s = document.getElementById('formCategory');
  if (!s) return;
  s.innerHTML = state.categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
}

async function openProjectForm(id) {
  renderProjectFormSelect();
  state.coverUploadId = null;
  state.galleryUploadIds = [];
  state.editingProjectId = id || null;
  document.getElementById('formProjectId').value = id || '';
  document.getElementById('coverPreview').innerHTML = '';
  document.getElementById('galleryPreview').innerHTML = '';

  if (id) {
    const p = state.projects.find(x => x.id === id);
    if (p) {
      document.getElementById('formTitle').textContent = 'Edit Project';
      document.getElementById('formTitleInput').value = p.title;
      document.getElementById('formDesc').value = p.desc;
      document.getElementById('formCategory').value = p.category;
      document.getElementById('formYear').value = p.year;
      document.getElementById('formVideo').value = p.videoUrl || '';
      document.getElementById('formFeatured').checked = !!p.featured;
      if (p.coverImageId) {
        state.coverUploadId = p.coverImageId;
        const u = p.coverImageId.startsWith('http') ? p.coverImageId : await getImageURL(p.coverImageId);
        renderCoverPreview(u);
      }
      state.galleryUploadIds = [...(p.galleryIds || [])];
      for (const g of state.galleryUploadIds) {
        const u = g.startsWith('http') ? g : await getImageURL(g);
        renderGalleryPreviewItem(u, g);
      }
    }
  } else {
    document.getElementById('formTitle').textContent = 'Add New Project';
    document.getElementById('projectForm').reset();
    document.getElementById('formYear').value = new Date().getFullYear();
  }
  document.getElementById('projectFormModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectForm() {
  const m = document.getElementById('projectFormModal');
  if (m) m.classList.remove('active');
  document.body.style.overflow = '';
}

function renderCoverPreview(u) {
  const w = document.getElementById('coverPreview');
  w.innerHTML = `<div class="preview-item"><img src="${u}" alt="Cover preview"><button type="button" class="preview-remove" onclick="removeCover()" aria-label="Remove cover image"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg></button></div>`;
}

function renderGalleryPreviewItem(u, id) {
  const w = document.getElementById('galleryPreview');
  const i = document.createElement('div');
  i.className = 'preview-item';
  i.dataset.gid = id;
  i.innerHTML = `<img src="${u}" alt="Gallery item"><button type="button" class="preview-remove" onclick="removeGallery('${id}')" aria-label="Remove image"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg></button>`;
  w.appendChild(i);
}

function removeCover() {
  state.coverUploadId = null;
  document.getElementById('coverPreview').innerHTML = '';
}

function removeGallery(id) {
  state.galleryUploadIds = state.galleryUploadIds.filter(g => g !== id);
  const el = document.querySelector(`.preview-item[data-gid="${id}"]`);
  if (el) el.remove();
}

async function handleCoverUpload(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (!validateImage(f)) { e.target.value = ''; return; }
  const id = await storeImage(f);
  state.coverUploadId = id;
  const u = await getImageURL(id);
  renderCoverPreview(u);
  e.target.value = '';
}

async function handleGalleryUpload(e) {
  const files = [...e.target.files];
  for (const f of files) {
    if (!validateImage(f)) continue;
    const id = await storeImage(f);
    state.galleryUploadIds.push(id);
    const u = await getImageURL(id);
    renderGalleryPreviewItem(u, id);
  }
  e.target.value = '';
}

async function handleProfileUpload(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (!validateImage(f)) { e.target.value = ''; return; }
  const id = await storeImage(f);
  state.profileUploadId = id;
  const u = await getImageURL(id);
  document.getElementById('profilePreview').innerHTML = `<div class="preview-item" style="width:120px;height:120px"><img src="${u}" alt="Profile preview"></div>`;
  e.target.value = '';
}

function validateImage(f) {
  const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(f.type);
  if (!ok) {
    alert('Only JPG, PNG, or WebP allowed.');
    return false;
  }
  if (f.size > 5 * 1024 * 1024) {
    alert('Max file size 5MB.');
    return false;
  }
  return true;
}

async function saveProject(e) {
  e.preventDefault();
  const id = document.getElementById('formProjectId').value || crypto.randomUUID();
  const title = document.getElementById('formTitleInput').value.trim();
  const desc = document.getElementById('formDesc').value.trim();
  const category = document.getElementById('formCategory').value;
  const year = parseInt(document.getElementById('formYear').value);
  const videoUrl = document.getElementById('formVideo').value.trim();
  const featured = document.getElementById('formFeatured').checked;

  if (!title || !desc || !category || !year) {
    alert('Please fill all required fields.');
    return;
  }
  if (!state.coverUploadId) {
    alert('Please upload a cover image.');
    return;
  }

  const ex = state.projects.find(p => p.id === id);
  const proj = {
    id,
    title,
    desc,
    category,
    year,
    videoUrl,
    featured,
    coverImageId: state.coverUploadId,
    galleryIds: [...state.galleryUploadIds],
    createdAt: ex?.createdAt || Date.now()
  };

  await dbPut('projects', proj);
  if (ex) {
    const i = state.projects.findIndex(p => p.id === id);
    state.projects[i] = proj;
  } else {
    state.projects.unshift(proj);
  }

  closeProjectForm();
  await applySettings();
  renderPublic();
  renderAdmin();
}

const splitLines = id => document.getElementById(id).value.split('\n').map(x => x.trim()).filter(Boolean);

function serviceRowHtml(s) {
  return `
    <div class="service-row" style="border:1px solid var(--line);border-radius:10px;padding:16px;margin-bottom:12px;background:var(--bg-3)">
      <div class="field"><label>Title</label><input type="text" class="svc-title" value="${escapeHtml(s.title)}"></div>
      <div class="field"><label>Description</label><textarea class="svc-desc">${escapeHtml(s.description)}</textarea></div>
      <button type="button" class="btn-sm btn-danger" onclick="this.closest('.service-row').remove()">Remove</button>
    </div>
  `;
}

function addServiceRow() {
  document.getElementById('servicesEditor').insertAdjacentHTML('beforeend', serviceRowHtml({ title: '', description: '' }));
}

function collectServices() {
  return [...document.querySelectorAll('#servicesEditor .service-row')].map(r => ({
    title: r.querySelector('.svc-title').value.trim(),
    description: r.querySelector('.svc-desc').value.trim()
  })).filter(x => x.title);
}

async function renderSettings() {
  const s = state.settings;
  document.getElementById('setSpec').value = (s.spec || []).join('\n');
  document.getElementById('setSoft').value = (s.software || []).join('\n');
  document.getElementById('servicesEditor').innerHTML = (s.services || []).map(serviceRowHtml).join('');
  document.getElementById('setName').value = s.name;
  document.getElementById('setLogo').value = s.logo;
  document.getElementById('setHeadline').value = s.headline;
  document.getElementById('setHeroDesc').value = s.heroDesc;
  document.getElementById('setAboutDesc').value = s.aboutDesc;
  document.getElementById('setWhatsapp').value = s.whatsapp || '';
  document.getElementById('setInstagram').value = s.instagram || '';
  document.getElementById('setEmail').value = s.email || '';
  document.getElementById('setTiktok').value = s.tiktok || '';
  state.profileUploadId = s.profileImageId || null;

  const w = document.getElementById('profilePreview');
  w.innerHTML = '';
  if (s.profileImageId) {
    const u = await getImageURL(s.profileImageId);
    w.innerHTML = `<div class="preview-item" style="width:120px;height:120px"><img src="${u}" alt="Profile preview"></div>`;
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const n = {
    ...state.settings,
    name: document.getElementById('setName').value.trim(),
    logo: document.getElementById('setLogo').value.trim(),
    headline: document.getElementById('setHeadline').value.trim(),
    heroDesc: document.getElementById('setHeroDesc').value.trim(),
    aboutDesc: document.getElementById('setAboutDesc').value.trim(),
    whatsapp: document.getElementById('setWhatsapp').value.trim(),
    instagram: document.getElementById('setInstagram').value.trim(),
    email: document.getElementById('setEmail').value.trim(),
    tiktok: document.getElementById('setTiktok').value.trim(),
    profileImageId: state.profileUploadId || state.settings.profileImageId,
    spec: splitLines('setSpec'),
    software: splitLines('setSoft'),
    services: collectServices()
  };
  await dbPut('settings', { key: 'main', data: n });
  state.settings = n;
  await applySettings();
  alert('Settings saved successfully.');
}

function setupDragDrop() {
  const z = [
    { el: document.getElementById('coverUploadZone'), multi: false },
    { el: document.getElementById('galleryUploadZone'), multi: true },
    { el: document.getElementById('profileUploadZone'), multi: false }
  ];
  z.forEach(x => {
    if (!x.el) return;
    ['dragenter', 'dragover'].forEach(ev => x.el.addEventListener(ev, e => {
      e.preventDefault();
      x.el.classList.add('dragover');
    }));
    ['dragleave', 'drop'].forEach(ev => x.el.addEventListener(ev, e => {
      e.preventDefault();
      x.el.classList.remove('dragover');
    }));
    x.el.addEventListener('drop', e => {
      const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
      if (!files.length) return;
      if (x.multi) {
        handleGalleryFiles(files);
      } else {
        handleCoverFile(files[0]);
      }
    });
  });
}

async function handleCoverFile(f) {
  if (!validateImage(f)) return;
  const id = await storeImage(f);
  state.coverUploadId = id;
  const u = await getImageURL(id);
  renderCoverPreview(u);
}

async function handleGalleryFiles(files) {
  for (const f of files) {
    if (!validateImage(f)) continue;
    const id = await storeImage(f);
    state.galleryUploadIds.push(id);
    const u = await getImageURL(id);
    renderGalleryPreviewItem(u, id);
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

document.addEventListener('DOMContentLoaded', init);
