/* -------------------------
   Main JS — optimized
   ------------------------- */
let prompts = [];
let editIndex = null;
const PROMPTS_KEY = "prompts_v1";
const THEME_KEY = "ui_theme_v1";

/* Initialize app */
document.addEventListener("DOMContentLoaded", init);

async function init(){
  bindUI();
  await loadData();
  applyStoredTheme();
}

/* BIND UI EVENTS */
function bindUI(){
  document.getElementById("openAdd")?.addEventListener("click", openAddForm);
  document.getElementById("fabAdd")?.addEventListener("click", openAddForm);
  document.getElementById("cancelNew")?.addEventListener("click", closeAddForm);
  document.getElementById("saveNew")?.addEventListener("click", saveNewPrompt);
  document.getElementById("saveEditBtn")?.addEventListener("click", saveEdit);
  document.getElementById("cancelEdit")?.addEventListener("click", closeEditForm);
  document.getElementById("searchInput")?.addEventListener("input", debounce(searchPrompt, 180));
  document.getElementById("tagFilter")?.addEventListener("change", handleTagChange);
  document.getElementById("scrollToGallery")?.addEventListener("click", ()=>document.getElementById("promptList").scrollIntoView({behavior:"smooth"}));
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
  // form submit (if present)
  const form = document.getElementById("promptForm");
  if(form) form.addEventListener("submit", e => { e.preventDefault(); saveNewPrompt(); });
}

/* Load prompts.json + localStorage merges */
async function loadData(){
  try{
    const res = await fetch("prompts.json");
    const jsonData = await res.ok ? await res.json() : [];
    const local = JSON.parse(localStorage.getItem(PROMPTS_KEY)) || [];

    // Merge: keep json prompts first, then local additions/edits override by title if duplicate
    const map = new Map();
    jsonData.forEach(p => map.set(p.title || generateId(), p));
    local.forEach(p => map.set(p.title || generateId(), p)); // local overrides

    prompts = Array.from(map.values());
  } catch (err) {
    console.warn("Could not load prompts.json — using localStorage only.", err);
    prompts = JSON.parse(localStorage.getItem(PROMPTS_KEY)) || [];
  }

  refreshUI();
}

