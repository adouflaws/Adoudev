/* =============================================
   STONEDEV — script.js
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

/* ---- Accordion Expertise (un seul panneau ouvert à la fois) ---- */
document.querySelectorAll('#accordion .acc-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item = trigger.closest('.acc-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('#accordion .acc-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

/* ---- Réalisations : filtre (multi-catégories) ---- */
const workTabs  = document.querySelectorAll('.work-tab');
const workCards = document.querySelectorAll('.work-card');

workTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    workTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.filter;
    const shownCards = [];
    workCards.forEach(card => {
      const cats = (card.dataset.category || '').split(' ');
      const show = filter === 'all' || cats.includes(filter);
      card.hidden = !show;
      if (show) shownCards.push(card);
    });
    // La grille change de hauteur (cartes cachées/affichées) : les positions de déclenchement
    // ScrollTrigger calculées pour tout ce qui suit #realisations dans la page sont désormais
    // fausses tant qu'on ne recalcule pas — d'où le "bug de scroll" plus bas sur la page après un clic.
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    // Une carte filtrée-visible peut ne jamais avoir croisé son seuil de révélation au scroll
    // (défilement rapide, clic sur un filtre avant d'atteindre la carte) et rester à opacity:0
    // malgré hidden=false — d'où des résultats "manquants" au clic sur un filtre. Ajouter .is-visible
    // seul ne suffit pas : le batch générique de révélation (qui gère aussi .reveal ailleurs sur la
    // page) peut retirer cette classe juste après via son propre onLeaveBack, recalculé par le refresh
    // ci-dessus (constaté : la classe se faisait écraser même en forçant après le refresh). Un style
    // inline via gsap.set() prime sur n'importe quelle règle CSS à base de classe, donc ne peut plus
    // être défait par ce conflit, quel que soit l'ordre d'exécution des deux systèmes.
    if (typeof gsap !== 'undefined') {
      gsap.set(shownCards, { opacity: 1, y: 0 });
    }
    shownCards.forEach(card => card.classList.add('is-visible'));
  });
});

/* ---- Formulaire de contact : redirection vers WhatsApp (site 100% statique) ----
   Même numéro que les liens tel: du site (+223 76 75 30 87), au format wa.me (chiffres seuls, sans +). */
