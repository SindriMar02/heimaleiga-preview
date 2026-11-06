/* Heimaleiga v3: The Drake's motion grammar (TEARDOWN drake-2026-11-06): Lenis on fine pointers, in-view classes,
   boxed headings that round one word every 3 s, illustrations that redraw every 0.5 s, a 5 s hero cycle with progress
   lines, rounded-corner push openings, a directory that swaps one photo per floor. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const cfg = JSON.parse($('#cfg').textContent), IS = cfg.lang === 'is';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* smooth scroll: Lenis on fine pointers only (phones keep native scroll) */
  let lenis = null;
  if (fine && !reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .1, wheelMultiplier: 1 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
  }
  const scrollToEl = (el) => { if (lenis) lenis.scrollTo(el, { offset: -100 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]'); if (!a || a.target) return;
    const u = new URL(a.href, location.href); if (u.pathname !== location.pathname || !u.hash) return;
    const el = document.getElementById(decodeURIComponent(u.hash.slice(1))); if (!el) return;
    e.preventDefault(); scrollToEl(el); history.replaceState(null, '', u.hash);
  });

  /* header: expanded at the top, folds into one compact row once the page moves; hover or keyboard focus unfolds it */
  const hdr = $('[data-hdr]'); let hq = false;
  const hset = () => { hq = false; hdr.classList.toggle('is-compact', scrollY > 60); };
  addEventListener('scroll', () => { if (!hq) { hq = true; requestAnimationFrame(hset); } }, { passive: true }); hset();
  if (fine) { hdr.addEventListener('mouseenter', () => hdr.classList.add('is-open')); hdr.addEventListener('mouseleave', () => { if (!pickOpen()) hdr.classList.remove('is-open'); }); }
  hdr.addEventListener('focusin', () => hdr.classList.add('is-open'));
  hdr.addEventListener('focusout', (e) => { if (!hdr.contains(e.relatedTarget) && !pickOpen()) hdr.classList.remove('is-open'); });
  function pickOpen() { const pk = $('[data-pick]'); return pk && pk.dataset.open === 'true'; }

  /* in-view (Locomotive data-scroll, offset 20%): headings and illustrations replay, the rest reveals once */
  const timers = new WeakMap();
  const io = new IntersectionObserver((ens) => ens.forEach((en) => {
    const el = en.target;
    if (en.isIntersecting) { el.classList.add('is-inview'); start(el); }
    else { stop(el); if (el.matches('[data-heading]') && en.boundingClientRect.top > 0) el.classList.remove('is-inview'); }
  }), { rootMargin: '0px 0px -20% 0px' });
  $$('[data-io], [data-heading], [data-illu]').forEach((el) => io.observe(el));
  /* the opening: everything inside the first screen (hero, house or owners hero) plays on load, not on scroll */
  requestAnimationFrame(() => $$('.hero [data-heading], .hero [data-io], .bh[data-io], .bh [data-heading], .bh [data-io]').forEach((el) => { el.classList.add('is-inview'); start(el); }));
  function start(el) {
    if (reduce || timers.get(el)) return;
    if (el.matches('[data-heading]')) {            /* c-heading: a random other word becomes .is-active every 3 s */
      const ws = $$('.w', el); if (ws.length < 2) return;
      let cur = ws.findIndex((w) => w.classList.contains('is-active'));
      timers.set(el, setInterval(() => { if (cur > -1) ws[cur].classList.remove('is-active'); let n; do { n = Math.floor(Math.random() * ws.length); } while (n === cur); cur = n; ws[cur].classList.add('is-active'); }, 3000));
    } else if (el.matches('[data-illu]')) {        /* ILLU_INTERVALLE .5 s */
      const fr = $$('svg', el); let k = 0;
      timers.set(el, setInterval(() => { fr[k].classList.remove('is-active'); k = (k + 1) % fr.length; fr[k].classList.add('is-active'); }, 500));
    }
  }
  function stop(el) { const t = timers.get(el); if (t) { clearInterval(t); timers.delete(el); } }

  /* hero medias: 5 s per slide, cross-fade .8 s, a progress line per thumbnail, hover or click selects */
  const hero = $('[data-hero]');
  if (hero) {
    const slides = $$('[data-slide]', hero), ctas = $$('[data-cta]', hero), bars = $$('[data-bar]', hero);
    let held = false; const DUR = 5000; let i = -1, t0 = 0, raf = 0, playing = false, inview = true;
    const go = (n) => {
      if (n === i) return;
      slides.forEach((s, k) => { s.classList.toggle('is-prev', k === i); s.classList.toggle('is-active', k === n); });
      ctas.forEach((c, k) => c.setAttribute('aria-current', String(k === n)));
      bars.forEach((b) => { b.style.transform = 'scaleX(0)'; });
      i = n; t0 = performance.now();
    };
    const tick = (now) => {
      if (!playing) return;
      const p = Math.min(1, (now - t0) / DUR); if (bars[i]) bars[i].style.transform = `scaleX(${p})`;
      if (p >= 1) go((i + 1) % slides.length);
      raf = requestAnimationFrame(tick);
    };
    const play = () => { if (reduce || playing || !inview || document.hidden || held) return; playing = true; t0 = performance.now() - (parseFloat((bars[i] || {}).style?.transform?.match(/[\d.]+/)?.[0] || 0) * DUR); raf = requestAnimationFrame(tick); };
    const pause = () => { playing = false; cancelAnimationFrame(raf); };
    go(0); play();
    const pb = $('[data-hero-pause]');
    if (pb) pb.addEventListener('click', () => { held = !held; pb.setAttribute('aria-pressed', String(held)); pb.textContent = held ? pb.dataset.lPlay : pb.dataset.lPause; held ? pause() : play(); });
    ctas.forEach((c, k) => { c.addEventListener('click', () => { pause(); go(k); play(); }); if (fine) c.addEventListener('mouseenter', () => { pause(); go(k); play(); }); });
    new IntersectionObserver(([en]) => { inview = en.isIntersecting; inview ? play() : pause(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  }

  /* floors: hovering or focusing a house name swaps the one photo of that floor */
  $$('[data-dir]').forEach((band) => {
    const rows = $$('[data-dir-row]', band), imgs = $$('[data-dir-img]', band), cap = $('[data-dir-cap]', band);
    const set = (k) => { imgs.forEach((im, j) => im.classList.toggle('is-active', j === k)); rows.forEach((r, j) => r.classList.toggle('is-current', j === k)); if (cap) cap.textContent = $('.nm', rows[k]).textContent; };
    rows.forEach((r, k) => { r.addEventListener('mouseenter', () => set(k)); r.addEventListener('focus', () => set(k)); });
  });

  /* front desk clock: Reykjavík time */
  const clk = $('[data-clock]');
  if (clk) { const f = new Intl.DateTimeFormat(IS ? 'is-IS' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Atlantic/Reykjavik' }); const upd = () => { clk.textContent = f.format(new Date()); }; upd(); setInterval(upd, 15000); }

  /* carousels */
  $$('[data-car]').forEach((car) => {
    const tr = $('[data-track]', car), pv = $('[data-prev]', car), nx = $('[data-next]', car); if (!tr || !pv) return;
    const step = () => { const s = tr.children[0]; return s ? s.getBoundingClientRect().width + parseFloat(getComputedStyle(tr).columnGap || 16) : 360; };
    const upd = () => { pv.disabled = tr.scrollLeft < 4; nx.disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 4; };
    pv.addEventListener('click', () => tr.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }));
    nx.addEventListener('click', () => tr.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }));
    tr.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    if (lenis) tr.setAttribute('data-lenis-prevent', '');
  });

  /* accommodations panel: location tabs (hover, click, arrow keys) switch the building cards */
  const pick = $('[data-pick]');
  if (pick) {
    const btn = $('[data-pick-btn]', pick), tabs = $$('.pk-tab', pick), panes = $$('.pk-pane', pick);
    const set = (o) => { pick.dataset.open = String(o); btn.setAttribute('aria-expanded', String(o)); if (!o && !hdr.matches(':hover')) hdr.classList.remove('is-open'); if (o) hdr.classList.add('is-open'); };
    const show = (k, focus) => { tabs.forEach((tb, j) => { tb.setAttribute('aria-selected', String(j === k)); tb.tabIndex = j === k ? 0 : -1; }); panes.forEach((pn, j) => { pn.hidden = j !== k; }); if (focus) tabs[k].focus(); };
    btn.addEventListener('click', () => set(pick.dataset.open !== 'true'));
    tabs.forEach((tb, k) => { tb.addEventListener('click', () => show(k)); if (fine) tb.addEventListener('mouseenter', () => show(k)); tb.addEventListener('keydown', (e) => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); show((k + d + tabs.length) % tabs.length, true); } }); });
    document.addEventListener('click', (e) => { if (!pick.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pick.dataset.open === 'true') { set(false); btn.focus(); } });
    $('.pk-panes', pick).setAttribute('data-lenis-prevent', '');
    $$('a', pick).forEach((a) => a.addEventListener('click', () => set(false)));
  }

  /* dialogs: the panel takes focus on a pointer open, the first field on a keyboard open (focus-guard rule) */
  function openDialog(dlg, panel, first, e, opener) {
    dlg._opener = opener; dlg.showModal(); if (lenis) lenis.stop();
    (e && e.detail === 0 && first ? first : panel).focus({ preventScroll: true });
  }
  function wireClose(dlg, btn) {
    btn.addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { if (lenis) lenis.start(); const o = dlg._opener; if (o && o.focus) o.focus({ preventScroll: true }); });
  }
  const menu = $('[data-menu]');
  if (menu) { $('[data-menu-open]').addEventListener('click', (e) => openDialog(menu, $('[data-menu-panel]'), $('nav a', menu), e, e.currentTarget)); wireClose(menu, $('[data-menu-close]')); $$('a', menu).forEach((a) => a.addEventListener('click', () => menu.close())); }

  /* booking: SNDR calendar, hand-off to the house's own Guesty page */
  const bkd = $('[data-bkd]'), sel = $('[data-bkd-b]'), bkRoot = $('[data-bk]'), form = $('.bk-bar', bkRoot), hand = $('[data-handoff]');
  let booking = null;
  const showForm = () => { hand.hidden = true; form.hidden = false; };
  function handoff(s) {
    const slug = sel.value;
    if (!slug) { $('.bk-note', bkRoot).textContent = IS ? 'Veldu hús fyrst.' : 'Choose a building first.'; sel.focus(); return; }
    const url = `${cfg.hosts[slug]}/en?checkIn=${s.start}&checkOut=${s.end}&minOccupancy=${s.guests}`;
    $('[data-handoff-h]').textContent = cfg.names[slug];
    $('[data-handoff-sum]').textContent = IS ? `${s.label}, ${s.nights} ${s.nights === 1 ? 'nótt' : 'nætur'}, ${s.guests} ${s.guests === 1 ? 'gestur' : 'gestir'}.` : `${s.label}, ${s.nights} night${s.nights === 1 ? '' : 's'}, ${s.guests} guest${s.guests === 1 ? '' : 's'}.`;
    const go = $('[data-handoff-go]'); go.href = url; go.target = '_blank'; go.rel = 'noopener';
    form.hidden = true; hand.hidden = false; hand.focus({ preventScroll: true });
  }
  $('[data-handoff-back]').addEventListener('click', () => { showForm(); $('.bk-action', bkRoot).focus(); });
  sel.addEventListener('change', () => { $('.bk-note', bkRoot).textContent = ''; try { sessionStorage.setItem('hl-b', sel.value); } catch (_) {} });
  $$('[data-book]').forEach((b) => b.addEventListener('click', (e) => {
    if (menu && menu.open) menu.close();
    let rem = ''; try { rem = sessionStorage.getItem('hl-b') || ''; } catch (_) {}
    sel.value = b.dataset.b || cfg.pageB || rem || ''; showForm();
    if (!booking && window.mountBooking) booking = window.mountBooking(bkRoot, { lang: cfg.lang, min: 1, max: 30, guests: 2, months: 18, handoff });
    openDialog(bkd, $('[data-bkd-panel]'), sel, e, b);
    if (booking && booking.prepare) booking.prepare();
  }));
  wireClose(bkd, $('[data-bkd-close]'));
  bkRoot.addEventListener('click', (e) => { if (e.target.closest('[data-bk-clear]') && booking && booking.reset) booking.reset(); });
  [bkd, menu].forEach((d) => d && $$('.bkd-body, .menu-in', d).forEach((x) => x.setAttribute('data-lenis-prevent', '')));

  /* accordion: WAAPI height 300 ms cubic-bezier(.33,1,.68,1) (reference c-accordion) */
  $$('[data-acc] details').forEach((d) => {
    const s = $('summary', d), a = $('.a', d);
    s.addEventListener('click', (e) => {
      if (reduce) return; e.preventDefault();
      const opening = !d.open; if (opening) d.open = true;
      const h = a.scrollHeight;
      const an = a.animate({ height: opening ? ['0px', h + 'px'] : [h + 'px', '0px'] }, { duration: 300, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' });
      an.onfinish = () => { if (!opening) d.open = false; };
    });
  });

  /* owners enquiry: preview only, nothing is sent */
  const of = $('[data-oform]');
  if (of) {
    const out = $('[data-oform-out]');
    const submit = (e) => { e && e.preventDefault(); const bad = $$('[required]', of).find((i) => !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value))); if (bad) { out.textContent = of.dataset.err; bad.focus(); return; } out.textContent = of.dataset.msg; };
    of.addEventListener('submit', submit); $('[data-submit]', of).addEventListener('click', submit);
  }
})();