/* Save whole prompts to localStorage */
function savePrompts(){
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

/* DISPLAY */
function refreshUI(){
  loadTags();
  displayPrompts(prompts);
}

function displayPrompts(list = prompts){
  const container = document.getElementById("promptList");
  container.innerHTML = "";
  list.forEach((p, idx) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.index = idx;

    // safe fallback for image
    const imgSrc = p.image || "images/placeholder.png";

    card.innerHTML = `
      <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.title||'prompt')}">
      <h3>${escapeHtml(p.title || "Untitled")}</h3>
      <p class="promptText">${escapeHtml(p.prompt || "")}</p>
      <div class="tags">${(p.tags||[]).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
      <div class="card-actions">
        <div>
          <button class="copy-btn" data-action="copy">📋 Copy</button>
        </div>
        <div>
          <button class="edit-btn" data-action="edit">✏ Edit</button>
          <button class="delete-btn" data-action="delete">🗑 Delete</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // attach listeners via delegation
  container.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", cardClickHandler);
  });
}

/* Card action handler (delegation) */
function cardClickHandler(ev){
  const card = ev.currentTarget;
  const idx = Number(card.dataset.index);
  const action = ev.target.dataset.action;

  if(!action) return;

  if(action === "copy"){
    const text = prompts[idx].prompt || "";
    copyToClipboard(text, ev.target);
  } else if(action === "delete"){
    if(confirm("Delete this prompt?")) {
      prompts.splice(idx,1);
      savePrompts();
      refreshUI();
    }
  } else if(action === "edit"){
    openEditForm(idx);
  }
}

/* COPY */
function copyToClipboard(text, btnElement){
  navigator.clipboard.writeText(text).then(()=>{
    btnElement.classList.add("copied");
    btnElement.textContent = "✔ Copied!";
    setTimeout(()=>{
      btnElement.classList.remove("copied");
      btnElement.textContent = "📋 Copy";
    }, 1200);
  }).catch(()=>alert("Copy failed — browser blocked clipboard."));
}

/* TAGS */
function loadTags(){
  const dropdown = document.getElementById("tagFilter");
  if(!dropdown) return;
  // clear except 'all'
  dropdown.innerHTML = `<option value="all">All</option>`;
  const set = new Set();
  prompts.forEach(p => (p.tags||[]).forEach(t => set.add(t)));
  Array.from(set).sort().forEach(tag => {
    const opt = document.createElement("option");
    opt.value = tag;
    opt.textContent = tag;
    dropdown.appendChild(opt);
  });
}

/* HANDLE TAG CHANGE */
function handleTagChange(){
  const val = document.getElementById("tagFilter").value;
  if(val === "all") displayPrompts(prompts);
  else displayPrompts(prompts.filter(p => (p.tags||[]).includes(val)));
}

/* SEARCH */
function searchPrompt(){
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  if(!q) { displayPrompts(prompts); return; }

  const filtered = prompts.filter(p => {
    const txt = `${p.title} ${p.prompt} ${(p.tags||[]).join(" ")}`.toLowerCase();
    return txt.includes(q);
  });
  displayPrompts(filtered);
  highlightQuery(q);
}

/* highlight matches in visible cards */
function highlightQuery(q){
  if(!q) return;
  document.querySelectorAll(".promptText, .card h3, .tag").forEach(el=>{
    const text = el.textContent;
    const idx = text.toLowerCase().indexOf(q);
    if(idx >= 0){
      const before = escapeHtml(text.slice(0, idx));
      const match = escapeHtml(text.slice(idx, idx + q.length));
      const after = escapeHtml(text.slice(idx + q.length));
      el.innerHTML = `${before}<mark>${match}</mark>${after}`;
    } else {
      el.innerHTML = escapeHtml(text);
    }
  });
}

/* ADD PROMPT UI */
function openAddForm(){
  document.getElementById("addPopup").style.display = "flex";
  // clear inputs
  document.getElementById("newTitle").value = "";
  document.getElementById("newPrompt").value = "";
  document.getElementById("newImage").value = "";
  document.getElementById("newTags").value = "";
}
function closeAddForm(){ document.getElementById("addPopup").style.display = "none"; }

function saveNewPrompt(){
  const title = document.getElementById("newTitle").value.trim();
  const promptText = document.getElementById("newPrompt").value.trim();
  const image = document.getElementById("newImage").value.trim();
  const tags = document.getElementById("newTags").value.split(",").map(t=>t.trim()).filter(Boolean);

  if(!title || !promptText || !image){
    alert("Please fill Title, Prompt and Image URL.");
    return;
  }

  // push and persist
  prompts.unshift({ title, prompt: promptText, image, tags });
  savePrompts();
  refreshUI();
  closeAddForm();
}

/* EDIT PROMPT UI */
function openEditForm(index){
  editIndex = index;
  const p = prompts[index];
  if(!p) return;
  document.getElementById("editTitle").value = p.title || "";
  document.getElementById("editText").value = p.prompt || "";
  document.getElementById("editImage").value = p.image || "";
  document.getElementById("editTags").value = (p.tags||[]).join(", ");
  document.getElementById("editPopup").style.display = "flex";
}
function closeEditForm(){ document.getElementById("editPopup").style.display = "none"; }

function saveEdit(){
  if(editIndex === null) return;
  const title = document.getElementById("editTitle").value.trim();
  const promptText = document.getElementById("editText").value.trim();
  const image = document.getElementById("editImage").value.trim();
  const tags = document.getElementById("editTags").value.split(",").map(t=>t.trim()).filter(Boolean);

  if(!title || !promptText) { alert("Title & Prompt required."); return; }

  prompts[editIndex] = { title, prompt: promptText, image, tags };
  savePrompts();
  refreshUI();
  closeEditForm();
}

/* THEME */
function toggleTheme(){
  const isDark = document.body.classList.toggle("dark");
  const btn = document.getElementById("themeToggle");
  btn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
}
function applyStoredTheme(){
  const t = localStorage.getItem(THEME_KEY) || "light";
  if(t === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    document.getElementById("themeToggle").textContent = "🌙";
  }
}

/* Utilities */
function escapeHtml(s){
  if(!s && s !== 0) return "";
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function debounce(fn, wait){
  let t;
  return function(...a){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), wait); };
}
function generateId(){ return Math.random().toString(36).slice(2,9); }]}
