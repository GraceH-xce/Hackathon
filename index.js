/* STORAGE: everything lives in this browser */
const KEY = 'journote.v1';
let mem = null;

const blank = () => ({ today: [], letgo: [], revisit: [], affirmations: [], skew: 0 });

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || blank(); }
  catch (e) { return mem || (mem = blank()); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { mem = db; }
}

let db = load();

/* Shiftable clock for hackathon demo */
const DAY = 86400000;
const RESURFACE_AFTER = 3;
const now = () => Date.now() + db.skew * DAY;
const uid = () => Math.random().toString(36).slice(2, 9).padEnd(7, 'x');

/* Returns a timestamp for saving (uses the date picker if set, otherwise falls back to right now) */
function selectedStamp() {
  const el = document.getElementById('start-date');
  if (el && el.value) {
    // el.value is "YYYY-MM-DD". Parse as local midnight so the date
    // shown on the sticky note matches what the user picked.
    const [y, m, d] = el.value.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  return Date.now();
}

/* DOM Elements */
const entry = document.getElementById('entry');
const wc = document.getElementById('wc') || document.getElementById('wordCount');
const keyInput = document.getElementById('key');
const navHome = document.getElementById('navHome');
const navThoughts = document.getElementById('navThoughts');
const reflectBody = document.getElementById('reflectBody');
const thoughtsBody = document.getElementById('thoughtsBody');
const returnedSlot = document.getElementById('returnedSlot');

/* NAVIGATION & WORD COUNT */
function go(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === name));
  if (navHome) navHome.classList.toggle('on', name === 'home');
  if (navThoughts) navThoughts.classList.toggle('on', name === 'thoughts');
  if (name === 'thoughts') drawThoughts();
  if (name === 'home') drawReturned();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function countWords() {
  if (wc && entry) {
    wc.textContent = entry.value.trim().split(/\s+/).filter(Boolean).length;
  }
}

/* A journal entry example */
function fillSample() {
  entry.value = "I bombed the interview. I kept rambling and I could see the guy checking the time. Everyone in my batch already has offers and I'm still refreshing my inbox at 1am like a lunatic. My mum asked how it went and I lied. I don't even know if I want this job or if I just want to stop feeling behind. And I still haven't replied to Sam from three weeks ago, which is its own separate guilt.";
  countWords();
}

/* AI CALL (Google Gemini API) */
const MODEL = 'gemini-3.5-flash';

const SORTER = `You are the sorting engine inside a journaling app called JourNote.
Someone has just written a vent. Do NOT give advice, do NOT diagnose, do NOT open with sympathy.
Your job is to SORT what they wrote, using their own words where you can, and then write one affirmation.

Return ONLY a valid JSON object matching this schema:
{"today":["..."],"letGo":["..."],"revisit":["..."],"affirmation":"...","concern":false}

Rules:
- "today": up to 3. Things inside their control that could plausibly be done today. Concrete. Start with a verb.
- "letGo": 2-3. Things genuinely outside their control: other people's opinions, the past, decisions already made by someone else, outcomes not yet decided. Name the thing itself, do not phrase it as an instruction.
- "revisit": 1-3. Real, important things that do not need solving today: big decisions, unresolved feelings, conversations that need more time.
- Every item: one line, max 12 words, second person, plain language, no therapy jargon.
- Never invent details they did not write. If they wrote very little, return fewer items rather than padding.
- "affirmation": 1-2 sentences, max 25 words, written as if THEY wrote it to themselves about this specific entry. No "you've got this", no "everything happens for a reason", no exclamation marks, no emoji.
- "concern": true only if they describe wanting to hurt themselves or end their life. Otherwise false.`;