const contactForm = document.getElementById('contactForm');
const formSuccess  = document.getElementById('formSuccess');
const WHATSAPP_NUMBER = '22376753087';

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(contactForm).entries());
  const besoinLabels = { site: 'Création de site web', saas: 'SaaS / application métier', seo: 'SEO / GEO', auto: 'Automatisation', autre: 'Autre' };
  const lines = [
    `Nouveau projet — ${data.name}`,
    '',
    `Email : ${data.email}`,
    data.phone ? `Téléphone : ${data.phone}` : null,
    data.besoin ? `Besoin : ${besoinLabels[data.besoin] || data.besoin}` : null,
    '',
    data.message
  ].filter(Boolean).join('\n');

  // Nouvel onglet (pas window.location.href) : le visiteur garde le site ouvert et voit bien le
  // message de confirmation, au lieu que la page soit remplacée par WhatsApp avant que ça s'affiche.
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`, '_blank', 'noopener');

  formSuccess.hidden = false;
  contactForm.reset();
});

/* ---- GSAP : séquence immersive (pin, SplitText, révélations scrub) ---- */
(function initMotion() {
  if (typeof gsap === 'undefined') {
    return; // pas de GSAP (fichiers vendor manquants) : le contenu reste visible par défaut, voir CSS .reveal
  }

  gsap.registerPlugin(ScrollTrigger);
  const hasSplit = typeof SplitText !== 'undefined';
  if (hasSplit) gsap.registerPlugin(SplitText);
  document.documentElement.classList.add('js-anim');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  /* ---- Révélation générique (fallback + éléments sans traitement dédié) — bidirectionnelle ---- */
  const genericReveals = Array.from(document.querySelectorAll('.reveal')).filter(el => !el.closest('#hero'));
  ScrollTrigger.batch(genericReveals, {
    start: 'top 88%',
    onEnter: (batch) => {
      batch.forEach((el, i) => {
        el.classList.add('is-visible');
        el.style.transitionDelay = `${Math.min(i, 5) * 60}ms`;
      });
    },
    onLeaveBack: (batch) => {
      batch.forEach((el) => {
        el.style.transitionDelay = '0ms';
        el.classList.remove('is-visible');
      });
    }
  });

  /* ---- Parallax léger sur les textes fantômes ---- */
  document.querySelectorAll('.ghost-text').forEach((el) => {
    gsap.to(el, {
      x: '4%',
      ease: 'none',
      scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    });
  });

  /* ---- Titres de section : rideau ligne par ligne à l'entrée ---- */
  if (hasSplit) {
    document.querySelectorAll('.section-head h2, #cta h2, .contact-info h2').forEach((heading) => {
      SplitText.create(heading, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 110, opacity: 0, duration: 0.9, ease: 'power4.out', stagger: 0.08,
            scrollTrigger: { trigger: heading, start: 'top 88%', toggleActions: 'play none none reverse' }
          });
        }
      });
    });
  }

  /* ---- Hero : entrée cinématique au chargement (nom + texte) ----
     Reproduit précisément la séquence de la vidéo de référence Dribbble (analysée image par image
     via ffmpeg — pas de découpe caractère par caractère sur le nom) : 1) le nom entier apparaît en
     fondu d'opacité (DEV/plein se stabilise un peu avant STONE/contour), 2) une fois le nom stable,
     le texte (statut, titre, description, CTA, réseaux) se révèle, 3) la photo apparaît en tout
     dernier, d'un flou net vers la netteté — jamais en même temps que le texte.
     SplitText doit attendre que les polices custom soient chargées, sinon il découpe les lignes
     sur les métriques de la police de secours (largeurs différentes) et le texte peut mal s'aligner
     une fois Outfit/Manrope appliquées. */
  // Caché tout de suite (avant l'attente de document.fonts.ready, qui peut prendre plus d'1s) pour
  // éviter un flash "contenu visible → coupé à opacity:0 → ré-animé" une fois l'entrée déclenchée.
  // La liste doit matcher exactement ce que buildHeroEntrance() anime plus bas dans chaque branche.
  gsap.set(hasSplit
    ? ['.hero-name .solid', '.hero-name .outline', '.status-pill', '.hero-left h2', '.hero-left p', '.hero-left .btn-dark', '.hero-social .pill-link', '.hero-portrait']
    : ['.hero-name', '.status-pill', '.hero-left', '.hero-portrait', '.hero-social'],
    { opacity: 0 });

  function buildHeroEntrance() {
    // Sous 700px, la séquence est nettement raccourcie (photo notamment) : le pin cinématique du
    // scroll est désactivé sur mobile (voir plus bas), donc une entrée de ~2s au chargement — pensée
    // pour un desktop qui regarde — se lit comme "lent/cassé" pour un pouce mobile pressé de scroller.
    const isNarrow = window.matchMedia('(max-width: 699px)').matches;
    const heroTl = gsap.timeline({ delay: 0.1 });
    if (hasSplit) {
      const leftSplit = SplitText.create('.hero-left h2, .hero-left p', { type: 'lines', mask: 'lines' });
      // Le split vient de créer les lignes : la révélation est désormais portée par leurs propres
      // tweens ci-dessous, donc le conteneur (caché en amont pour éviter le flash) redevient visible.
      gsap.set(['.hero-left h2', '.hero-left p'], { opacity: 1 });
      // fromTo (pas from) partout ici : les éléments ont déjà été mis à opacity:0 par le gsap.set
      // ci-dessus, donc un simple .from() capterait cet état déjà à 0 comme valeur "d'arrivée"
      // implicite (current value au moment de la création du tween) et resterait invisible.
      heroTl
        // Temps 1 (0 → ~0.9s) — nom en fondu, pas de slide par caractère
        .fromTo('.hero-name .solid',   { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .fromTo('.hero-name .outline', { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0)
        // Temps 2 — texte, une fois le nom stabilisé (fenêtre compressée sur mobile)
        .fromTo('.status-pill',     { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, isNarrow ? 0.35 : 0.5)
        .from(leftSplit.lines,    { yPercent: 120, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, isNarrow ? 0.4 : 0.55)
        .fromTo('.hero-left .btn-dark', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, isNarrow ? 0.55 : 0.8)
        .fromTo('.hero-social .pill-link', { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08 }, isNarrow ? 0.55 : 0.8)
        // Temps 3 — la photo en tout dernier, flou → net (bien plus court/léger sur mobile)
        .fromTo('.hero-portrait',
          { opacity: 0, filter: isNarrow ? 'blur(10px)' : 'blur(16px)' },
          { opacity: 1, filter: 'blur(0px)', duration: isNarrow ? 0.5 : 1, ease: 'power2.out' },
          isNarrow ? 0.55 : 1.0);
    } else {
      heroTl.fromTo(['.hero-name', '.status-pill', '.hero-left', '.hero-portrait', '.hero-social'], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' });
    }
  }
  if (hasSplit && document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.ready.then(buildHeroEntrance);
  } else {
    buildHeroEntrance();
  }

  /* ---- Hero : séquence épinglée en 2 temps façon film — desktop, tablette ET mobile ---- */
  ScrollTrigger.matchMedia({
    '(min-width: 700px)': function () {
      const heroPinTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero', start: 'top top', end: '+=1500', scrub: 0.7, pin: true, anticipatePin: 1,
          // Une fois le pin terminé, le hero (figé dans son état "zoomé") s'efface complètement :
          // sans ça, on re-scrolle une 2e fois à travers la même photo agrandie avant d'atteindre la suite.
          // La liste de preuves (position:fixed) doit aussi disparaître ici — sinon elle reste affichée
          // par-dessus TOUT le reste de la page (jusqu'au footer) puisque rien ne la cache jamais.
          onLeave: () => {
            gsap.set('#hero', { height: 0, padding: 0, overflow: 'hidden' });
            gsap.to('.hero-captions', { opacity: 0, duration: 0.3, overwrite: true });
          },
          onEnterBack: () => {
            gsap.set('#hero', { clearProps: 'height,padding,overflow' });
            gsap.to('.hero-captions', { opacity: 1, duration: 0.3, overwrite: true });
          }
        }
      });
      heroPinTl
        // Temps 1 (0 → 0.5) — la photo prend le dessus, le texte recule
        .to('.hero-portrait', { scale: 1.24, y: -50, ease: 'none', duration: 0.5 }, 0)
        .to('.hero-name',     { scale: 0.88, opacity: 0.22, ease: 'none', duration: 0.5 }, 0)
        .to(['.hero-left', '.hero-social', '.status-pill'], { opacity: 0, y: -24, ease: 'none', duration: 0.3 }, 0.08)
        // Temps 2 (0.5 → 1) — plan tenu, la photo continue de respirer jusqu'au relâchement
        .to('.hero-portrait', { scale: 1.36, rotate: -1.6, ease: 'none', duration: 0.5 }, 0.5)
        // Sous-titres : chaque ligne apparaît puis disparaît dans sa propre fenêtre du scrub —
        // intégrées à heroPinTl (pas de ScrollTrigger séparé), donc naturellement bidirectionnelles.
        // Fenêtres démarrées à 0.5+ seulement (une fois que .hero-name a fini de s'estomper à 0.22 et que
        // la photo a bien grossi) pour ne pas s'imbriquer avec "STONE/DEV" encore pleinement opaque.
        .fromTo('.cap-1', { opacity: 0, y: 16, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'none', duration: 0.05 }, 0.5)
        .to('.cap-1', { opacity: 0, y: -16, filter: 'blur(8px)', ease: 'none', duration: 0.05 }, 0.62)
        .fromTo('.cap-2', { opacity: 0, y: 16, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'none', duration: 0.05 }, 0.67)
        .to('.cap-2', { opacity: 0, y: -16, filter: 'blur(8px)', ease: 'none', duration: 0.05 }, 0.78)
        .fromTo('.cap-3', { opacity: 0, y: 16, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'none', duration: 0.05 }, 0.83);
    },
    // Sous 700px : même famille de séquence qu'au-dessus (pin + zoom photo + recul du texte), mais
    // recalibrée mobile — distance de pin plus courte (900 vs 1500px, un scroll mobile "coûte" plus cher
    // en gestes de pouce), zoom moins prononcé (1.22 vs 1.36, écran étroit = moins de marge visuelle),
    // pas de `rotate` (détail qui ne se voit quasiment pas sur un écran de 6"). Le `drop-shadow()` de la
    // photo est déjà retiré <700px (voir style.css) donc le `scale` continu ici est sûr — c'est justement
    // ce qui a permis de remplacer l'ancien parallax (sans scale, pour éviter le bug de halo) par un vrai
    // pin cinématique maintenant que la cause du bug (drop-shadow + scale) est éliminée à la racine.
    '(max-width: 699px)': function () {
      const heroPinTlMobile = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero', start: 'top top', end: '+=900', scrub: 0.6, pin: true, anticipatePin: 1,
          // Le collapse (height:0 + overflow:hidden) suffit techniquement à masquer .hero-proof-list
          // (clippée), mais on la remet aussi explicitement à opacity:0 — comme .hero-captions sur
          // desktop — pour ne pas dépendre d'un effet de bord si le mécanisme de collapse change un jour.
          onLeave: () => {
            gsap.set('#hero', { height: 0, padding: 0, overflow: 'hidden' });
            gsap.to('.hero-proof-list li', { opacity: 0, duration: 0.3, overwrite: true });
          },
          onEnterBack: () => gsap.set('#hero', { clearProps: 'height,padding,overflow' })
        }
      });
      // Valeur calculée une fois (résolue par GSAP à la construction du tween, pas frame par frame) :
      // la translation nécessaire pour amener le CENTRE de la photo au centre vertical de l'écran —
      // demande explicite ("la photo au milieu de l'écran"), plutôt qu'un décalage fixe approximatif.
      const portraitEl = document.querySelector('.hero-portrait');
      const centerPortraitY = () => {
        const rect = portraitEl.getBoundingClientRect();
        return (window.innerHeight / 2) - (rect.top + rect.height / 2);
      };
      heroPinTlMobile
        .to('.hero-portrait', { scale: 1.14, y: centerPortraitY, ease: 'none', duration: 0.5 }, 0)
        .to('.hero-name',     { scale: 0.9, opacity: 0.25, ease: 'none', duration: 0.5 }, 0)
        .to(['.hero-left', '.hero-social', '.status-pill'], { opacity: 0, y: -18, ease: 'none', duration: 0.3 }, 0.1)
        .to('.hero-portrait', { scale: 1.22, ease: 'none', duration: 0.5 }, 0.5)
        // Preuves mobile : une ligne à la fois, apparaît puis disparaît dans sa fenêtre du scrub —
        // même principe que .cap-1/2/3 desktop (fenêtres démarrées à 0.5+, une fois le nom déjà reculé).
        .fromTo('.hero-proof-list li:nth-child(1)', { opacity: 0, y: 14 }, { opacity: 1, y: 0, ease: 'none', duration: 0.1 }, 0.5)
        .to('.hero-proof-list li:nth-child(1)', { opacity: 0, y: -14, ease: 'none', duration: 0.1 }, 0.63)
        .fromTo('.hero-proof-list li:nth-child(2)', { opacity: 0, y: 14 }, { opacity: 1, y: 0, ease: 'none', duration: 0.1 }, 0.68)
        .to('.hero-proof-list li:nth-child(2)', { opacity: 0, y: -14, ease: 'none', duration: 0.1 }, 0.81)
        .fromTo('.hero-proof-list li:nth-child(3)', { opacity: 0, y: 14 }, { opacity: 1, y: 0, ease: 'none', duration: 0.1 }, 0.86);
    }
  });

  /* ---- Réalisations : chaque carte est une mini-séquence chorégraphiée au scroll ---- */
  document.querySelectorAll('.work-card').forEach((card) => {
    const thumb = card.querySelector('.work-thumb-img');
    const title = card.querySelector('.work-info h3');
    const desc  = card.querySelector('.work-info > p');
    const tags  = card.querySelector('.work-tags');
    const badge = card.querySelector('.work-badge');
    if (!thumb) return;

    gsap.set([desc, tags].filter(Boolean), { opacity: 0, y: 16 });
    if (badge) gsap.set(badge, { opacity: 0, scale: 0.7 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 38%', scrub: 0.6 }
    });
    tl.fromTo(thumb, { clipPath: 'inset(0% 0 100% 0)', scale: 1.18 }, { clipPath: 'inset(0% 0 0% 0)', scale: 1, ease: 'none' }, 0);
    if (badge) tl.to(badge, { opacity: 1, scale: 1, ease: 'none' }, 0.28);
    if (title && hasSplit) {
      const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
      tl.fromTo(split.lines, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', stagger: 0.1 }, 0.2);
    }
    if (desc)  tl.to(desc, { opacity: 1, y: 0, ease: 'none' }, 0.42);
    if (tags)  tl.to(tags, { opacity: 1, y: 0, ease: 'none' }, 0.55);

    // Le bouton "voir" apparaît et suit le curseur dans la vignette
    const view = card.querySelector('.work-view');
    const thumbBox = card.querySelector('.work-thumb');
    if (view && thumbBox && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      thumbBox.addEventListener('mouseenter', () => {
        gsap.to(view, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
      });
      thumbBox.addEventListener('mousemove', (e) => {
        const rect = thumbBox.getBoundingClientRect();
        gsap.to(view, { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2, duration: 0.5, ease: 'power3.out' });
      });
      thumbBox.addEventListener('mouseleave', () => {
        gsap.to(view, { opacity: 0, scale: 0.7, x: 0, y: 0, duration: 0.5, ease: 'power3.out' });
      });
    }
  });

  // Étude de cas Mali Mannol : même traitement rideau
  const caseThumb = document.querySelector('.case-mockup-img');
  if (caseThumb) {
    gsap.fromTo(caseThumb,
      { clipPath: 'inset(0% 0 100% 0)', scale: 1.12 },
      { clipPath: 'inset(0% 0 0% 0)', scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.case-mockup', start: 'top 88%', end: 'top 45%', scrub: 0.5 } }
    );
  }

  /* ---- Bouton CTA principal du hero : légère attraction magnétique au survol ---- */
  const magnetic = document.querySelector('.hero-left .btn-dark');
  if (magnetic && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    magnetic.addEventListener('mousemove', (e) => {
      const rect = magnetic.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
      gsap.to(magnetic, { x, y, duration: 0.4, ease: 'power3.out' });
    });
    magnetic.addEventListener('mouseleave', () => {
      gsap.to(magnetic, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });
  }

  // Filet de sécurité : si les polices custom finissent de charger après coup, la mise en page peut
  // légèrement bouger (largeurs de texte différentes) — on recalcule toutes les positions de scroll.
  if (document.fonts && document.fonts.status !== 'loaded') {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
