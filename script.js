/* script.js - Cinematic Virtual Escape Room (vanilla JS)
   Put index.html, style.css, script.js into the same folder and open index.html
   or upload the folder to Netlify Drop for hosting.
*/

/* ---------- Utility & State ---------- */
const STATE_KEY = 've_room_state_v1';
const DEFAULT_TIME = 20 * 60; // 20 minutes

let state = {
  room: 'lobby',
  inventory: [],
  puzzles: {
    keypadOpened: false,
    cipherSolved: false,
    jigsawDone: false,
    patternDone: false,
    audioDone: false,
    timedDone: false,
    riddleDone: false,
    tileDone: false,
    mazeDone: false
  },
  timeRemaining: DEFAULT_TIME,
  hintsUsed: 0,
  musicPlaying: false
};

const stage = document.getElementById('stage');
const roomTitle = document.getElementById('roomTitle');
const roomSubtitle = document.getElementById('roomSubtitle');
const leftPanel = document.getElementById('leftPanel');
const centerPanel = document.getElementById('centerPanel');
const rightPanel = document.getElementById('rightPanel');
const inventoryList = document.getElementById('inventoryList');
const statusList = document.getElementById('statusList');
const timerEl = document.getElementById('timer');
const ambient = document.getElementById('ambient');

/* Room background mapping (Unsplash Source used for demo; replace with local files for production) */
const BACKS = {
  lobby: 'https://source.unsplash.com/1600x900/?foyer,cozy,portrait',
  study: 'https://source.unsplash.com/1600x900/?study,library,desk',
  vault: 'https://source.unsplash.com/1600x900/?vault,bank,safe',
  final: 'https://source.unsplash.com/1600x900/?treasure,chest,celebration'
};

