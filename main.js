/* Helix EMR Main JavaScript */

// Navigation functionality for dashboard pages
function initNavigation() {
  // Basic SPA nav (keep design, only show needed dashboard items)
  document.querySelectorAll('.nav-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
      btn.classList.add('active');
      const page = btn.dataset.page;
      showPage(page);
    });
  });
}

function showPage(page){
  document.querySelectorAll('.page').forEach(p=>p.style.display='none');
  const el = document.getElementById(page);
  if(el) el.style.display = '';
  document.getElementById('page-title').innerText = page[0].toUpperCase() + page.slice(1);
}

// Chat functionality
function initChat() {
  const chatToggleBtn = document.getElementById('chat-toggle-btn');
  const chatPanel = document.getElementById('chat-panel');
  const closeChatBtn = document.getElementById('close-chat');
  const sendBtn = document.getElementById('send-chat');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const clearChat = document.getElementById('clear-chat');

  function toggleChat(open){
    const isOpen = chatPanel.classList.contains('open');
    if(open===undefined) open = !isOpen;
    if(open){ chatPanel.classList.add('open'); chatToggleBtn.setAttribute('aria-expanded','true'); setTimeout(()=>chatInput.focus(),180); }
    else { chatPanel.classList.remove('open'); chatToggleBtn.setAttribute('aria-expanded','false'); }
  }

  if(chatToggleBtn) chatToggleBtn.addEventListener('click', ()=> toggleChat());
  if(closeChatBtn) closeChatBtn.addEventListener('click', ()=> toggleChat(false));
  if(clearChat) clearChat.addEventListener('click', ()=> chatMessages.innerHTML = '<div class="msg bot">Hi — I am Helix Assistant. Ask me to find patients or appointments.</div>');

  function appendMessage(text, who='bot'){
    const m = document.createElement('div'); m.className = 'msg ' + (who==='bot'?'bot':'user'); m.innerText = text; chatMessages.appendChild(m); chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function botRespond(input){
    const q = input.trim().toLowerCase();
    if(!q) return "I'm here when you need me.";
    if(q.includes('appointments')) return "Today's appointments are listed on the Dashboard.";
    if(q.includes('john')) return "Opening John Doe's patient page.";
    return "Try: 'Show today's appointments' or 'Open John Doe'.";
  }

  if(sendBtn) sendBtn.addEventListener('click', ()=>{ const val = chatInput.value.trim(); if(!val) return; appendMessage(val,'user'); chatInput.value=''; setTimeout(()=> appendMessage(botRespond(val),'bot'), 300+Math.random()*300); });
  if(chatInput) chatInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendBtn.click(); } });
}

// Dashboard specific functionality
function initDashboard() {
  // quick actions
  const createVisitBtn = document.getElementById('create-visit');
  const quickNewVisitBtn = document.getElementById('quick-new-visit');

  if(createVisitBtn) createVisitBtn.addEventListener('click', ()=>{ showPage('visits'); setTimeout(()=>alert('Open new visit modal (mock) — integrate your form here.'),150); });
  if(quickNewVisitBtn) quickNewVisitBtn.addEventListener('click', ()=> document.getElementById('create-visit').click());

  // Visit filter
  const filter = document.getElementById('filter-visits');
  if(filter) filter.addEventListener('input', (e)=>{ const q = e.target.value.toLowerCase(); document.querySelectorAll('#visits-body tr').forEach(tr=> tr.style.display = tr.innerText.toLowerCase().includes(q) ? '' : 'none'); });

  // Render today's appointments from storage
  renderTodaysAppointmentsOnDashboard();
}

