document.addEventListener('DOMContentLoaded',()=>{

// -------------------
// DOM Elements
// -------------------
const startBtn=document.getElementById('start-btn');
const restartBtn=document.getElementById('restart-btn');
const musicToggle=document.getElementById('music-toggle');
const gameContainer=document.getElementById('game-container');
const startScreen=document.getElementById('start-screen');
const victoryScreen=document.getElementById('victory-screen');
const roomEl=document.getElementById('room');
const nameEl=document.getElementById('room-name');
const timerEl=document.getElementById('timer');
const inventoryEl=document.getElementById('inventory');
const interactionEl=document.getElementById('interaction');
const musicEl=document.getElementById('bg-music');
const victorySound=document.getElementById('victory-sound');
const confettiCanvas=document.getElementById('confetti-canvas');
const confettiCtx=confettiCanvas.getContext('2d');

// -------------------
// Game Data
// -------------------
const rooms={
Lobby:{bg:'https://source.unsplash.com/1600x900/?lobby',desc:'You are in the lobby. A door leads to the Study.',items:['keycard'],next:'Study'},
Study:{bg:'https://source.unsplash.com/1600x900/?library',desc:'A dim study. Solve the keypad puzzle to unlock the Final Room.',items:['magnifying glass'],puzzle:'keypad',next:'Final'},
Final:{bg:'https://source.unsplash.com/1600x900/?sunrise',desc:'Enter the secret code to escape!',puzzle:'final'}
};

let currentRoom='Lobby';
let inventory=[];
let timeLeft=15*60;
let timerInterval;

// -------------------
// Event Listeners
// -------------------
startBtn.addEventListener('click',()=>{
startScreen.classList.add('hidden');
gameContainer.classList.remove('hidden');
musicEl.play();
startGame();
});

restartBtn.addEventListener('click',()=>location.reload());
musicToggle.addEventListener('click',()=>{if(musicEl.paused)musicEl.play();else musicEl.pause();});

// -------------------
// Game Functions
// -------------------
function startGame(){updateRoom(); timerInterval=setInterval(updateTimer,1000);}
function updateRoom(){
  const room=rooms[currentRoom];
  nameEl.textContent=currentRoom;
  roomEl.style.backgroundImage=`url(${room.bg})`;
  interactionEl.style.display='block';
  interactionEl.innerHTML=`<p>${room.desc}</p>`;

  if(room.items){
    room.items.forEach(item=>{
      const btn=document.createElement('button');
      btn.textContent=`Pick up ${item}`;
      btn.onclick=()=>addItem(item);
      interactionEl.appendChild(btn);
    });
  }

  if(room.puzzle){
    const btn=document.createElement('button');
    btn.textContent='Solve Puzzle';
    btn.onclick=()=>openPuzzle(room.puzzle);
    interactionEl.appendChild(btn);
  }

  if(room.next && !room.puzzle){
    const btn=document.createElement('button');
    btn.textContent=`Go to ${room.next}`;
    btn.onclick=()=>moveRoom(room.next);
    interactionEl.appendChild(btn);
  }
}

function moveRoom(name){currentRoom=name; updateRoom();}
function addItem(item){if(!inventory.includes(item)){inventory.push(item); const el=document.createElement('div'); el.className='inventory-item'; el.title=item; el.style.backgroundImage=`url('https://source.unsplash.com/100x100/?${item}')`; inventoryEl.appendChild(el);} alert(`${item} added!`);}

// -------------------
// Puzzles
// -------------------
function openPuzzle(type){
  interactionEl.innerHTML='';
  if(type==='keypad')interactionEl.innerHTML=`<p>Enter 3-digit code:</p><input id='code' maxlength='3'><button id='keypad-btn'>Enter</button>`;
  else if(type==='final')interactionEl.innerHTML=`<p>Enter final code:</p><input id='final'><button id='final-btn'>Escape!</button>`;

  if(type==='keypad')document.getElementById('keypad-btn').addEventListener('click',checkKeypad);
  if(type==='final')document.getElementById('final-btn').addEventListener('click',checkFinal);
}

function checkKeypad(){
  const val=document.getElementById('code').value;
  if(val==='123'){rooms.Study.puzzle=null; moveRoom('Final'); alert('Keypad solved!');}
  else alert('Incorrect code');
}

function checkFinal(){
  const val=document.getElementById('final').value.toLowerCase();
  if(val==='freedom'){clearInterval(timerInterval); gameContainer.classList.add('hidden'); victoryScreen.classList.remove('hidden'); victorySound.play(); startConfetti();}
  else alert('Wrong code');
}

// -------------------
// Timer
// -------------------
function updateTimer(){
  timeLeft--;
  const m=Math.floor(timeLeft/60);
  const s=timeLeft%60;
  timerEl.textContent=`Time: ${m}:${s.toString().padStart(2,'0')}`;
  if(timeLeft<=0){clearInterval(timerInterval);alert('⏰ Time’s up!');location.reload();}
}

// -------------------
// Confetti
// -------------------
function startConfetti(){
  confettiCanvas.width=window.innerWidth;
  confettiCanvas.height=window.innerHeight;
  let pieces=[];
  for(let i=0;i<200;i++){pieces.push({x:Math.random()*confettiCanvas.width,y:Math.random()*confettiCanvas.height,r:Math.random()*6+2,d:Math.random()*50,color:`hsl(${Math.random()*360},100%,50%)`,tilt:Math.floor(Math.random()*10)-10});}
  let angle=0;
  function draw(){confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    pieces.forEach(p=>{confettiCtx.beginPath(); confettiCtx.lineWidth=p.r; confettiCtx.strokeStyle=p.color; confettiCtx.moveTo(p.x+p.tilt,p.y); confettiCtx.lineTo(p.x+p.tilt,p.y+p.r); confettiCtx.stroke(); p.tilt+=0.1; p.y+=Math.cos(angle+p.d)+1+p.r/2; if(p.y>confettiCanvas.height){p.x=Math.random()*confettiCanvas.width;p.y=-10;}});
    angle+=0.01; requestAnimationFrame(draw);}
  draw();
}

}); // DOMContentLoaded
