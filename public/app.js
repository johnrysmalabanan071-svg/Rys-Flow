import { projects, services } from './projects.js';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
$('#year').textContent = new Date().getFullYear();
const menu = $('.menu-toggle');
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', open); $('#nav-links').classList.toggle('open', open); });
$$('#nav-links a').forEach(a => a.addEventListener('click', () => { menu.setAttribute('aria-expanded', 'false'); $('#nav-links').classList.remove('open'); }));
document.addEventListener('keydown', e => { if(e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { menu.click(); menu.focus(); } });
// Header presentation: scroll tint and one active section in the reading band.
const header = $('.header');
const sectionLinks = $$('#nav-links a[href^="#"]');
const navSections = ['about', 'experience', 'work', 'services', 'tools', 'contact']
  .map(id => document.getElementById(id)).filter(Boolean);
function markNavSection(id) {
  sectionLinks.forEach(link => {
    const active = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
const updateHeaderTint = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', updateHeaderTint, { passive: true });
window.addEventListener('pageshow', updateHeaderTint);
updateHeaderTint();

let sectionObserver, observedHeaderHeight = -1, observedViewportHeight = -1;
function observeNavSections() {
  const headerHeight = Math.ceil(header.getBoundingClientRect().height);
  const viewportHeight = window.innerHeight;
  if (headerHeight === observedHeaderHeight && viewportHeight === observedViewportHeight) return;
  observedHeaderHeight = headerHeight; observedViewportHeight = viewportHeight;
  sectionObserver?.disconnect();
  markNavSection(null);
  if (!('IntersectionObserver' in window)) return;
  const visibleSections = new Set();
  const bottomInset = Math.max(0, viewportHeight - Math.max(headerHeight + 1, viewportHeight * .45));
  const observer = new IntersectionObserver(entries => {
    if (sectionObserver !== observer) return;
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRect.height > 0) visibleSections.add(entry.target.id);
      else visibleSections.delete(entry.target.id);
    });
    // Prefer the incoming section when the previous section's trailing edge
    // remains visible above an anchor (the page reserves space for the header).
    markNavSection(navSections.filter(section => visibleSections.has(section.id)).at(-1)?.id);
  }, { rootMargin: `-${headerHeight}px 0px -${bottomInset}px 0px`, threshold: 0 });
  sectionObserver = observer;
  navSections.forEach(section => observer.observe(section));
}
observeNavSections();
window.addEventListener('resize', observeNavSections, { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(observeNavSections).observe(header);

let filter = 'All', showAll = false;
function renderProjects() {
 const visible = projects.filter(p => filter === 'All' ? showAll || p.featured : p.platform === filter);
 $('#projects').innerHTML = visible.map(p => `<article class="project"><div class="project-visual" aria-hidden="true"><div class="project-meta"><span>BUILD ${p.number}</span><span>${p.platform}</span></div><div class="mini-flow">${p.icons.map((icon,i) => `${i ? '<span></span>' : ''}<div class="mini-node">${icon}</div>`).join('')}</div><p class="visual-caption">${p.flow}</p></div><div class="project-body"><span class="project-tag">${p.category}</span><h3>${p.title}</h3><p>${p.short}</p><div class="project-outcome"><span aria-hidden="true">✓</span>${p.result}</div><button class="text-link" data-project="${p.id}" aria-label="Read case study: ${escape(p.original)}">Read the case study <span aria-hidden="true">↗</span></button></div></article>`).join('');
 $('#project-count').textContent = `${visible.length} projects shown`;
 $('#show-all').hidden = filter !== 'All' || showAll;
 $$('[data-project]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.project)));
}
$$('[data-filter]').forEach(b => b.addEventListener('click', () => { filter=b.dataset.filter; $$('[data-filter]').forEach(t => t.setAttribute('aria-pressed', t===b)); renderProjects(); }));
$('#show-all').addEventListener('click', () => { showAll=true; renderProjects(); $('#projects [data-project]').focus(); });
const caseDialog = $('#case-dialog');
function openProject(id) {
 const p = projects.find(p => p.id === id); if(!p) return;
 $('#case-content').innerHTML = `<article class="case-main"><span class="eyebrow">${p.platform.toUpperCase()} / BUILD ${p.number} / 2-MINUTE READ</span><h2 id="case-title">${p.original}</h2><p class="case-deck">${p.short}</p><div class="case-tags"><span class="badge">Self-directed build</span>${p.tools.map(t => `<span class="badge">${t}</span>`).join('')}</div><div class="case-columns"><section><h3>01 / The problem</h3><p>${p.problem}</p></section><section><h3>02 / The automated solution</h3><p>${p.solution}</p></section></div><section class="case-outcome"><h3>03 / The modeled outcome</h3><p>${p.outcome}</p><small>This is a portfolio build. No measured client results or verified time savings are claimed.</small></section><h3>Where a person stays in control</h3><p>${p.checkpoint}</p><details><summary>Explore the workflow architecture <span aria-hidden="true">+</span></summary><ol class="case-steps">${p.steps.map(s => `<li>${s}</li>`).join('')}</ol>${p.image?`<a href="/assets/${p.image}" target="_blank" rel="noopener noreferrer" aria-label="Open original workflow overview in a new tab"><img class="case-image" src="/assets/${p.image}" alt="${escape(p.original)} workflow overview" loading="lazy"></a><p class="image-note">Original portfolio overview. Use the written steps above for the readable architecture.</p>`:''}<h3>What to validate in production</h3><p>${p.measure}</p></details><button class="button" id="case-cta">Let’s build something like this <span aria-hidden="true">↗</span></button></article>`;
 caseDialog.showModal(); caseDialog.scrollTop=0;
 $('#case-cta').addEventListener('click', () => { caseDialog.close(); prefill(p.type); });
}
$$('dialog .close-button').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
$$('dialog').forEach(d => d.addEventListener('click', e => { if(e.target===d) { const r=d.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close(); } }));
// Presentation only; native accordion behavior stays intact.
const serviceVisuals = [
  [
    'Less busywork. More connected tools.',
    '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M9 6h5a4 4 0 0 1 4 4v5M6 9v9h9"/>'
  ],
  [
    'Contacts and follow-ups, in sync.',
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 21v-2a6 6 0 0 0-3-5.2"/>'
  ],
  [
    'Fewer steps. Smoother daily work.',
    '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>'
  ],
  [
    'Helpful answers, around the clock.',
    '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-3 3V11.5a10 10 0 0 1 20 0Z"/><path d="M7 10h8M7 14h5"/>'
  ],
  [
    'Faster replies. Fewer missed leads.',
    '<path d="M3 4h18l-7 8v7l-4 2v-9Z"/>'
  ],
  [
    'Your tools, finally working together.',
    '<path d="m8 5-7 7 7 7m8-14 7 7-7 7m-3-16-2 18"/>'
  ]
];

// Service cards retain the existing guided-intake prefill behavior.
$('#services-list').innerHTML = services.map(([name, description, type], i) => {
  const [subtitle, paths] = serviceVisuals[i];
  return `<article class="service-card"><div class="service-card-top"><span class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg></span><span class="service-card-number">0${i+1}</span></div><h3>${name}</h3><p>${description}</p><div class="service-card-bottom"><small>${subtitle}</small><button class="service-card-cta" data-service="${type}" aria-label="Discuss ${escape(name)}"><span aria-hidden="true">↗</span></button></div></article>`;
}).join('');
$$('[data-service]').forEach(b => b.addEventListener('click', () => prefill(b.dataset.service)));
renderProjects();

// This deliberately uses transparent local rules, not a pretend AI request.
const scenarios = {
 ready:{input:'A lean team wants lead follow-up automated within a month.',qualification:'A defined lead-response project with an active timeline.',route:'Project discovery',reply:'Thanks for the context. The next step is an audit of your intake and follow-up process.'},
 exploring:{input:'A founder is exploring automation without a defined scope.',qualification:'An exploratory inquiry that needs help defining the opportunity.',route:'Discovery / scoping',reply:'Let’s start by mapping one repetitive process and finding a practical first step.'},
 support:{input:'An existing client needs help with a running workflow.',qualification:'An existing-system request, separate from a new project.',route:'Support review',reply:'Please share the affected workflow and when the issue started so it can be investigated.'}
};
const nodes=$$('[data-node]'), run=$('#run-demo'), scenario=$('#demo-scenario'), output=$('#demo-output');
// The background and tool strip subscribe to these events independently.
// This is a local rules demo: the logos represent illustrative integrations.
const workflowTools = ['google-workspace', 'codex', 'supabase', 'slack'];
const workflowStepMs = 1100;
let running=false;
const explain = ['Capture collects the request in one structured record.','Qualify checks the request type and readiness against explicit rules.','Route sends the record to the appropriate queue.','Respond acknowledges the request and explains its next step.'];
nodes.forEach((n,i) => n.addEventListener('click', () => { if(!running) output.innerHTML=`<span class="output-label">STEP 0${i+1} / ${['CAPTURE','QUALIFY','ROUTE','RESPOND'][i]}</span><p>${explain[i]}</p>`; }));
scenario.addEventListener('change', () => { nodes.forEach(n=>n.classList.remove('done','active')); output.innerHTML='<span class="output-label">NEW SCENARIO READY</span><p>Run the workflow to see how this inquiry is handled.</p>'; run.innerHTML='<span aria-hidden="true">▶</span> Run the workflow'; });
run.addEventListener('click', async () => {
 if(running)return; running=true;run.disabled=true;scenario.disabled=true;nodes.forEach(n=>{n.disabled=true;n.classList.remove('done','active')});
 $('#demo').classList.add('workflow-running');
 run.innerHTML = '<span aria-hidden="true">↻</span> Workflow running…';
 document.dispatchEvent(new CustomEvent('portfolio:workflow-start'));
 const s=scenarios[scenario.value], messages=[s.input,s.qualification,`Destination: ${s.route}. A sample record is prepared in this browser.`,`Sample acknowledgment: “${s.reply}”`];
 for(let i=0;i<4;i++) {
   nodes[i].classList.add('active');
   document.dispatchEvent(new CustomEvent('portfolio:workflow-step', { detail: { step: i, tool: workflowTools[i] } }));
   output.innerHTML=`<span class="output-label">STEP 0${i+1} / ${['CAPTURED','QUALIFIED','ROUTED','RESPONSE PREPARED'][i]}</span><p>${messages[i]}</p>`;
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(r=>setTimeout(r,workflowStepMs));
   nodes[i].classList.remove('active'); nodes[i].classList.add('done');
 }
 $('#demo').classList.remove('workflow-running');
 document.dispatchEvent(new CustomEvent('portfolio:workflow-end'));
 running=false;run.disabled=false;scenario.disabled=false;nodes.forEach(n=>n.disabled=false);run.innerHTML='<span aria-hidden="true">↻</span> Run it again';
});

const form=$('#intake-form'), fieldsets=$$('[data-step]'), error=$('#form-error'), next=$('#form-next'), back=$('#form-back');
let step=0, sending=false, submission=null;
function allValues(){ const data={}; $$('input[name],select[name],textarea[name]',form).forEach(el=>{if(el.type==='radio'){if(el.checked)data[el.name]=el.value;}else if(el.type==='checkbox')data[el.name]=el.checked;else data[el.name]=el.value.trim();});return data; }
function showStep(n,focus=true){step=n;fieldsets.forEach((f,i)=>{f.hidden=i!==n;f.disabled=i!==n;});$$('.step-track span').forEach((s,i)=>s.classList.toggle('active',i<=n));$('#step-counter').textContent=`0${n+1} / 04`;back.hidden=n===0;next.innerHTML=n===3?'Send my project brief <span aria-hidden="true">↗</span>':'Continue <span aria-hidden="true">→</span>';error.textContent='';if(n===3){const d=allValues();$('#brief-summary').innerHTML=`<p><strong>Your brief:</strong> ${escape(d.projectType)} · ${escape(d.role)}</p><p>${escape(d.challenge)}</p><p>${escape(d.frequency)} · ${escape(d.budget)} · ${escape(d.timeline)}</p>${d.tools?`<p>Tools: ${escape(d.tools)}</p>`:''}`;} if(focus){const legend=$('legend',fieldsets[n]);legend.tabIndex=-1;legend.focus();}}
function prefill(type){if(sending)return;if($('#form-success').hidden){const radio=$$('input[name=projectType]').find(r=>r.value===type);if(radio)radio.checked=true;showStep(0,false);}document.getElementById('contact').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
back.addEventListener('click',()=>{if(!sending)showStep(Math.max(0,step-1));});
form.addEventListener('input',()=>{ if(!sending)submission=null; });
form.addEventListener('change',()=>{ if(!sending)submission=null; });
form.addEventListener('submit',async e=>{
 e.preventDefault();if(sending)return;
 const invalid=$$('input,select,textarea',fieldsets[step]).find(el=>!el.checkValidity());
 if(invalid){error.textContent='Please complete the highlighted field before continuing.';invalid.reportValidity();return;}
 if(step<3){showStep(step+1);return;}
 sending=true; next.disabled=true;back.disabled=true;next.textContent='Sending your brief…';error.textContent='';
 const values=allValues();submission??={...values,submissionId:crypto.randomUUID()};fieldsets[3].disabled=true;
 try{
 const response=await fetch('/api/intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(submission),signal:AbortSignal.timeout(55000)});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.error||'Your brief could not be sent. Please try again, or use the email link.');
 if(data.ok!==true)throw new Error('We could not confirm receipt. Please try again.');
 form.hidden=true;$('#form-success').hidden=false;$('#success-message').textContent=data.emailStatus==='sent'?'Your brief is saved, and an acknowledgment has been sent to your email. I’ll review your process and follow up with a practical next step.':'Your brief is safely saved. Your acknowledgment email has not yet been confirmed. I’ll review your process and follow up with a practical next step.';$('#success-reference').textContent=`Your reference: ${data.reference}`;$('#form-success').focus();
 }catch(err){error.textContent=err.name==='TimeoutError'?'The connection timed out. Your brief may have reached us; retrying this unchanged brief uses the same reference to avoid a duplicate.':err.message;fieldsets[3].disabled=false;next.disabled=false;back.disabled=false;next.innerHTML='Try sending again <span aria-hidden="true">↗</span>';}
 finally{sending=false;}
});
for(const id of ['privacy-open','footer-privacy'])$('#'+id).addEventListener('click',()=>$('#privacy-dialog').showModal());