// Patient page functionality
function initPatientPage() {
  if (window.__patientPageInitialized) return;
  window.__patientPageInitialized = true;
  // Demo in-memory data & behaviors (same as in index patient page)
  const patientId = new URLSearchParams(location.search).get('id') || '1001';
  const patients = {
    '1001': {name:'John Doe', dob:'1986-05-02', mrn:'1001', phone:'+'},
    '1000': {name:'Jane Smith', dob:'1990-08-12', mrn:'1000', phone:'+'},
    '1002': {name:'Rahul Mehta', dob:'1978-02-04', mrn:'1002', phone:'+'},
    '1003': {name:'Priya Kapoor', dob:'1992-11-09', mrn:'1003', phone:'+'}
  };

  const store = { soaps: [], docs: [], visits: [
    {id:'V-1001', date:'2025-09-16', note:'Chest pain', provider:'Dr. A. Kumar'},
    {id:'V-1004', date:'2025-08-10', note:'Follow-up', provider:'Dr. S. Patel'}
  ]};

  function loadPatient(){
    let p = patients[patientId] || {name:'Unknown', dob:'', mrn:patientId, phone:''};
    // If unknown, try to enrich from saved appointments
    if (p.name === 'Unknown') {
      try {
        const appts = getAppointmentsStore ? getAppointmentsStore() : [];
        const found = appts.slice().reverse().find(a => a && a.mrn === patientId && a.name);
        if (found) {
          p = { name: found.name || 'Unknown', dob: '', mrn: patientId, phone: '' };
        }
      } catch(e) {}
    }
    document.getElementById('patient-name').innerText = p.name;
    document.getElementById('avatar').innerText = p.name.split(' ').map(n=>n[0]).slice(0,2).join('');
    document.getElementById('field-name').value = p.name;
    document.getElementById('field-mrn').value = p.mrn || patientId;
    document.getElementById('field-dob').value = p.dob || '';
    document.getElementById('field-phone').value = p.phone || '';
    // Update header meta (DOB • MRN) if present in template
    try {
      const nameParent = document.getElementById('patient-name')?.parentElement;
      if (nameParent) {
        const metaDiv = Array.from(nameParent.children).find(el => el !== document.getElementById('patient-name'));
        if (metaDiv) metaDiv.textContent = `DOB: ${p.dob || '-'} • MRN: ${p.mrn || patientId}`;
      }
    } catch(e) {}
    renderVisits();
    renderSavedSoaps();
    renderDocs();
  }

  function renderVisits(){
    const el = document.getElementById('visits-list');
    el.innerHTML = '';
    store.visits.forEach(v=>{
      const div = document.createElement('div');
      div.className='soap-block';
      div.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${v.date}</strong><div style="color:var(--muted)">${v.note} • ${v.provider}</div></div><div><button class="btn ghost" onclick="openVisit('${v.id}')">Open</button></div></div>`;
      el.appendChild(div);
    });
  }

  window.openVisit = function(id){ alert('Open visit ' + id + ' (demo).'); }

  // SOAP dynamic editor
  const sectionKeys = ['subjective','objective','assessment','plan'];

  function createEntryElement(section){
    const wrapper = document.createElement('div');
    wrapper.className = 'soap-entry';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '8px';
    wrapper.style.alignItems = 'flex-start';

    const textarea = document.createElement('textarea');
    textarea.rows = section==='subjective' || section==='objective' ? 3 : 2;
    textarea.placeholder = section==='subjective' ? 'Patient complaint, history...' : section==='objective' ? 'Exam findings, vitals...' : section==='assessment' ? 'Diagnosis or impression...' : 'Management and follow-up...';
    textarea.style.flex = '1';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn ghost';
    removeBtn.type = 'button';
    removeBtn.innerText = 'Remove';
    removeBtn.addEventListener('click', ()=>{
      wrapper.remove();
    });

    wrapper.appendChild(textarea);
    wrapper.appendChild(removeBtn);
    return wrapper;
  }

  function ensureAtLeastOne(section){
    const list = document.getElementById('list-' + section);
    if(list && list.children.length===0){
      list.appendChild(createEntryElement(section));
    }
  }

  // Initialize add buttons and ensure one entry exists
  sectionKeys.forEach(section=>{
    const addBtn = document.querySelector('.add-entry[data-section="'+section+'"]');
    if(addBtn){
      addBtn.addEventListener('click', ()=>{
        const list = document.getElementById('list-' + section);
        if(list){ list.appendChild(createEntryElement(section)); }
      });
    }
    ensureAtLeastOne(section);
  });

  // SOAP save/clear
  const saveSoapBtn = document.getElementById('save-soap');
  const clearSoapBtn = document.getElementById('clear-soap');

  function gatherSectionText(section){
    const list = document.getElementById('list-' + section);
    if(!list) return '';
    const parts = Array.from(list.querySelectorAll('textarea'))
      .map(t=>t.value.trim())
      .filter(Boolean);
    return parts.join('\n');
  }

  if(saveSoapBtn) saveSoapBtn.addEventListener('click', ()=>{
    const subj = gatherSectionText('subjective');
    const obj = gatherSectionText('objective');
    const assess = gatherSectionText('assessment');
    const plan = gatherSectionText('plan');
    if(!subj && !obj && !assess && !plan){ alert('Enter at least one field'); return; }
    const note = {subjective:subj, objective:obj, assessment:assess, plan:plan, date:new Date().toISOString().split('T')[0]};
    store.soaps.push(note);
    clearSoapFields();
    renderSavedSoaps();
    addTimeline('Saved SOAP note');
  });

  if(clearSoapBtn) clearSoapBtn.addEventListener('click', clearSoapFields);

  function clearSoapFields(){
    sectionKeys.forEach(section=>{
      const list = document.getElementById('list-' + section);
      if(!list) return;
      list.innerHTML = '';
      ensureAtLeastOne(section);
    });
  }

  function renderSavedSoaps(){
    const el = document.getElementById('saved-soaps');
    el.innerHTML = '';
    if(store.soaps.length===0){ el.innerHTML = '<div style="color:var(--muted)">No SOAP notes yet.</div>'; return; }
    store.soaps.slice().reverse().forEach((s,idx)=>{
      const d = document.createElement('div'); d.className='soap-block';
      d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>SOAP — ${s.date}</strong></div><div><button class="btn ghost" onclick="downloadSOAP(${idx})">Download</button></div></div>
      <div style="margin-top:8px"><strong>Subjective:</strong><div style="color:var(--muted)">${escapeHtml(s.subjective)}</div><strong>Objective:</strong><div style="color:var(--muted)">${escapeHtml(s.objective)}</div><strong>Assessment:</strong><div style="color:var(--muted)">${escapeHtml(s.assessment)}</div><strong>Plan:</strong><div style="color:var(--muted)">${escapeHtml(s.plan)}</div></div>`;
      el.appendChild(d);
    });
  }

  function escapeHtml(text){ return (text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

  // Documents
  function buildDocumentContent(id,name,soap,type){
    const title = type==='office'?'Office Note':type==='followup'?'Follow-up Note':'Therapy Note';
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body><h1>${title}</h1><h3>Patient: ${name} (MRN: ${id})</h3><p><strong>Date:</strong> ${new Date().toISOString().split('T')[0]}</p><h4>Subjective</h4><div>${escapeHtml(soap.subjective)}</div><h4>Objective</h4><div>${escapeHtml(soap.objective)}</div><h4>Assessment</h4><div>${escapeHtml(soap.assessment)}</div><h4>Plan</h4><div>${escapeHtml(soap.plan)}</div></body></html>`;
  }

  function downloadAsDoc(filename, htmlContent){
    const blob = new Blob([htmlContent], {type:'application/msword'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  window.generateNote = function(type){
    const latest = store.soaps[store.soaps.length-1] || {subjective:'', objective:'', assessment:'', plan:''};
    const content = buildDocumentContent(patientId, document.getElementById('patient-name').innerText, latest, type);
    const filename = `${patientId}_${type}_note_${new Date().toISOString().split('T')[0]}.doc`;
    downloadAsDoc(filename, content);
    store.docs.push({name:filename, content:content});
    renderDocs();
    addTimeline('Generated ' + type + ' note');
  }

  function renderDocs(){
    const el = document.getElementById('docs-list');
    el.innerHTML = '';
    if(store.docs.length===0){ el.innerHTML = '<div style="color:var(--muted)">No documents yet.</div>'; return; }
    store.docs.slice().reverse().forEach((d,idx)=>{
      const div = document.createElement('div'); div.className='doc-item';
      div.innerHTML = `<div>${d.name}</div><div style="display:flex;gap:8px"><button class="btn ghost" onclick="downloadDoc(${idx})">Download</button></div>`;
      el.appendChild(div);
    });
  }

  window.downloadDoc = function(idx){ const d = store.docs[idx]; if(!d) return; downloadAsDoc(d.name, d.content); }
  window.downloadSOAP = function(idx){ const s = store.soaps[idx]; if(!s) return; const html = buildDocumentContent(patientId, document.getElementById('patient-name').innerText, s, 'soap'); const filename = `${patientId}_soap_${s.date}.doc`; downloadAsDoc(filename, html); }

  function addTimeline(text){ const el = document.getElementById('timeline'); const item = document.createElement('div'); item.style.marginBottom='6px'; item.innerHTML = `<strong>${new Date().toLocaleString()}</strong> — ${text}`; el.prepend(item); }

  const downloadSummaryBtn = document.getElementById('download-summary');
  if(downloadSummaryBtn) downloadSummaryBtn.addEventListener('click', ()=>{
    if(store.soaps.length===0){ alert('No SOAPs to include.'); return; }
    const parts = store.soaps.map(s=>buildDocumentContent(patientId, document.getElementById('patient-name').innerText, s, 'summary'));
    const full = `<!doctype html><html><head><meta charset="utf-8"><title>Patient Summary</title></head><body><h1>Patient Summary — ${document.getElementById('patient-name').innerText}</h1>${parts.join('<hr>')}</body></html>`;
    downloadAsDoc(`${patientId}_summary_${new Date().toISOString().split('T')[0]}.doc`, full);
  });

  const downloadAllBtn = document.getElementById('download-all');
  if(downloadAllBtn) downloadAllBtn.addEventListener('click', async ()=>{
    if(store.docs.length===0){ alert('No documents to zip. Generate some first.'); return; }
    if(window.JSZip){
      const zip = new JSZip();
      store.docs.forEach(d => zip.file(d.name, d.content));
      const blob = await zip.generateAsync({type:'blob'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${patientId}_docs.zip`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
    } else {
      alert('No JSZip found — downloading individually.');
      store.docs.forEach(d => downloadAsDoc(d.name, d.content));
    }
  });

  loadPatient();
}

