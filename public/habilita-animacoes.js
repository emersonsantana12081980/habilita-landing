/* HABILITA+: camada opcional. Remova a tag script e recarregue para reverter. */
(() => {
  'use strict';
  if (window.habilitaAnimations) return;
  const CFG = {
    root: '.public-landing',
    cards: '#pacotes article[data-category]',
    reveal: '#pacotes article[data-category], .lesson-path, .feature-card',
    whatsapp: 'header button.btn-green',
    tilt: 3.5,
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const style = document.createElement('style');
  style.dataset.habilitaAnim = '';
  style.textContent = `
    @media (prefers-reduced-motion: no-preference) {
      .public-landing .hb-reveal { transition: opacity .45s ease, translate .45s ease; }
      .public-landing .hb-wait { opacity: 0; translate: 0 16px; }
      .public-landing .hb-tilt { transform: perspective(900px) rotateX(var(--hb-x,0deg)) rotateY(var(--hb-y,0deg)); }
      .public-landing .hb-pulse { position: relative; }
      .public-landing .hb-pulse::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; box-shadow: 0 0 0 5px #15803d50; animation: hb-ring .9s ease-out 2 both; }
      @keyframes hb-ring { from { opacity: .65; } to { opacity: 0; } }
    }
  `;
  document.head.append(style);
  let root, observer, timer, stopped = false;
  const records = new Map();
  const intersection = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) show(entry.target);
  }, {threshold: .12}) : null;
  function show(el) {
    el.classList.remove('hb-wait');
    intersection?.unobserve(el);
    clearTimeout(records.get(el)?.timeout);
  }
  function release(el, record) {
    show(el);
    cancelAnimationFrame(record.frame);
    el.removeEventListener('pointermove', record.move);
    el.removeEventListener('pointerleave', record.reset);
    el.removeEventListener('focusin', record.focus);
    el.classList.remove('hb-reveal','hb-wait','hb-tilt','hb-pulse');
    el.style.removeProperty('--hb-x'); el.style.removeProperty('--hb-y');
    records.delete(el);
  }
  function clear() { for (const [el,record] of records) release(el,record); }
  function scan() {
    if (!root || reduced.matches || stopped) return;
    for (const [el,record] of records) if (!root.contains(el)) release(el,record);
    for (const el of root.querySelectorAll(`${CFG.reveal}, ${CFG.whatsapp}`)) {
      if (records.has(el)) continue;
      const record = {}; records.set(el,record);
      const computed = getComputedStyle(el);
      if (el.matches(CFG.reveal) && intersection && computed.translate === 'none') {
        el.classList.add('hb-reveal');
        const box = el.getBoundingClientRect();
        if (box.top >= innerHeight * .9 && !el.contains(document.activeElement)) {
          el.classList.add('hb-wait'); intersection.observe(el);
          record.timeout = setTimeout(() => show(el), 6000);
        }
        record.focus = () => show(el); el.addEventListener('focusin',record.focus);
      }
      if (el.matches(CFG.cards) && pointer.matches && computed.transform === 'none') {
        record.reset = () => { cancelAnimationFrame(record.frame); el.classList.remove('hb-tilt'); el.style.removeProperty('--hb-x'); el.style.removeProperty('--hb-y'); };
        record.move = event => {
          if (event.pointerType !== 'mouse' || el.contains(document.activeElement)) return record.reset();
          const x = event.clientX, y = event.clientY;
          cancelAnimationFrame(record.frame);
          record.frame = requestAnimationFrame(() => {
            const box = el.getBoundingClientRect();
            if (box.width < 180 || box.width > 560) return record.reset();
            const clamp = value => Math.max(-1, Math.min(1,value));
            el.style.setProperty('--hb-x', `${-clamp((y-box.top)/box.height*2-1)*CFG.tilt}deg`);
            el.style.setProperty('--hb-y', `${clamp((x-box.left)/box.width*2-1)*CFG.tilt}deg`);
            el.classList.add('hb-tilt');
          });
        };
        el.addEventListener('pointermove',record.move,{passive:true}); el.addEventListener('pointerleave',record.reset);
      }
      if (el.matches(CFG.whatsapp)) {
        el.classList.add('hb-pulse'); record.timeout = setTimeout(() => el.classList.remove('hb-pulse'),1900);
      }
    }
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(scan,250); }
  function mount() {
    const next = document.querySelector(CFG.root);
    if (next === root) return;
    observer?.disconnect(); clearTimeout(timer); clear(); root = next;
    if (root) { observer = new MutationObserver(schedule); observer.observe(root,{childList:true,subtree:true}); scan(); }
  }
  function preferences() { clear(); scan(); }
  const lifecycle = new MutationObserver(mount);
  lifecycle.observe(document.body,{childList:true,subtree:true});
  reduced.addEventListener('change',preferences); pointer.addEventListener('change',preferences);
  window.habilitaAnimations = { destroy() { stopped=true; lifecycle.disconnect(); observer?.disconnect(); intersection?.disconnect(); clearTimeout(timer); clear(); reduced.removeEventListener('change',preferences); pointer.removeEventListener('change',preferences); style.remove(); delete window.habilitaAnimations; } };
  mount();
})();
