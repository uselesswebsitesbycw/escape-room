// ----------------------------
// Variables and Room Data
// ----------------------------
const rooms = {
  Lobby: {
    bg: 'https://source.unsplash.com/1600x900/?lobby,mysterious',
    description: 'You wake up in a grand mysterious lobby. A door leads to the Study.',
    items: ['keycard'],
    notes: ['Welcome Note'],
    next: 'Study'
  },
  Study: {
    bg: 'https://source.unsplash.com/1600x900/?library,old,dim',
    description: 'A dimly lit study with ancient books and a locked safe.',
    puzzle: 'keypad',
    notes: ['Book Clue'],
    next: 'Vault'
  },
  Vault: {
    bg: 'https://source.unsplash.com/1600x900/?vault,metal,secret',
    description: 'A cold metallic room holds a mysterious terminal.',
    puzzle: 'cipher',
    notes: ['Terminal Note'],
    next: 'Final'
  },
  Final: {
    bg: 'https://source.unsplash.com/1600x900/?sunrise,mystery',
    description: 'You find the final door. Enter the correct code to escape.',
    puzzle: 'final'
  }
};

let currentRoom = 'Lobby';
let timeLeft = 15 * 60;
let inventory = [];
let timerInterval;

// DOM Elements
const roomEl = document.getElementById('room');
const nameEl = document.getElementById('room-name');
const timerEl = document.getElementById('timer');
const interactionEl = document.getElementById('interaction');
const inventoryEl = document.getElementById('inventory');
const musicEl = document.getElementById('bg-music');
const victorySound = document.getElementById('victory-sound');
const confettiCanvas = document.getElementById('confetti-canvas');
let confettiCtx = confettiCanvas.getContext('2d');

// ----------------------------
// Event Listeners
// ----------------------------
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  musicEl.play();
  startGame();
});

document.getElementById('restart-btn').addEventListener('click', () => location.reload());
document.getElementById('music-toggle').addEventListener('click', () => {
  if (musicEl.paused) musicEl.play(); else musicEl.pause();
});

// ----------------------------
// Game Functions
// ----------------------------
function startGame() {
  updateRoom();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateRoom() {
  const room = rooms[currentRoom];
  nameEl.textContent = currentRoom;
  roomEl.style.backgroundImage = `url(${room.bg})`;
  interactionEl.style.display = 'block';
  interactionEl.innerHTML = `<p>${room.description}</p>`;

  // Show room notes
  if (room.notes) {
    room.notes.forEach(note => {
      const noteBtn = document.createElement('button');
      noteBtn.textContent = `View Note: ${note}`;
      noteBtn.onclick = () => showNote(note);
      interactionEl.appendChild(noteBtn);
    });
  }

  // Show items
  if (room.items) {
    room.items.forEach(item => {
      const el = document.createElement('button');
      el.textContent = `Pick up ${item}`;
      el.onclick = () => addItem(item);
      interactionEl.appendChild(el);
    });
  }

  // Show puzzle
  if (room.puzzle) {
    const puzzleBtn = document.createElement('button');
    puzzleBtn.textContent = 'Solve Puzzle';
    puzzleBtn.onclick = () => openPuzzle(room.puzzle);
    interactionEl.appendChild(puzzleBtn);
  }

  // Move to next room if no puzzle
  if (room.next && !room.puzzle) {
    const moveBtn = document.createElement('button');
    moveBtn.textContent = `Go to ${room.next}`;
    moveBtn.onclick = () => moveRoom(room.next);
    interactionEl.appendChild(moveBtn);
  }
}

function moveRoom(name) {
  currentRoom = name;
  updateRoom();
}

function addItem(item) {
  if (!inventory.includes(item)) {
    inventory.push(item);
    const el = document.createElement('div');
    el.className = 'inventory-item';
    el.title = item;
    el.style.backgroundImage = `url('https://source.unsplash.com/100x100/?${item}')`;
    inventoryEl.appendChild(el);
  }
  alert(`${item} added to inventory!`);
}

function showNote(note) {
  alert(`📜 Note: ${note}\nUse it to help solve puzzles in this room.`);
}

// ----------------------------
// Puzzle Functions
// ----------------------------
function openPuzzle(type) {
  interactionEl.innerHTML = '';
  if (type === 'keypad') {
    interactionEl.innerHTML = `<p>Enter 3-digit code to unlock the safe:</p>
    <input id='code' maxlength='3'><button onclick='checkKeypad()'>Enter</button>`;
  } else if (type === 'cipher') {
    interactionEl.innerHTML = `<p>Decode message: "Wkh dqvzhu lv vxq" (shift 3)</p>
    <input id='cipher'><button onclick='checkCipher()'>Enter</button>`;
  } else if (type === 'final') {
    interactionEl.innerHTML = `<p>Final Code (combine clues from notes):</p>
    <input id='final'><button onclick='checkFinal()'>Escape!</button>`;
  }
}

function checkKeypad() {
  const val = document.getElementById('code').value;
  if (val === '123') {
    alert('Safe unlocked! Proceed to the Vault.');
    rooms.Study.puzzle = null;
    moveRoom('Vault');
  } else alert('Incorrect code.');
}

function checkCipher() {
  const val = document.getElementById('cipher').value.toLowerCase();
  if (val === 'sun') {
    alert('Terminal accepted code. Proceed to Final Room.');
    rooms.Vault.puzzle = null;
    moveRoom('Final');
  } else alert('Incorrect. Try again.');
}

function checkFinal() {
  const val = document.getElementById('final').value.toLowerCase();
  if (val === 'freedom') {
    clearInterval(timerInterval);
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
    victorySound.play();
    startConfetti();
  } else alert('Wrong code.');
}

// ----------------------------
// Timer
// ----------------------------
function updateTimer() {
  timeLeft--;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerEl.textContent = `Time: ${minutes}:${seconds.toString().padStart(2,'0')}`;
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    alert('⏰ Time’s up! You failed to escape.');
    location.reload();
  }
}

// ----------------------------
// Confetti Animation
// ----------------------------
function startConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  let pieces = [];
  for (let i=0; i<200; i++){
    pieces.push({
      x: Math.random()*confettiCanvas.width,
      y: Math.random()*confettiCanvas.height,
      r: Math.random()*6+2,
      d: Math.random()*50,
      color: `hsl(${Math.random()*360},100%,50%)`,
      tilt: Math.floor(Math.random()*10)-10
    });
  }
  let angle = 0;
  function draw() {
    confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    pieces.forEach(p=>{
      confettiCtx.beginPath();
      confettiCtx.lineWidth = p.r;
      confettiCtx.strokeStyle = p.color;
      confettiCtx.moveTo(p.x+p.tilt, p.y);
      confettiCtx.lineTo(p.x+p.tilt, p.y+p.r);
      confettiCtx.stroke();
      p.tilt += 0.1;
      p.y += Math.cos(angle+p.d)+1+p.r/2;
      if (p.y>confettiCanvas.height){
        p.x=Math.random()*confettiCanvas.width;
        p.y=-10;
      }
    });
    angle += 0.01;
    requestAnimationFrame(draw);
  }
  draw();
}
