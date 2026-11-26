/* Motion behaviour. Kept small and dependency-free on purpose:
   it toggles classes, it does not build the page. */
(function () {
  'use strict';

  var root = document.documentElement;
  var motionOK = root.getAttribute('data-motion') === 'on';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The head script armed a failsafe; we are alive, so cancel it.
  if (window.__motionFail) { clearTimeout(window.__motionFail); }

  if (!motionOK || reduced) {
    // Reveal everything and stop. No observers, no listeners on scroll.
    root.removeAttribute('data-motion');
    return;
  }

  // ---- what gets revealed, in the order it appears ----
  var SELECTORS = [
    '.sec-head',
    '.case',
    '.prose > h2',
    '.prose > h3',
    '.prose > p',
    '.prose > ul',
    '.prose > table',
    '.prose > blockquote',
    '.facts-aside',
    '.next',
    '.close > *',
    '.cols > div'
  ].join(',');

  var nodes = [].slice.call(document.querySelectorAll(SELECTORS));

  // Above-the-fold content is already on screen at load; the hero has its own
  // entrance, so don't double-animate it.
  var viewportH = window.innerHeight;
  var pending = [];

  nodes.forEach(function (el) {
    var onScreen = el.getBoundingClientRect().top < viewportH * 0.92;
    el.classList.add('reveal');
    if (onScreen) {
      // Already visible: mark it in on the same frame so it never flashes
      // hidden-then-shown. The hero carries the entrance on these pages.
      el.classList.add('is-in');
    } else {
      pending.push(el);
    }
  });

  if (!('IntersectionObserver' in window)) {
    nodes.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('is-in');
      io.unobserve(el);
      // drop the inline delay after it has done its work
      window.setTimeout(function () { el.style.transitionDelay = ''; }, 700);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  pending.forEach(function (el) {
    // stagger by position among revealed siblings, so lists ripple
    var sibs = el.parentNode ? [].slice.call(el.parentNode.children).filter(function (c) {
      return c.classList && c.classList.contains('reveal');
    }) : [];
    var i = sibs.indexOf(el);
    el.style.transitionDelay = (Math.min(i, 3) * 55) + 'ms';
    io.observe(el);
  });

  // ---- header shadow, only after the page has moved ----
  var mast = document.querySelector('header.mast');
  if (mast) {
    var onScroll = function () {
      mast.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- reading progress on a single article page ----
  var article = document.querySelector('.post');
  if (article) {
    var bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var tick = function () {
      var box = article.getBoundingClientRect();
      var total = box.height - window.innerHeight;
      var done = total > 0 ? (-box.top) / total : 1;
      bar.style.width = (Math.min(Math.max(done, 0), 1) * 100) + '%';
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }
})();
