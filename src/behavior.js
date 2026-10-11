/** Progressive enhancement for the cinematic portfolio.
 * React injects this markup into a stable root; all controls work without GSAP/Lenis.
 * GSAP and Lenis enhance motion when available and are disabled for reduced motion.
 */
export function initPortfolio({gsap, ScrollTrigger, Lenis} = {}) {
  const root = document.querySelector('.portfolio-root');
  if (!root) return () => {};
  const cleanup = [];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-ready');
  if (reduced) document.documentElement.classList.add('no-motion');
  const enterEls = [...root.querySelectorAll('.enter')];
  const revealEls = [...root.querySelectorAll('.fade-up')].filter(el => !el.classList.contains('expertise-preview-center'));
  enterEls.forEach(el => el.style.setProperty('--delay', `${el.dataset.delay || '0'}s`));

  // Repeat the reveal on every viewport visit (scrolling both down AND back up).
  // Unlike the old unobserve() implementation, elements reset after leaving the viewport.
  if (reduced || !('IntersectionObserver' in window)) {
    [...enterEls, ...revealEls].forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, {rootMargin:'0px 0px -10% 0px', threshold:0.035});
    [...enterEls, ...revealEls].forEach(el => revealObserver.observe(el));
    cleanup.push(() => revealObserver.disconnect());
  }
  // Standalone/offline fallback: replay hero typography even without the CDN GSAP enhancement.
  if (!reduced && (!gsap || !ScrollTrigger) && 'IntersectionObserver' in window) {
    const hero = root.querySelector('.hero-v2');
    if (hero) {
      const heroObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => hero.classList.toggle('is-hero-inview', entry.isIntersecting));
      }, {threshold:.08});
      heroObserver.observe(hero);
      cleanup.push(() => heroObserver.disconnect());
    }
  }
  const progress = root.querySelector('.progress');
  const updateProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = `${Math.min(100, Math.max(0, scrollY / max * 100))}%`;
  };
  window.addEventListener('scroll', updateProgress, {passive:true});
  window.addEventListener('resize', updateProgress);
  updateProgress();
  cleanup.push(() => {window.removeEventListener('scroll', updateProgress);window.removeEventListener('resize',updateProgress);});
  const toggle = root.querySelector('.menu-toggle');
  const nav = root.querySelector('.nav-links');
  const setMenu = value => {nav.classList.toggle('is-open',value); toggle.setAttribute('aria-expanded', String(value));};
  const onToggle = () => setMenu(!nav.classList.contains('is-open'));
  toggle.addEventListener('click', onToggle);
  cleanup.push(() => toggle.removeEventListener('click', onToggle));
  nav.querySelectorAll('a').forEach(a => {
    const handler = () => setMenu(false);
    a.addEventListener('click',handler);
    cleanup.push(() => a.removeEventListener('click',handler));
  });
  const onEscape = e => {if(e.key==='Escape')setMenu(false);};
  document.addEventListener('keydown',onEscape);
  cleanup.push(() => document.removeEventListener('keydown',onEscape));
  const cursor = root.querySelector('.cursor-glow');
  if (window.matchMedia('(pointer:fine)').matches && !reduced) {
    let cx=window.innerWidth/2, cy=window.innerHeight/2, tx=cx, ty=cy, frame=0;
    const onMove = e => {tx=e.clientX;ty=e.clientY;cursor.style.opacity='1';};
    const updateCursor = () => {cx+=(tx-cx)*.13;cy+=(ty-cy)*.13;cursor.style.left=`${cx}px`;cursor.style.top=`${cy}px`;frame=requestAnimationFrame(updateCursor);};
    window.addEventListener('pointermove',onMove,{passive:true}); frame=requestAnimationFrame(updateCursor);
    cleanup.push(()=>{window.removeEventListener('pointermove',onMove);cancelAnimationFrame(frame);});
  }
  if (!reduced && window.matchMedia('(pointer:fine)').matches) {
    // Magnetic hover is decorative and never interferes with click/keyboard access.
    root.querySelectorAll('.magnet').forEach(element => {
      const handleMove = event => {
        const r = element.getBoundingClientRect();
        const dx = event.clientX - (r.left+r.width/2);
        const dy = event.clientY - (r.top+r.height/2);
        element.style.transform = `translate3d(${dx*.11}px, ${dy*.11}px, 0)`;
      };
      const reset = () => {element.style.transform='';};
      element.addEventListener('pointermove',handleMove);
      element.addEventListener('pointerleave',reset);
      cleanup.push(()=>{element.removeEventListener('pointermove',handleMove);element.removeEventListener('pointerleave',reset);element.style.transform='';});
    });
  }
  // Smooth expertise reveal: a single continuous top-down clip on the image,
  // with a lightweight highlight traveling at the reveal boundary.
  const expertiseShell = root.querySelector('.expertise-shell');
  const preview = root.querySelector('.expertise-preview-center');
  const previewSurface = preview?.querySelector('.expertise-preview-stage');
  const curtainEdge = preview?.querySelector('.expertise-curtain-edge');
  const previewSheets = [...root.querySelectorAll('.expertise-preview-sheet')];
  const rows = [...root.querySelectorAll('.skill-line[data-preview]')];
  if (expertiseShell && preview && previewSurface && rows.length) {
    const canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    let currentKey = null;
    let hoverCloseTimer = 0;
    let imageCleanupTimer = 0;
    let followRAF = 0;
    let wipeAnimation = null;
    let edgeAnimation = null;
    const current = {x:0,y:0};
    const target = {x:0,y:0};
    const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
    const motionEase = 'cubic-bezier(.35,0,.16,1)';
    const wipeDuration = 920;

    // Decode in advance so switching cards doesn't stall the reveal to decode PNGs.
    previewSheets.forEach(sheet => {
      const img = sheet.querySelector('img');
      if (!img) return;
      img.loading = 'eager';
      if (typeof img.decode === 'function') img.decode().catch(() => {});
    });
    const position = row => {
      if (!canHover) return;
      const shellRect = expertiseShell.getBoundingClientRect();
      const rect = row.getBoundingClientRect();
      const height = preview.offsetHeight || 350;
      const top = rect.top - shellRect.top + rect.height/2 - height/2;
      preview.style.top = `${clamp(top,0,Math.max(0,expertiseShell.offsetHeight-height))}px`;
    };
    const followTick = () => {
      current.x += (target.x-current.x)*0.095;
      current.y += (target.y-current.y)*0.095;
      // Move only when the value changes; mouse-follow never resets the curtain.
      if (Math.abs(current.x-target.x)>.04 || Math.abs(current.y-target.y)>.04) {
        previewSurface.style.setProperty('--follow-x',`${current.x.toFixed(2)}px`);
        previewSurface.style.setProperty('--follow-y',`${current.y.toFixed(2)}px`);
      } else if (current.x !== target.x || current.y !== target.y) {
        current.x=target.x; current.y=target.y;
        previewSurface.style.setProperty('--follow-x',`${current.x.toFixed(2)}px`);
        previewSurface.style.setProperty('--follow-y',`${current.y.toFixed(2)}px`);
      }
      followRAF = requestAnimationFrame(followTick);
    };
    if (canHover && !reduced) followRAF = requestAnimationFrame(followTick);
    const stopWipe = () => {
      if (wipeAnimation) {wipeAnimation.cancel();wipeAnimation=null;}
      if (edgeAnimation) {edgeAnimation.cancel();edgeAnimation=null;}
    };
    const show = row => {
      clearTimeout(hoverCloseTimer);
      const key = row.dataset.preview;
      position(row);
      preview.classList.add('is-visible');
      rows.forEach(item => {
        const on = item === row;
        item.classList.toggle('is-active',on);
        item.setAttribute('aria-pressed',String(on));
      });
      if (key === currentKey) return;
      currentKey = key;
      clearTimeout(imageCleanupTimer);
      stopWipe();
      previewSheets.forEach(sheet => {
        if (sheet.classList.contains('is-current')) {
          sheet.classList.remove('is-current');
          sheet.classList.add('is-behind');
        }
      });
      const next = previewSheets.find(sheet=>sheet.dataset.key===key);
      if (!next) return;
      next.classList.remove('is-behind');
      next.classList.add('is-current');
      // Web Animations API avoids forcing synchronous layout on every hover,
      // and replaces the jerky multi-step polygon with one continuous wipe.
      if (!reduced && typeof next.animate === 'function') {
        wipeAnimation = next.animate([
          {clipPath:'inset(0% 0% 100% 0%)'},
          {clipPath:'inset(0% 0% 0% 0%)'}
        ], {duration:wipeDuration,easing:motionEase,fill:'none'});
        if (curtainEdge) {
          edgeAnimation = curtainEdge.animate([
            {transform:'translate3d(0,-20px,0)',opacity:0},
            {transform:`translate3d(0,${previewSurface.clientHeight*.32}px,0)`,opacity:.67,offset:.30},
            {transform:`translate3d(0,${previewSurface.clientHeight+20}px,0)`,opacity:0}
          ], {duration:wipeDuration,easing:motionEase,fill:'none'});
        }
      }
      imageCleanupTimer = window.setTimeout(() => {
        previewSheets.forEach(sheet => {if (sheet!==next) sheet.classList.remove('is-behind');});
      },wipeDuration+45);
    };
    const hide = () => {
      currentKey=null;
      preview.classList.remove('is-visible');
      rows.forEach(row => {row.classList.remove('is-active');row.setAttribute('aria-pressed','false');});
      target.x=0;target.y=0;
      clearTimeout(imageCleanupTimer);
      imageCleanupTimer=window.setTimeout(() => {
        stopWipe();
        previewSheets.forEach(sheet => sheet.classList.remove('is-current','is-behind'));
      },380);
    };
    rows.forEach(row=>{
      row.setAttribute('role','button');
      row.setAttribute('aria-pressed','false');
      const enter=()=>show(row);
      const move=event=>{
        const r=row.getBoundingClientRect();
        target.x=clamp((event.clientX-(r.left+r.width/2))/r.width*22,-11,11);
        target.y=clamp((event.clientY-(r.top+r.height/2))/r.height*16,-8,8);
      };
      const leave=()=>{
        hoverCloseTimer=window.setTimeout(()=>{
          if (!expertiseShell.matches(':focus-within') && !expertiseShell.matches(':hover')) hide();
        },110);
      };
      const focus=()=>show(row);
      const blur=()=>{hoverCloseTimer=window.setTimeout(()=>{if(!expertiseShell.matches(':focus-within') && !expertiseShell.matches(':hover'))hide();},100);};
      const keydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show(row);}};
      const click=()=>{if (!canHover) show(row);};
      row.addEventListener('mouseenter',enter);
      row.addEventListener('mousemove',move,{passive:true});
      row.addEventListener('mouseleave',leave);
      row.addEventListener('focus',focus);
      row.addEventListener('blur',blur);
      row.addEventListener('keydown',keydown);
      row.addEventListener('click',click);
      cleanup.push(()=>{
        row.removeEventListener('mouseenter',enter);
        row.removeEventListener('mousemove',move);
        row.removeEventListener('mouseleave',leave);
        row.removeEventListener('focus',focus);
        row.removeEventListener('blur',blur);
        row.removeEventListener('keydown',keydown);
        row.removeEventListener('click',click);
      });
    });
    const shellLeave=()=>{if (!expertiseShell.matches(':focus-within')) hide();};
    const onResize=()=>{
      const active=rows.find(row=>row.dataset.preview===currentKey);
      if(active)position(active);
    };
    expertiseShell.addEventListener('mouseleave',shellLeave);
    window.addEventListener('resize',onResize);
    cleanup.push(()=>{
      expertiseShell.removeEventListener('mouseleave',shellLeave);
      window.removeEventListener('resize',onResize);
      clearTimeout(hoverCloseTimer);
      clearTimeout(imageCleanupTimer);
      stopWipe();
      if(followRAF)cancelAnimationFrame(followRAF);
    });
  }
  // Web3Forms AJAX contact: submit without page navigation or launching the user's email app.
  const contactForm = root.querySelector('form.contact-form');
  if (contactForm) {
    const status = contactForm.querySelector('.contact-form-status');
    const submit = contactForm.querySelector('button[type="submit"]');
    const label = contactForm.querySelector('.contact-submit-label');
    let isSubmitting = false;
    let activeRequest = null;
    const setStatus = (message, kind = '') => {
      status.textContent = message;
      status.dataset.state = kind;
    };
    const handleSubmit = async (event) => {
      event.preventDefault();
      if (isSubmitting || !contactForm.reportValidity()) return;
      const payload = new FormData(contactForm);
      // The checkbox is a spam honeypot, never an actual visible form field.
      if (payload.get('botcheck')) return;
      const name = String(payload.get('name') || '').trim();
      const message = String(payload.get('message') || '').trim();
      if (name.length < 2 || message.length < 10) {
        setStatus('Please enter your name and a project message of at least 10 characters.', 'error');
        return;
      }
      isSubmitting = true;
      submit.disabled = true;
      submit.setAttribute('aria-busy', 'true');
      label.textContent = 'SENDING…';
      setStatus('Sending your message securely…', 'pending');
      const controller = new AbortController();
      activeRequest = controller;
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: payload,
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok || result.success !== true) {
          throw new Error(result.message || 'Submission was not accepted.');
        }
        setStatus('Message sent successfully! I’ll get back to you soon.', 'success');
        contactForm.reset();
      } catch (error) {
        const message = error.name === 'AbortError'
          ? 'The request took too long. Please try again.'
          : (error instanceof TypeError
            ? 'Could not connect. Please check your internet and try again.'
            : 'Unable to send right now. Please try again.');
        setStatus(message, 'error');
      } finally {
        clearTimeout(timeout);
        if (activeRequest === controller) activeRequest = null;
        isSubmitting = false;
        submit.disabled = false;
        submit.removeAttribute('aria-busy');
        label.textContent = 'SEND MESSAGE';
      }
    };
    const clearError = () => {
      if (status.dataset.state === 'error') setStatus('');
    };
    contactForm.addEventListener('submit', handleSubmit);
    contactForm.addEventListener('input', clearError);
    cleanup.push(() => {
      contactForm.removeEventListener('submit', handleSubmit);
      contactForm.removeEventListener('input', clearError);
      activeRequest?.abort();
    });
  }

  // Hover lens that genuinely magnifies the DOM content under the cursor.
  // Clone only the current section, not the entire document, to limit paint work.
  if (!reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    const lens = document.createElement('div');
    lens.className = 'zoom-lens';
    lens.setAttribute('aria-hidden','true');
    const scene = document.createElement('div');
    scene.className = 'zoom-lens__scene portfolio-root';
    scene.inert = true;
    lens.appendChild(scene);
    document.body.appendChild(lens);
    const size = 166, half = size/2, zoom = 1.22;
    let section = null, duplicate = null, rafId = 0;
    let tx = -500,ty = -500,cx = -500,cy = -500;
    let visible = false;
    const selectors = '.nav,.hero,.marquee,.statement,.work-section,.expertise,.footer';
    const activate = node => {
      if (section === node) return;
      section = node;
      duplicate = node.cloneNode(true);
      duplicate.removeAttribute('id');
      duplicate.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
      duplicate.querySelectorAll('img').forEach(el=>{el.loading='eager';});
      duplicate.querySelectorAll('.fade-up,.enter').forEach(el=>el.classList.add('is-visible'));
      duplicate.querySelectorAll('input,textarea,select').forEach(el=>{
        const original=node.querySelector(`[name="${el.name}"]`);
        if(original && 'value' in original)el.value=original.value;
      });
      const box=node.getBoundingClientRect();
      duplicate.style.width = `${box.width}px`;
      duplicate.style.height = `${box.height}px`;
      duplicate.style.minWidth='0';
      duplicate.style.margin='0';
      duplicate.style.position='absolute';
      duplicate.style.left='0';duplicate.style.top='0';
      duplicate.style.maxWidth='none';
      duplicate.style.animation='none';
      scene.replaceChildren(duplicate);
    };
    const contactRegion = root.querySelector('#contact');
    const isOverContact = (event) => {
      if (event.target?.closest?.('#contact')) return true;
      if (!contactRegion) return false;
      const r = contactRegion.getBoundingClientRect();
      return event.clientX >= r.left && event.clientX <= r.right
        && event.clientY >= r.top && event.clientY <= r.bottom;
    };
    const onMove = e => {
      // No lens anywhere in contact area — keep all form fields and buttons unobstructed.
      if (isOverContact(e) || !root.contains(e.target) || e.target.closest('.zoom-lens')) {
        visible=false;lens.classList.remove('is-visible');return;
      }
      const found = e.target.closest(selectors);
      if (!found) {visible=false;lens.classList.remove('is-visible');return;}
      activate(found);
      tx=e.clientX;ty=e.clientY;
      visible=true;
      lens.classList.add('is-visible');
    };
    const hide = () => { visible=false;lens.classList.remove('is-visible'); };
    const onContactFocus = e => { if (e.target.closest?.('#contact')) hide(); };
    document.addEventListener('focusin',onContactFocus);
    cleanup.push(() => document.removeEventListener('focusin',onContactFocus));
    const tick = () => {
      if (visible && section && duplicate) {
        cx += (tx-cx)*.24;cy += (ty-cy)*.24;
        lens.style.transform = `translate3d(${(cx-half).toFixed(2)}px,${(cy-half).toFixed(2)}px,0)`;
        const rect=section.getBoundingClientRect();
        const x=(cx-rect.left), y=(cy-rect.top);
        duplicate.style.transformOrigin='0 0';
        duplicate.style.transform=`translate3d(${(half-x*zoom).toFixed(2)}px,${(half-y*zoom).toFixed(2)}px,0) scale(${zoom})`;
      } else {cx=tx;cy=ty;}
      rafId = requestAnimationFrame(tick);
    };
    document.addEventListener('pointermove',onMove,{passive:true});
    document.addEventListener('pointerleave',hide);
    window.addEventListener('blur',hide);
    window.addEventListener('scroll',hide,{passive:true});
    rafId=requestAnimationFrame(tick);
    cleanup.push(()=>{document.removeEventListener('pointermove',onMove);document.removeEventListener('pointerleave',hide);window.removeEventListener('blur',hide);window.removeEventListener('scroll',hide);cancelAnimationFrame(rafId);lens.remove();});
  }

  // Indicate the section currently on screen without breaking direct hash navigation.
  if ('IntersectionObserver' in window) {
    const links = [...root.querySelectorAll('[data-nav]')];
    const tracked = ['work','about','expertise','contact'].map(id=>root.querySelector('#'+id)).filter(Boolean);
    const spy = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        links.forEach(link=>link.classList.toggle('is-current',link.getAttribute('href')==='#'+entry.target.id));
      });
    },{rootMargin:'-22% 0px -52% 0px',threshold:0});
    tracked.forEach(node=>spy.observe(node));
    cleanup.push(()=>spy.disconnect());
  }
  let lenis;
  let raf=0;
  if (!reduced && Lenis) {
    try {
      lenis = new Lenis({duration:1.25,smoothWheel:true,wheelMultiplier:.9,touchMultiplier:1.2});
      const step = time => {lenis.raf(time); raf=requestAnimationFrame(step);};
      raf=requestAnimationFrame(step);
      cleanup.push(()=>{cancelAnimationFrame(raf);lenis.destroy();});
    } catch(err) { console.warn('Lenis unavailable; native scrolling stays enabled.',err); }
  }
  const galleryLinks = root.querySelectorAll('a[href^="#"]');
  galleryLinks.forEach(a => {
    const handle = e => {
      const hash = a.getAttribute('href');
      if (hash.length<2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      if(lenis)lenis.scrollTo(target,{offset:0,duration:1.25});
      else target.scrollIntoView({behavior:reduced?'instant':'smooth'});
    };
    a.addEventListener('click',handle);
    cleanup.push(()=>a.removeEventListener('click',handle));
  });
  let context;
  if (!reduced && gsap && ScrollTrigger) {
    try {
      gsap.registerPlugin(ScrollTrigger);
      context = gsap.context(() => {
        // Hero headline replay: every return to the hero starts a fresh text entrance.
        // Portrait/parallax continue using ScrollTrigger scrubbing independently.
        const intro = gsap.timeline({paused:true, defaults:{ease:'power3.out'}});
        intro.fromTo('.hero-word--one',{y:155,opacity:0,rotate:1.2},{y:0,opacity:1,rotate:0,duration:1.14},0)
             .fromTo('.hero-word--two',{y:155,opacity:0,rotate:-.8},{y:0,opacity:1,rotate:0,duration:1.18},0.15);
        const heroReplay = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) intro.restart();
            else intro.pause(0);
          });
        }, {threshold:.08});
        heroReplay.observe(root.querySelector('.hero'));
        cleanup.push(() => heroReplay.disconnect());
        gsap.to('.hero-img',{yPercent:14,scale:1.42,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.1}});
        gsap.to('.hero-type',{y:145,opacity:.1,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
        gsap.to('.hero-aurora',{x:-95,opacity:.6,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
        gsap.to('.orbit-a',{rotation:38,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1.1}});
        gsap.to('.portrait-v2',{y:160,scale:.94,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
        root.querySelectorAll('.project-visual img').forEach(img => {
          gsap.fromTo(img,{scale:1.08},{scale:1,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:true}});
        });
        gsap.to('.contact-art',{y:-130,rotate:-12,ease:'none',scrollTrigger:{trigger:'.contact',start:'top bottom',end:'bottom top',scrub:true}});
      },root);
      if(lenis)lenis.on('scroll',ScrollTrigger.update);
      cleanup.push(()=>{context?.revert(); if(lenis)lenis.off('scroll',ScrollTrigger.update);});
    } catch(err) {console.warn('ScrollTrigger enhancement unavailable.',err);}
  }
  return () => { cleanup.reverse().forEach(fn=>fn()); document.documentElement.classList.remove('js-ready','no-motion'); };
}