function saveState() { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
function loadState() {
  const s = localStorage.getItem(STATE_KEY);
  if (!s) return;
  try {
    const obj = JSON.parse(s);
    state = Object.assign(state, obj);
  } catch (e) { console.warn('Failed to parse save', e); }
}
function exportSave() {
  const blob = new Blob([JSON.stringify(state)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = 'escape-save.json'; a.click();
  URL.revokeObjectURL(url);
}
function importSaveFile(file) {
  const r = new FileReader();
  r.onload = e => {
    try {
      const obj = JSON.parse(e.target.result);
      state = Object.assign(state, obj);
      applyState();
      alert('Save imported.');
    } catch (err) { alert('Invalid save file.'); }
  };
  r.readAsText(file);
}

/* ---------- Audio: WebAudio SFX & ambient control ---------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(f=880, length=0.12, type='sine', when=0) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.value = 0.0001;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(audioCtx.currentTime + when);
  g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + when + length);
  o.stop(audioCtx.currentTime + when + length + 0.02);
}

function successSfx() { beep(880, 0.12); beep(1320, 0.11, 'sine', 0.12); }
function failSfx() { beep(220, 0.18, 'sawtooth'); }
function clickSfx() { beep(1200, 0.06, 'square'); }

/* ---------- Timer ---------- */
let timerInterval = null;
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(()=> {
    if (state.timeRemaining > 0) { state.timeRemaining -= 1; updateTimer(); saveState(); }
    else { clearInterval(timerInterval); alert('Time is up — your progress is saved.'); }
  }, 1000);
}
function updateTimer() {
  const m = Math.floor(state.timeRemaining / 60).toString().padStart(2,'0');
  const s = (state.timeRemaining % 60).toString().padStart(2,'0');
  timerEl.textContent = `${m}:${s}`;
}

/* ---------- Room rendering & navigation ---------- */
function setRoom(r) {
  state.room = r;
  document.body.style.backgroundImage = `url('${BACKS[r]}')`;
  renderRoom();
  saveState();
}

function applyState() {
  // apply visuals and panels depending on state
  setRoom(state.room);
  renderInventory();
  renderStatus();
  updateTimer();
  if (state.musicPlaying) try { ambient.play(); } catch(e){}
  else ambient.pause();
}

function renderRoom() {
  const r = state.room;
  roomTitle.textContent = r.charAt(0).toUpperCase() + r.slice(1);
  // subtitle and content per room
  leftPanel.innerHTML = '';
  centerPanel.innerHTML = '';
  rightPanel.querySelectorAll('.card').forEach(c=>c.remove());
  // Left panel: puzzles/inspectables
  if (r === 'lobby') {
    roomSubtitle.textContent = 'A warm foyer — search the cabinet and portrait.';
    // keypad
    leftPanel.appendChild(createKeypadCard());
    // portrait inspect button
    const inspectCard = el('div', 'card', {innerHTML:
      `<div class="card-title">Framed Portrait</div><div>A small note is taped behind the portrait.</div>
       <div style="margin-top:8px;"><button id="inspectPortrait" class="btn">Inspect Portrait</button></div>`});
    leftPanel.appendChild(inspectCard);
    document.getElementById('inspectPortrait').addEventListener('click', ()=> {
      if (!hasItem('Tucked Note')) {
        addItem({name:'Tucked Note', icon:'📝', type:'note', content:'A scribbled note: \"Remember 7\"'});
        alert('You found a tucked note! Check your inventory.');
        successSfx();
      } else alert('Nothing more behind the portrait.');
      saveState();
      renderInventory();
    });
  } else if (r === 'study') {
    roomSubtitle.textContent = 'Books and a lamp — toggling light reveals hidden writing.';
    leftPanel.appendChild(createCaesarCard());
    // lamp toggle
    const lampCard = el('div','card', {innerHTML:
      `<div class="card-title">Desk Lamp</div><div>Toggle the lamp to reveal faint letters.</div><div style="margin-top:8px;"><button id="toggleLamp" class="btn">Toggle Lamp</button></div>`});
    leftPanel.appendChild(lampCard);
    document.getElementById('toggleLamp').addEventListener('click', ()=> {
      alert('Lamp toggled — faint letters appear, hinting at a shift cipher (shift 1).');
      clickSfx();
    });
  } else if (r === 'vault') {
    roomSubtitle.textContent = 'A secure vault and a torn photograph — assemble the pieces.';
    leftPanel.appendChild(createJigsawCard());
    centerPanel.appendChild(createAudioClueCard());
    // additional puzzles in center (pattern / timed / riddle)
    centerPanel.appendChild(createPatternLockCard());
    centerPanel.appendChild(createTimedReactionCard());
    centerPanel.appendChild(createRiddleFlowCard());
    centerPanel.appendChild(createTilePatternCard());
  } else if (r === 'final') {
    roomSubtitle.textContent = 'This is the final chest. Enter the code you discovered.';
    leftPanel.appendChild(createFinalCard());
  }
  renderInventory();
  renderStatus();
}

/* ---------- Inventory & status ---------- */
function renderInventory() {
  inventoryList.innerHTML = '';
  if (!state.inventory.length) {
    inventoryList.innerHTML = '<div class="dim">No items yet</div>';
    return;
  }
  state.inventory.forEach((it, idx) => {
    const row = document.createElement('div'); row.className = 'inv-item';
    const left = document.createElement('div'); left.textContent = `${it.icon || '•'} `;
    left.style.fontSize='18px';
    const label = document.createElement('div'); label.textContent = it.name; label.style.flex='1';
    row.appendChild(left); row.appendChild(label);
    const btn = document.createElement('button'); btn.className='btn small';
    btn.textContent = (it.type === 'note') ? 'Open' : 'Use';
    btn.addEventListener('click', ()=> {
      clickSfx();
      if (it.type === 'note') openNoteModal(it);
      else useItem(it);
    });
    row.appendChild(btn);
    inventoryList.appendChild(row);
  });
}

function renderStatus() {
  statusList.innerHTML = '';
  const st = state.puzzles;
  for (const k in st) {
    const li = document.createElement('li');
    li.textContent = `${formatPuzzleKey(k)}: ${st[k] ? '✅' : '❌'}`;
    statusList.appendChild(li);
  }
}

function formatPuzzleKey(k) {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function addItem(item) {
  if (state.inventory.find(i=>i.name === item.name)) return;
  state.inventory.push(item);
  saveState();
  renderInventory();
}
function hasItem(name) { return state.inventory.find(i=>i.name===name); }
function useItem(item) {
  // context sensitive uses
  if (item.name === 'Brass Key' && state.room === 'lobby') {
    alert('You used the brass key — a door opens to the Study!');
    state.room = 'study'; setRoom('study');
    successSfx();
  } else if (item.name === 'Vault Code') {
    const code = prompt('Enter vault code:');
    if (code === '714') { alert('Vault opened — you escaped!'); successSfx(); } else { alert('Wrong code.'); failSfx(); }
  } else {
    alert('Nothing happens.');
  }
}

/* ---------- Modal (notes, puzzle text) ---------- */
const modal = document.getElementById('modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
document.getElementById('modalClose').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);

function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function openNoteModal(note) {
  openModal(note.name, `<pre style="white-space:pre-wrap;font-family:inherit;">${note.content}</pre>`);
}

/* ---------- Puzzle builders ---------- */

function createKeypadCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Antique Keypad</div>
    <div class="code-display" id="kbdDisplay">----</div>
    <div class="keypad" id="keypad"></div>
    <div style="margin-top:8px;"><small class="dim">Hint: starts with 3.</small></div>`;
  // build keys
  const kp = wrapper.querySelector('#keypad');
  const display = wrapper.querySelector('#kbdDisplay');
  let code = '';
  ['1','2','3','4','5','6','7','8','9','←','0','OK'].forEach(k=>{
    const b = document.createElement('button'); b.textContent = k;
    b.addEventListener('click', ()=>{
      clickSfx();
      if (k === '←') code = code.slice(0,-1);
      else if (k === 'OK') {}
      else code = (code + k).slice(0,8);
      display.textContent = code || '----';
      if (code === '3142' && !state.puzzles.keypadOpened) {
        state.puzzles.keypadOpened = true;
        addItem({name:'Brass Key', icon:'🔑'});
        alert('Keypad opened! A brass key has been added to your inventory.');
        successSfx();
        saveState();
        renderStatus();
      }
    });
    kp.appendChild(b);
  });
  return wrapper;
}

function createCaesarCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Encoded Letter</div>
    <div class="dim" style="margin-top:6px;">Uifsf jt b ofyu</div>
    <input id="caesarInput" placeholder="Type decoded phrase" style="margin-top:8px;padding:8px;border-radius:6px;width:100%;">`;
  setTimeout(()=>{ // attach event
    const inp = wrapper.querySelector('#caesarInput');
    inp.addEventListener('keydown', (e)=> {
      if (e.key === 'Enter') {
        const ans = inp.value.trim().toLowerCase();
        if (ans === 'there is a next') { // decoded "There is a next" from example? We'll accept a simpler check
          if (!state.puzzles.cipherSolved) {
            state.puzzles.cipherSolved = true;
            addItem({name:'Lens', icon:'🔍'});
            alert('Correct — you found a Lens (inventory).');
            successSfx();
            saveState(); renderStatus();
          }
        } else {
          alert('That seems wrong — try again.');
          failSfx();
        }
      }
    });
  }, 0);
  return wrapper;
}

function createJigsawCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Torn Photograph</div>
    <div style="display:flex;gap:10px;margin-top:8px;">
      <div class="pieces" id="pieces"></div>
      <div class="board" id="board" style="flex:1;padding:6px;border-radius:8px;background:rgba(255,255,255,0.03)"></div>
    </div>
    <div style="margin-top:8px;"><small class="dim">Drag pieces to the board to assemble digits.</small></div>`;
  const pieces = wrapper.querySelector('#pieces');
  const board = wrapper.querySelector('#board');
  const pieceDefs = [{id:'a',label:'A',result:'7'},{id:'b',label:'B',result:'1'},{id:'c',label:'C',result:'4'}];
  pieceDefs.forEach(p=>{
    const d = document.createElement('div'); d.className='inv-item'; d.textContent = p.label;
    d.draggable = true;
    d.addEventListener('dragstart', (e)=> e.dataTransfer.setData('text/plain', p.id));
    pieces.appendChild(d);
  });
  board.addEventListener('dragover', e=> e.preventDefault());
  board.addEventListener('drop', e=>{
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const found = pieceDefs.find(x=>x.id===id);
    if (!found) return;
    if (board.querySelector(`[data-id="${id}"]`)) return; // already placed
    const placed = document.createElement('div'); placed.className='inv-item'; placed.textContent = found.result; placed.dataset.id = id;
    board.appendChild(placed);
    clickSfx();
    // if all pieces placed:
    if (board.children.length === pieceDefs.length && !state.puzzles.jigsawDone) {
      state.puzzles.jigsawDone = true;
      addItem({name:'Vault Code', icon:'💠'});
      alert('Jigsaw assembled! Vault Code item added to inventory.');
      successSfx();
      saveState();
      renderStatus();
    }
  });
  return wrapper;
}

/* Pattern lock */
function createPatternLockCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Pattern Lock</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;" id="patternGrid"></div>
    <div style="margin-top:8px;"><div id="patternDisplay" class="dim">Pattern: </div></div>`;
  const grid = wrapper.querySelector('#patternGrid');
  const display = wrapper.querySelector('#patternDisplay');
  let seq = '';
  for (let i=1;i<=9;i++){
    const b = document.createElement('button'); b.className='btn small'; b.textContent = i;
    b.addEventListener('click', ()=>{
      seq += String(i);
      display.textContent = 'Pattern: ' + seq;
      clickSfx();
      // check
      if (seq === '14789' && !state.puzzles.patternDone) {
        state.puzzles.patternDone = true; addItem({name:'Small Gear', icon:'⚙️'}); alert('Pattern matched! You get a Small Gear.'); successSfx(); saveState(); renderStatus();
      }
    });
    grid.appendChild(b);
  }
  return wrapper;
}

/* Audio clue: play a sequence using WebAudio; user types what they heard */
function createAudioClueCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Audio Clue</div><div style="margin-top:8px;">Press Play to hear a sound clue.</div>
    <div style="margin-top:8px;"><button id="playClueBtn" class="btn">Play</button></div>
    <input id="clueAnswer" placeholder="Type what you heard (single word) and press Enter" style="margin-top:8px;padding:8px;border-radius:6px;width:100%;">`;
  setTimeout(()=> {
    wrapper.querySelector('#playClueBtn').addEventListener('click', ()=>{
      // play a bell-like arpeggio
      beepSequence([880, 1320, 1760], [0,0.15,0.3]);
    });
    wrapper.querySelector('#clueAnswer').addEventListener('keydown', (e)=>{
      if (e.key === 'Enter') {
        const v = e.target.value.trim().toLowerCase();
        if (v.includes('bell') || v.includes('chime')) { if (!state.puzzles.audioDone) { state.puzzles.audioDone = true; addItem({name:'Audio Stamp', icon:'🔊'}); alert('Correct — you found an audio stamp!'); successSfx(); saveState(); renderStatus(); } }
        else { alert('That does not match. Listen carefully and try again.'); failSfx(); }
      }
    });
  }, 0);
  return wrapper;
}

/* Timed reaction */
function createTimedReactionCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Timed Reaction</div><div style="margin-top:8px;">Click "Start", wait for GO, then click the big button.</div>
    <div style="margin-top:8px;"><button id="startReact" class="btn">Start</button></div>
    <div style="margin-top:12px;"><div id="reactBox" style="height:64px;border-radius:8px;background:#222;display:flex;align-items:center;justify-content:center"><button id="reactBtn" class="btn">Click</button></div></div>`;
  setTimeout(()=>{
    const start = wrapper.querySelector('#startReact');
    const box = wrapper.querySelector('#reactBox');
    const reactBtn = wrapper.querySelector('#reactBtn');
    let stateLocal = 'idle'; // idle -> waiting -> go
    start.addEventListener('click', ()=>{
      stateLocal='waiting'; box.style.background='#444'; box.firstElementChild.textContent='Wait...';
      const t = 900 + Math.random()*1600;
      setTimeout(()=>{ stateLocal='go'; box.style.background='#1bff9b'; box.firstElementChild.textContent='GO!'; }, t);
    });
    reactBtn.addEventListener('click', ()=>{
      if (stateLocal === 'go') {
        if (!state.puzzles.timedDone) { state.puzzles.timedDone = true; addItem({name:'Quick Token', icon:'⏱️'}); alert('Nice reflex — Quick Token added.'); successSfx(); saveState(); renderStatus(); }
      } else { failSfx(); alert('Too early or not ready. Try again.'); }
    });
  },0);
  return wrapper;
}

