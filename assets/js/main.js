/* Interaction layer: nav state, Spanish clock, scroll reveals, stat
   counters, chip icons, the bookmark ribbon and the quill that writes its
   way down the chapters. No dependencies. */
(function () {
  'use strict';

  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------- nav */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');

  function navState() {
    nav.classList.toggle('scrolled', scrollY > 30);
  }
  addEventListener('scroll', navState, { passive: true });
  navState();

  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  // active section highlight
  var sections = document.querySelectorAll('section[id]');
  var navAnchors = links.querySelectorAll('a[href^="#"]');
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      navAnchors.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(function (s) { spy.observe(s); });

  /* ---------------------------------------------- Spanish clock */
  var clockEl = document.getElementById('clock');
  if (clockEl) {
    var fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    var tickClock = function () { clockEl.textContent = fmt.format(new Date()); };
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* ---------------------------------------------- cursor lamplight */
  var spot = document.getElementById('spotlight');
  if (spot && matchMedia('(hover: hover)').matches) {
    addEventListener('pointermove', function (e) {
      spot.style.setProperty('--sx', e.clientX + 'px');
      spot.style.setProperty('--sy', e.clientY + 'px');
    }, { passive: true });
  }

  /* ---------------------------------------------- split section titles */
  document.querySelectorAll('.sec__title').forEach(function (title) {
    var text = title.textContent;
    title.textContent = '';
    title.setAttribute('aria-label', text);
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--c', i);
      s.textContent = text[i] === ' ' ? ' ' : text[i];
      title.appendChild(s);
    }
  });

  /* ---------------------------------------------- pointer tilt */
  if (!REDUCED && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.stat, .course, .panel, .libcard, .phrase').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        card.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-3px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------- reveals */
  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        revealer.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { revealer.observe(el); });

  /* ---------------------------------------------- stat counters */
  function countUp(el) {
    var target = +el.dataset.count;
    var suffix = el.dataset.suffix || '';
    if (REDUCED) { el.textContent = target + suffix; return; }
    var t0 = null;
    var dur = 1400;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counter = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        countUp(en.target);
        counter.unobserve(en.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { counter.observe(el); });

  /* ---------------------------------------------- chip icons */
  var STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    ear: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
    spark: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8"/>',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  };
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    var body = ICONS[el.getAttribute('data-icon')];
    if (!body) return;
    var span = document.createElement('span');
    span.className = 'chip-icon';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" ' + STROKE + '>' + body + '</svg>';
    el.insertBefore(span, el.firstChild);
  });

  /* ---------------------------------------------- bookmark ribbon */
  var scrollMark = document.getElementById('scrollMark');
  if (scrollMark) {
    var barTick = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      var p = max > 0 ? scrollY / max : 0;
      scrollMark.style.top = (p * 100).toFixed(2) + '%';
    };
    addEventListener('scroll', barTick, { passive: true });
    barTick();
  }

  /* ---------------------------------------------- toast */
  var toastEl = null;
  var toastTimer = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast mono';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('toast--in');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('toast--in'); }, 2600);
  }

  var ES = document.documentElement.lang === 'es';

  /* mailto can fail silently on desktops with no mail app — always leave
     the visitor holding the address as well */
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText('pjha2128@gmail.com').then(function () {
        toast(ES ? '✓ correo copiado — pjha2128@gmail.com' : '✓ email copied — pjha2128@gmail.com');
      }, function () {});
    });
  });

  /* share button: native share sheet where it exists, copy-link elsewhere */
  document.querySelectorAll('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = location.origin + location.pathname;
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          toast(ES ? '✓ enlace copiado — compártelo donde quieras' : '✓ link copied — share it anywhere');
        }, function () {});
      }
    });
  });

  /* ---------------------------------------------- quill down the chapters */
  var story = document.getElementById('story');
  var quill = document.getElementById('storyQuill');
  if (story && quill) {
    var nodes = story.querySelectorAll('.leg__node');
    var storyTick = function () {
      var r = story.getBoundingClientRect();
      var focus = innerHeight * 0.45;
      var p = Math.min(1, Math.max(0, (focus - r.top) / r.height));
      quill.style.top = (p * 100).toFixed(2) + '%';
      nodes.forEach(function (n) {
        n.classList.toggle('passed', n.getBoundingClientRect().top < focus);
      });
    };
    addEventListener('scroll', storyTick, { passive: true });
    storyTick();
  }
})();