// Initialize based on page type
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a dashboard page (has navigation)
  if(document.querySelector('.nav-item')) {
    initNavigation();
    initDashboard();
    initChat();
    // Ensure dashboard appointments render in SPA mode
    setTimeout(()=>{ try{ renderTodaysAppointmentsOnDashboard(); }catch(e){} }, 0);
  }
  const logoutBtn = document.getElementById('logout-btn'); 
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('helix_logged_in');
      window.location.href = 'login.html';
    });
  }

  // Check if we're on a patient page
  if(document.getElementById('patient-name')) {
    initPatientPage();
  }

});

// Appointments storage helpers
function getAppointmentsStore(){
  try {
    const raw = localStorage.getItem('helix_appointments');
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}
function setAppointmentsStore(list){
  localStorage.setItem('helix_appointments', JSON.stringify(list));
}
function addAppointment(appt){
  const list = getAppointmentsStore();
  list.push(appt);
  setAppointmentsStore(list);
}

function formatLocalDate(date){
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function renderTodaysAppointmentsOnDashboard(){
  const container = document.getElementById('appointments-today');
  const countEl = document.getElementById('appt-count');
  if(!container || !countEl) return;
  const list = getAppointmentsStore();
  const todayLocal = formatLocalDate(new Date());
  const todayUtcIso = new Date().toISOString().split('T')[0];
  const todays = list
    .filter(a => a && (a.date === todayLocal || a.date === todayUtcIso))
    .sort((a,b)=> a.time.localeCompare(b.time));
  container.innerHTML = '';
  if(todays.length===0){
    // Also surface upcoming (next 2 days) to avoid confusion
    const d0 = new Date();
    const d1 = new Date(); d1.setDate(d1.getDate()+1);
    const d2 = new Date(); d2.setDate(d2.getDate()+2);
    const set = new Set([formatLocalDate(d0), formatLocalDate(d1), formatLocalDate(d2), new Date().toISOString().split('T')[0]]);
    const upcoming = list.filter(a => a && set.has(a.date)).sort((a,b)=> (a.date+b.time).localeCompare(b.date+b.time));
    if(upcoming.length===0){
      container.innerHTML = '<div style="color:var(--muted)">No appointments yet.</div>';
    } else {
      upcoming.forEach(a=>{
        const link = a.mrn ? `patient-spa.html?id=${a.mrn}` : '#';
        const item = document.createElement('div');
        item.className = 'appt';
        item.innerHTML = `<div><strong>${a.time}</strong> — <a href="${link}" style="color:inherit;text-decoration:none">${a.name}</a></div><div style=\"color:var(--muted)\">${a.provider||''} • ${a.date}</div>`;
        container.appendChild(item);
      });
    }
  } else {
    todays.forEach(a=>{
      const link = a.mrn ? `patient-spa.html?id=${a.mrn}` : '#';
      const item = document.createElement('div');
      item.className = 'appt';
      item.innerHTML = `<div><strong>${a.time}</strong> — <a href="${link}" style="color:inherit;text-decoration:none">${a.name}</a></div><div style=\"color:var(--muted)\">${a.provider||''}</div>`;
      container.appendChild(item);
    });
  }
  countEl.textContent = `${todays.length} slot${todays.length===1?'':'s'}`;
}

// Appointments page logic
function initAppointmentsPage(){
  const grid = document.getElementById('appt-grid');
  const tabs = document.querySelectorAll('.appt-day-tab');
  const modal = document.getElementById('appt-modal');
  const closeBtn = document.getElementById('close-appt-modal');
  const cancelBtn = document.getElementById('cancel-appt');
  const saveBtn = document.getElementById('save-appt');
  const whenEl = document.getElementById('appt-when');
  let selectedSlot = null;

  function dayLabel(offset){ return offset===0?'Today':offset===1?'Tomorrow':'Day After'; }
  function dateForOffset(offset){ const d = new Date(); d.setDate(d.getDate()+offset); return d; }
  function formatDate(d){ return formatLocalDate(d); }

  function buildSlots(offset){
    if(!grid) return;
    grid.innerHTML='';
    const base = dateForOffset(offset);
    const slots = [];
    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 9, 0, 0, 0);
    for(let i=0;i<8;i++){ // 9:00 to 13:00 half-hour slots → 8 slots
      const d = new Date(start.getTime() + i*30*60000);
      const hh = d.getHours().toString().padStart(2,'0');
      const mm = d.getMinutes().toString().padStart(2,'0');
      const ampm = d.getHours()>=12?'PM':'AM';
      const hr12 = ((d.getHours()+11)%12+1);
      const label = `${hr12}:${mm} ${ampm}`;
      slots.push({ date: formatDate(base), time: `${hh}:${mm}`, label });
    }
    const existing = getAppointmentsStore();
    slots.forEach(s=>{
      const existingAppt = existing.find(a => a.date===s.date && a.time===s.time);
      const taken = !!existingAppt;
      const btn = document.createElement('button');
      btn.className = 'btn ghost' + (taken ? ' slot-booked' : '');
      btn.style.display='flex'; btn.style.justifyContent='space-between'; btn.style.alignItems='center';
      btn.style.gap='8px'; btn.style.padding='10px';
      btn.innerHTML = `<span>${s.label}</span>${taken?`<span title=\"${existingAppt.name}\">${existingAppt.name}</span>`:'<span title=\"Add\" style=\"font-weight:700\">+</span>'}`;
      btn.disabled = false; // allow clicking to view/overwrite
      btn.addEventListener('click', ()=>{
        selectedSlot = s;
        openModal(s);
      });
      grid.appendChild(btn);
    });
  }

  function openModal(slot){
    if(!modal) return;
    modal.style.display='flex';
    if(whenEl) whenEl.textContent = `${slot.label} — ${slot.date}`;
    // Pre-fill if existing
    const existing = getAppointmentsStore().find(a=>a.date===slot.date && a.time===slot.time);
    document.getElementById('appt-name').value = existing?.name || '';
    document.getElementById('appt-mrn').value = existing?.mrn || '';
    document.getElementById('appt-provider').value = existing?.provider || 'Dr. A. Kumar';
    document.getElementById('appt-reason').value = existing?.reason || '';
  }
  function closeModal(){ if(modal) modal.style.display='none'; }

  tabs.forEach((t,idx)=>{
    t.addEventListener('click', ()=>{
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      tabs.forEach(x=>x.setAttribute('aria-pressed','false'));
      t.setAttribute('aria-pressed','true');
      buildSlots(parseInt(t.dataset.offset||'0',10));
    });
    if(idx===0){ t.classList.add('active'); t.setAttribute('aria-pressed','true'); }
  });
  buildSlots(0);

  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if(saveBtn) saveBtn.addEventListener('click', ()=>{
    if(!selectedSlot) return;
    const name = document.getElementById('appt-name').value.trim();
    const mrn = document.getElementById('appt-mrn').value.trim();
    const provider = document.getElementById('appt-provider').value.trim();
    const reason = document.getElementById('appt-reason').value.trim();
    if(!name){ alert('Enter patient name'); return; }
    // upsert
    const list = getAppointmentsStore();
    const idx = list.findIndex(a=>a.date===selectedSlot.date && a.time===selectedSlot.time);
    const appt = { date:selectedSlot.date, time:selectedSlot.time, name, mrn, provider, reason };
    if(idx>=0) list[idx]=appt; else list.push(appt);
    setAppointmentsStore(list);
    closeModal();
    buildSlots(tabs && document.querySelector('.appt-day-tab.active') ? parseInt(document.querySelector('.appt-day-tab.active').dataset.offset||'0',10) : 0);
    renderTodaysAppointmentsOnDashboard();
  });
}