/* Riddle flow */
function createRiddleFlowCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Riddle Path</div><div id="riddleBox" style="margin-top:8px;"></div>`;
  const box = wrapper.querySelector('#riddleBox');
  let step = 0;
  function render() {
    box.innerHTML = '';
    if (step === 0) {
      box.innerHTML = `<div>Q: I have keys but no locks. What am I?</div><div style="margin-top:8px;"><button class="btn opt">Piano</button><button class="btn opt">Map</button></div>`;
      box.querySelectorAll('.opt')[0].addEventListener('click', ()=> { step=1; clickSfx(); render(); });
      box.querySelectorAll('.opt')[1].addEventListener('click', ()=> { step=-1; clickSfx(); render(); });
    } else if (step === 1) {
      box.innerHTML = `<div>Q: What runs but never walks?</div><div style="margin-top:8px;"><button class="btn opt">Water</button><button class="btn opt">Clock</button></div>`;
      box.querySelectorAll('.opt')[0].addEventListener('click', ()=> { step=2; clickSfx(); render(); });
      box.querySelectorAll('.opt')[1].addEventListener('click', ()=> { step=-1; clickSfx(); render(); });
    } else if (step === 2) {
      box.innerHTML = `<div>Q: Which opens with the number we've seen earlier?</div><div style="margin-top:8px;"><button class="btn opt">Vault</button><button class="btn opt">Door</button></div>`;
      box.querySelectorAll('.opt')[0].addEventListener('click', ()=> { step=3; clickSfx(); render(); });
      box.querySelectorAll('.opt')[1].addEventListener('click', ()=> { step=-1; clickSfx(); render(); });
    } else if (step === 3) {
      box.innerHTML = `<div>All correct! You solved the riddle path.</div>`;
      if (!state.puzzles.riddleDone) { state.puzzles.riddleDone = true; addItem({name:'Riddle Key', icon:'🗝️'}); successSfx(); saveState(); renderStatus(); }
    } else {
      box.innerHTML = `<div class="dim">Wrong choice — try again.</div><div style="margin-top:8px;"><button class="btn" id="resetRiddle">Restart</button></div>`;
      box.querySelector('#resetRiddle').addEventListener('click', ()=> { step=0; render(); });
    }
  }
  render();
  return wrapper;
}

