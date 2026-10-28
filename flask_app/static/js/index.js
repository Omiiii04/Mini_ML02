/* index.js  —  Landing page micro-interactions */

// ── Nav scroll transparency ────────────────────────────────────────────────
(function () {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  function onScroll() {
    const y = window.scrollY;
    if (y > 40) {
      nav.style.background = 'rgba(9,9,11,0.88)';
    } else {
      nav.style.background = 'rgba(9,9,11,0.6)';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ── Smooth scroll for anchor links ───────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── Intersection Observer — fade-in feature cards ────────────────────────────
(function () {
  const cards = document.querySelectorAll('.feature-card, .step-item');
  if (!cards.length) return;

  // Start hidden
  cards.forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  cards.forEach(function (el) { observer.observe(el); });
})();
