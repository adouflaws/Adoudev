/* =============================================
   ADOUDEV — script.js
   ============================================= */

/* ---- Navbar sticky ---- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ---- Menu overlay plein écran ---- */
const navToggle  = document.getElementById('navToggle');
const navOverlay = document.getElementById('navOverlay');

navToggle.addEventListener('click', () => {
  const isOpen = navOverlay.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

document.querySelectorAll('.overlay-link').forEach(link => {
  link.addEventListener('click', () => {
    navOverlay.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

/* ---- Animations au scroll (IntersectionObserver) ---- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-up, .animate-reveal').forEach(el => observer.observe(el));

/* ---- Barres de compétences animées ---- */
const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const pct = entry.target.dataset.pct;
      const fill = entry.target.querySelector('.skill-fill');
      if (fill) fill.style.setProperty('--pct', pct + '%');
      skillObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.skill-item[data-pct]').forEach(el => skillObserver.observe(el));

/* ---- Compteur animé des stats ---- */
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(counter => {
    const text  = counter.textContent;
    const match = text.match(/(\d+)/);
    if (!match) return;
    const target = parseInt(match[1]);
    const suffix = text.replace(match[1], '');
    let current  = 0;
    const step   = Math.ceil(target / (1500 / 16));
    const timer  = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      counter.textContent = current + suffix;
    }, 16);
  });
}

const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animateCounters(); }
    });
  }, { threshold: 0.5 }).observe(statsSection);
}

/* ---- Nav active au scroll ---- */
const sections = document.querySelectorAll('section[id]');
new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      document.querySelectorAll('.overlay-link').forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}`
          ? 'var(--accent)' : '';
      });
    }
  });
}, { threshold: 0.35 }).observe;

/* ---- Filtres projets ---- */
const filterBtns = document.querySelectorAll('.bento-filter-btn');
const bentoCards = document.querySelectorAll('.bento-card[data-category]');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    bentoCards.forEach(card => {
      card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter);
    });
  });
});

/* ---- Hover glow sur cards ---- */
document.querySelectorAll('.service-card, .bento-card, .testimonial-card, .cta-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
});

/* ---- Formspree ---- */
const FORMSPREE_ID = 'xvzlpbkn';
const form         = document.getElementById('contactForm');
const formSuccess  = document.getElementById('formSuccess');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn     = form.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('span');
  btn.disabled  = true;
  btnText.textContent = 'Envoi en cours…';

  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form),
    });
    if (res.ok) {
      form.reset();
      formSuccess.textContent = 'Message envoyé ! Je vous réponds sous 24h.';
      formSuccess.className   = 'form-success';
    } else {
      formSuccess.textContent = "Erreur lors de l'envoi. Réessayez ou écrivez-moi directement.";
      formSuccess.className   = 'form-success form-error';
    }
  } catch {
    formSuccess.textContent = 'Erreur réseau. Vérifiez votre connexion.';
    formSuccess.className   = 'form-success form-error';
  }

  formSuccess.hidden  = false;
  btn.disabled        = false;
  btnText.textContent = 'Envoyer ma demande';
  setTimeout(() => { formSuccess.hidden = true; formSuccess.className = 'form-success'; }, 6000);
});