/* Tile pattern puzzle */
function createTilePatternCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Tile Pattern</div><div id="tileGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px;"></div>`;
  const grid = wrapper.querySelector('#tileGrid');
  let tiles = Array(9).fill(0);
  function draw() {
    grid.innerHTML = '';
    tiles.forEach((t,i)=>{
      const d = document.createElement('div'); d.style.height='44px'; d.style.borderRadius='6px'; d.style.background = t? '#63b3ed' : '#ccc';
      d.addEventListener('click', ()=>{ tiles[i]=1-tiles[i]; clickSfx(); draw(); check(); });
      grid.appendChild(d);
    });
  }
  function check() {
    if (tiles.join('') === '110110011' && !state.puzzles.tileDone) {
      state.puzzles.tileDone = true; addItem({name:'Tiled Emblem', icon:'🔷'}); successSfx(); alert('Pattern complete — Tiled Emblem added.'); saveState(); renderStatus();
    }
  }
  draw();
  return wrapper;
}

/* Mini maze (final) */
function createMiniMazeCard() {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<div class="card-title">Mini Maze</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px;" id="mazeGrid"></div>
    <div style="margin-top:8px;"><small class="dim">Click squares to move the token to the Exit.</small></div>`;
  const grid = wrapper.querySelector('#mazeGrid');
  let pos = 0;
  function draw() {
    grid.innerHTML = '';
    for (let i=0;i<9;i++){
      const d = document.createElement('div'); d.style.height='64px'; d.style.borderRadius='6px'; d.style.display='flex'; d.style.alignItems='center'; d.style.justifyContent='center'; d.style.background = pos===i ? '#9ae6b4' : '#eee';
      d.textContent = (i===8) ? 'Exit' : (pos===i ? 'You' : '');
      d.addEventListener('click', ()=>{ pos = i; clickSfx(); draw(); if (pos===8 && !state.puzzles.mazeDone) { state.puzzles.mazeDone = true; addItem({name:'Exit Ribbon', icon:'🎗️'}); successSfx(); alert('Maze solved! Exit Ribbon added.'); saveState(); renderStatus(); }});
      grid.appendChild(d);
    }
  }
  draw();
  return wrapper;
}