async function askGemini(promptText, systemInstruction, asJson = true) {
  const k = (keyInput ? keyInput.value : '').trim();
  if (!k) throw new Error('Paste your Gemini API key into the Setup drawer below.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(k)}`;

  const bodyData = {
    contents: [{ role: 'user', parts: [{ text: promptText }] }]
  };

  if (systemInstruction) {
    bodyData.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  if (asJson) {
    bodyData.generationConfig = { responseMimeType: "application/json" };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err.error && err.error.message) || `Gemini returned status ${res.status}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}

function parseJSON(raw) {
  if (!raw || !raw.trim()) throw new Error('Gemini returned an empty response.');
  // Strip markdown fences if present
  let clean = raw.replace(/```json|```/g, '').trim();
  // Find the outermost { } and parse only that
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in response.');
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch (e) {
    throw new Error('Gemini response was not valid JSON: ' + e.message);
  }
}

let lastVent = '';

async function sortIt() {
  const text = entry.value.trim();
  if (text.length < 15) { entry.focus(); return; }
  lastVent = text;

  go('reflect');
  reflectBody.innerHTML = '<div class="thinking"><div class="pulse"></div>Reading what you wrote…</div>';

  try {
    const rawResult = await askGemini(text, SORTER, true);
    drawReflection(parseJSON(rawResult));
  } catch (err) {
    reflectBody.innerHTML =
      '<div class="err">Couldn\'t sort that one. ' + esc(err.message) + '</div>' +
      '<div class="row"><button class="btn btn-primary" onclick="sortIt()">Try again</button>' +
      '<button class="btn btn-ghost" onclick="go(\'home\')">Back to writing</button></div>';
    entry.value = text;
  }
}

/* SCREEN 2 — REFLECTION */
let pending = null;

function drawReflection(r) {
  pending = r;
  const list = arr => (arr || [])
    .map(t => '<li><span class="dot"></span><span class="li-text">' + esc(t) + '</span></li>')
    .join('') || '<li style="color:var(--mist-dim);font-size:14px">Nothing landed here.</li>';

  reflectBody.innerHTML =
    (r.concern ? careCard() : '') +
    '<h1 class="ask">Your journal has been sorted out.</em></h1>' +
    '<p class="sub">You decide what stays where.</p>' +

    '<div class="stagger">' +
      '<div class="bucket b-today">' +
        '<h3>🌱 What you can do today</h3>' +
        '<div class="why">Inside your control, right now.</div>' +
        '<ul>' + list(r.today) + '</ul>' +
      '</div>' +
      '<div class="bucket b-letgo">' +
        '<h3>☁️ What you can let go of</h3>' +
        '<div class="why">Not yours to carry. Naming it is enough.</div>' +
        '<ul>' + list(r.letGo) + '</ul>' +
      '</div>' +
      '<div class="bucket b-revisit">' +
        '<h3>🕰️ What you can revisit later</h3>' +
        '<div class="why">Real, but not today\'s problem. Back in ' + RESURFACE_AFTER + ' days.</div>' +
        '<ul>' + list(r.revisit) + '</ul>' +
      '</div>' +
    '</div>' +

    '<div class="note note-in">' +
      '<span class="tag">💛 Something you might need to hear</span>' +
      '<div id="affText">' + esc(r.affirmation) + '</div>' +
    '</div>' +

    '<div class="row">' +
      '<button class="btn btn-primary" onclick="keepIt()">Save affirmation</button>' +
      '<button class="btn btn-ghost" id="redoBtn" onclick="redoAff()">This doesn\'t feel right</button>' +
    '</div>';
}

function careCard() {
  return '<div class="care"><strong>Before anything else:</strong><br>' +
    'Some of what you wrote sounds heavy to be holding alone. This app can sort thoughts, ' +
    'but it cannot sit with you. Please tell someone you trust, or connect with support:<br>' +
    '<strong>Befrienders Malaysia (24/7):</strong> <a href="tel:+60376272929" class="care-link">+603-76272929</a> or visit <a href="https://www.befrienders.org.my/" target="_blank" rel="noopener noreferrer" class="care-link">befrienders.org.my</a><br></a></div>';
}

async function redoAff() {
  const redoBtn = document.getElementById('redoBtn');
  const affText = document.getElementById('affText');
  redoBtn.disabled = true;
  redoBtn.textContent = 'Trying another…';

  try {
    const prompt = `They wrote this:\n\n${lastVent}\n\nThis affirmation missed: "${pending.affirmation}"\n\nWrite a different one from another angle. Reply with the sentence only.`;
    const sys = 'You write short affirmations someone could have written to themselves. Max 25 words, specific to what they wrote, plain language, no cliches, no exclamation marks, no emoji. Reply with the sentence only.';

    const t = await askGemini(prompt, sys, false);
    pending.affirmation = t.replace(/^["']|["']$/g, '').trim();
    affText.textContent = pending.affirmation;
    const paper = affText.parentElement;
    paper.classList.remove('note-in');
    void paper.offsetWidth;
    paper.classList.add('note-in');
  } catch (e) {
    console.error(e);
  } finally {
    redoBtn.disabled = false;
    redoBtn.textContent = "This doesn't feel right";
  }
}

function keepIt() {
  const stamp = selectedStamp();
  (pending.today || []).forEach(t => db.today.push({ id: uid(), text: t, at: stamp }));
  (pending.letGo || []).forEach(t => db.letgo.push({ id: uid(), text: t, at: stamp }));
  (pending.revisit || []).forEach(t => db.revisit.push({
    id: uid(), text: t, at: stamp, back: stamp + RESURFACE_AFTER * DAY
  }));
  if (pending.affirmation) db.affirmations.unshift({ id: uid(), text: pending.affirmation, at: stamp });
  save();
  entry.value = ''; countWords();
  pending = null;
  go('thoughts');
}

/* RESURFACING */
function due() { return db.revisit.filter(i => i.back <= now()); }

function drawReturned() {
  const list = due();
  if (!list.length) { returnedSlot.innerHTML = ''; return; }
  const i = list[0];
  const days = Math.max(1, Math.round((now() - i.at) / DAY));
  returnedSlot.innerHTML =
    '<div class="returned">' +
      '<h3>🕰️ One thought came back</h3>' +
      '<p>You set this down ' + days + ' day' + (days > 1 ? 's' : '') + ' ago. ' +
      'You do not have to solve it now either.</p> ' +
      '<div class="quote">' + esc(i.text) + '</div>' +
      '<div class="row">' +
        '<button class="btn btn-primary btn-sm" onclick="resolve(\'' + i.id + '\',\'today\')">I can act on it now</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="resolve(\'' + i.id + '\',\'letgo\')">I can let it go</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="resolve(\'' + i.id + '\',\'later\')">Still not yet</button>' +
      '</div>' +
    '</div>';
}

function resolve(id, where) {
  const idx = db.revisit.findIndex(x => x.id === id);
  if (idx < 0) return;
  const item = db.revisit[idx];
  if (where === 'later') {
    item.back = now() + RESURFACE_AFTER * DAY;
  } else {
    db.revisit.splice(idx, 1);
    db[where].push({ id: item.id, text: item.text, at: now() });
  }
  save();
  drawReturned();
}

/* SCREEN 3: My Thoughts */
function drawThoughts() {
  const has = db.today.length || db.letgo.length || db.revisit.length || db.affirmations.length;
  if (!has) {
    thoughtsBody.innerHTML =
      '<div class="empty">Nothing here yet.<br>Try writing a journal entry first.</div>';
    return;
  }

  const items = (arr, kind) => arr.length
    ? arr.map(i => {
        let actionBtn = '';
        if (kind === 'today') {
          // Action button for items in "Today" (moves to completed/remove or confirms action)
          actionBtn = '<button class="mini" onclick="drop(\'today\',\'' + i.id + '\')">Act on it</button>';
        } else if (kind === 'letgo') {
          // Action button for items in "Let go"
          actionBtn = '<button class="mini" onclick="drop(\'letgo\',\'' + i.id + '\')">Let go</button>';
        } else if (kind === 'revisit') {
          // Revisit items can be moved to Today or Let go
          actionBtn = '<button class="mini" onclick="move(\'revisit\',\'today\',\'' + i.id + '\')">Act on it</button>' +
                      '<button class="mini" onclick="move(\'revisit\',\'letgo\',\'' + i.id + '\')">Let go</button>';
        }

        return '<li>' +
          '<span class="dot"></span>' +
          '<span class="li-text">' + esc(i.text) + (kind === 'revisit' ? backLabel(i) : '') + '</span>' +
          '<span class="acts">' +
            actionBtn +
            '<button class="mini" onclick="drop(\'' + kind + '\',\'' + i.id + '\')">Remove</button>' +
          '</span>' +
        '</li>';
      }).join('')
    : '<li style="color:var(--mist-dim);font-size:14px">Nothing here.</li>';

  thoughtsBody.innerHTML =
    '<div class="bucket b-today">' +
      '<h3>🌱 Today</h3><div class="why">Things I can act on.</div>' +
      '<ul>' + items(db.today, 'today') + '</ul></div>' +
    '<div class="bucket b-letgo">' +
      '<h3>☁️ Let go</h3><div class="why">Things outside my control.</div>' +
      '<ul>' + items(db.letgo, 'letgo') + '</ul></div>' +
    '<div class="bucket b-revisit">' +
      '<h3>🕰️ Revisit</h3><div class="why">Thoughts I am choosing not to carry right now.</div>' +
      '<ul>' + items(db.revisit, 'revisit') + '</ul></div>' +

    '<div class="sectlabel">💛 My saved affirmations</div>' +
    (db.affirmations.length
      ? '<div class="pile">' + db.affirmations.map(a =>
          '<div class="note" style="transform:rotate(' + tilt(a.id) + 'deg)">' +
            '<span class="tag">' + dateOf(a.at) + '</span>' + esc(a.text) +
          '</div>').join('') + '</div>'
      : '<div class="empty">No affirmations saved yet.</div>');
}

function backLabel(i) {
  const d = Math.ceil((i.back - now()) / DAY);
  return '<span class="li-when">' +
    (d > 0 ? 'comes back in ' + d + ' day' + (d > 1 ? 's' : '') : 'ready when you are') +
    '</span>';
}

function move(from, to, id) {
  const idx = db[from].findIndex(x => x.id === id);
  if (idx < 0) return;
  const item = db[from].splice(idx, 1)[0];
  delete item.back;
  db[to].push(item);
  save(); drawThoughts();
}

function drop(from, id) {
  db[from] = db[from].filter(x => x.id !== id);
  save(); drawThoughts();
}

/* SMALL HELPERS */
function esc(s) {
  return String(s == null ? '' : s).replace(/[<>&"]/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}
function tilt(id) {
  let n = 0;
  for (const ch of String(id)) n += ch.charCodeAt(0);
  return ((n % 5) - 2.2).toFixed(1);
}
function dateOf(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function skipDays(n) { db.skew += n; save(); drawReturned(); drawThoughts(); go('home'); }
function wipe() { db = blank(); save(); drawReturned(); drawThoughts(); go('home'); }
function saveKey() { try { localStorage.setItem('journote.gemini-key', keyInput.value); } catch (e) {} }

try { if (keyInput) keyInput.value = localStorage.getItem('journote.gemini-key') || ''; } catch (e) {}
drawReturned();