/* Final card */
function createFinalCard() {
  const wrapper = document.createElement('div'); wrapper.className='card';
  wrapper.innerHTML = `<div class="card-title">Final Chest</div><div>Enter the three-digit code discovered across puzzles. (Try 714)</div><input id="finalInput" placeholder="Enter code" style="margin-top:8px;padding:8px;border-radius:6px;width:100%;">`;
  setTimeout(()=> {
    wrapper.querySelector('#finalInput').addEventListener('keydown', (e)=> {
      if (e.key === 'Enter') {
        if (e.target.value.trim() === '714') { alert('The chest opens — you escaped! 🎉'); successSfx(); } else { alert('The code is incorrect. Keep solving.'); failSfx(); }
      }
    });
  },0);
  return wrapper;
}

/* ---------- Helper Beep Sequence for audio clue ---------- */
function beepSequence(freqs, offs) {
  // freqs array, offs array parallel
  freqs.forEach((f,i)=>{
    const when = offs[i] || 0;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = f;
    o.type = 'sine';
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.value = 0.0001;
    o.start(audioCtx.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + when + 0.18);
    o.stop(audioCtx.currentTime + when + 0.2);
  });
}

/* ---------- Wiring buttons & nav ---------- */
document.getElementById('lobbyBtn').addEventListener('click', ()=> setRoom('lobby'));
document.getElementById('studyBtn').addEventListener('click', ()=> setRoom('study'));
document.getElementById('vaultBtn').addEventListener('click', ()=> setRoom('vault'));
document.getElementById('finalBtn').addEventListener('click', ()=> setRoom('final'));
document.getElementById('resetBtn').addEventListener('click', ()=> { if (confirm('Reset save?')) { localStorage.removeItem(STATE_KEY); location.reload(); }});
document.getElementById('hintBtn').addEventListener('click', ()=> { state.hintsUsed += 1; saveState(); alert('Hint: combine numbers from images, notes, and puzzles.'); });
document.getElementById('musicBtn').addEventListener('click', ()=> {
  // resume audio context on user gesture if needed
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (!state.musicPlaying) {
    ambient.play().catch(()=>{}); state.musicPlaying=true; document.getElementById('musicBtn').textContent='Pause Music';
  } else {
    ambient.pause(); state.musicPlaying=false; document.getElementById('musicBtn').textContent='Play Music';
  }
  saveState();
});
document.getElementById('exportBtn').addEventListener('click', exportSave);
document.getElementById('importBtn').addEventListener('click', ()=> document.getElementById('importInput').click());
document.getElementById('importInput').addEventListener('change', (e)=> {
  const f = e.target.files[0]; if (f) importSaveFile(f);
});

/* ---------- Initialization ---------- */
function init() {
  loadState();
  // ensure audioCtx is allowed by user gesture; we will resume when user interacts
  updateTimer();
  renderRoom();
  if (state.musicPlaying) { ambient.play().catch(()=>{}); document.getElementById('musicBtn').textContent='Pause Music'; }
  startTimer();
}
init();

/* ---------- Small helper to create element quickly ---------- */
function el(tag, cls, opts) {
  const d = document.createElement(tag);
  if (cls) d.className = cls;
  if (opts) Object.keys(opts).forEach(k => d[k] = opts[k]);
  return d;
}
