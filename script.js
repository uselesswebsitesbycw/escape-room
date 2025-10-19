// Full interactive cinematic escape room script
// Includes rooms, inventory, clickable objects, notes, multiple puzzles, timer, music, confetti

// ----------------------------
// Variables
// ----------------------------
const rooms = {
  Lobby:{
    bg:'https://source.unsplash.com/1600x900/?lobby,mysterious',
    description:'You wake up in a mysterious lobby. A grand door leads to the Study.',
    items:['keycard'],
    objects:['desk','painting'],
    notes:['Welcome Note'],
    next:'Study'
  },
  Study:{
    bg:'https://source.unsplash.com/1600x900/?library,old,dim',
    description:'A dim study filled with old books and a locked safe.',
    items:['magnifying glass'],
    objects:['bookshelf','desk'],
    puzzle:'keypad',
    notes:['Book Clue'],
    next:'Vault'
  },
  Vault:{
    bg:'https://source.unsplash.com/1600x900/?vault,metal,secret',
    description:'A cold metallic room holds a mysterious terminal.',
    items:['terminal manual'],
    objects:['terminal','drawer'],
    puzzle:'cipher',
    notes:['Terminal Note'],
    next:'Final'
  },
  Final:{
    bg:'https://source.unsplash.com/1600x900/?sunrise,mystery',
    description:'You find the final door. Enter the code to escape.',
    puzzle:'final'
  }
};

let currentRoom='Lobby';
let inventory=[];
let timeLeft=15*60;
let timerInterval;
const roomEl=document.getElementById('room');
const nameEl=document.getElementById('room-name');
const timerEl=document.getElementById('timer');
const inventoryEl=document.getElementById('inventory');
const interactionEl=document.getElementById('interaction');
const musicEl=document.getElementById('bg-music');
const victorySound=document.getElementById('victory-sound');
const confettiCanvas=document.getElementById('confetti-canvas');
let confettiCtx=confettiCanvas.getContext('2d');

// ----------------------------
// Event Listeners
// ----------------------------
document.getElementById('start-btn').addEventListener('click',()=>{
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  musicEl.play();
  startGame();
});
document.getElementById('restart-btn').addEventListener('click',()=>location.reload());
document.getElementById('music-toggle').addEventListener('click',()=>{if(musicEl.paused)musicEl.play();else musicEl.pause();});

// ----------------------------
// Game Functions
// ----------------------------
function startGame(){
  updateRoom();
  timerInterval=setInterval(updateTimer,1000);
}

function updateRoom(){
  const room=rooms[currentRoom];
  nameEl.textContent=currentRoom;
  roomEl.style.backgroundImage=`url(${room.bg})`;
  interactionEl.style.display='block';
  interactionEl.innerHTML=`<p>${room.description}</p>`;

  // Items
  if(room.items){
    room.items.forEach(item=>{
      const btn=document.createElement('button');
      btn.textContent=`Pick up ${item}`;
      btn.onclick=()=>addItem(item);
      interactionEl.appendChild(btn);
    });
  }

  // Objects
  if(room.objects){
    room.objects.forEach(obj=>{
      const btn=document.createElement('button');
      btn.textContent=`Examine ${obj}`;
      btn.onclick=()=>examineObject(obj);
      interactionEl.appendChild(btn);
    });
  }

  // Notes
  if(room.notes){
    room.notes.forEach(note=>{
      const btn=document.createElement('button');
      btn.textContent=`Read Note: ${note}`;
      btn.onclick=()=>readNote(note);
      interactionEl.appendChild(btn);
    });
  }

  // Puzzles
  if(room.puzzle){
    const btn=document.createElement('button');
    btn.textContent='Solve Puzzle';
    btn.onclick=()=>openPuzzle(room.puzzle);
    interactionEl.appendChild(btn);
  }

  // Move to next room
  if(room.next && !room.puzzle){
    const btn=document.createElement('button');
    btn.textContent=`Go to ${room.next}`;
    btn.onclick=()=>moveRoom(room.next);
    interactionEl.appendChild(btn);
  }
}

function moveRoom(name){
  currentRoom=name;
  updateRoom();
}

function addItem(item){
  if(!inventory.includes(item)){
    inventory.push(item);
    const el=document.createElement('div');
    el.className='inventory-item';
    el.title=item;
    el.style.backgroundImage=`url('https://source.unsplash.com/100x100/?${item}')`;
    inventoryEl.appendChild(el);
  }
  alert(`${item} added to inventory!`);
}

function examineObject(obj){
  alert(`You examine the ${obj} carefully. It might contain a clue!`);
}

function readNote(note){
  alert(`📜 Note: ${note}`);
}

// ----------------------------
// Puzzles
// ----------------------------
function openPuzzle(type){
  interactionEl.innerHTML='';
  if(type==='keypad'){
    interactionEl.innerHTML=`<p>Enter 3-digit code:</p>
    <input id='code' maxlength='3'><button onclick='checkKeypad()'>Enter</button>`;
  } else if(type==='cipher'){
    interactionEl.innerHTML=`<p>Decode: "Wkh dqvzhu lv vxq" (shift 3)</p>
    <input id='cipher'><button onclick='checkCipher()'>Enter</button>`;
  } else if(type==='final'){
    interactionEl.innerHTML=`<p>Enter final code from clues:</p>
    <input id='final'><button onclick='checkFinal()'>Escape!</button>`;
  }
}

function checkKeypad(){
  const val=document.getElementById('code').value;
  if(val==='123'){rooms.Study.puzzle=null; moveRoom('Vault'); alert('Safe unlocked!');}
  else alert('Incorrect code.');
}

function checkCipher(){
  const val=document.getElementById('cipher').value.toLowerCase();
  if(val==='sun'){rooms.Vault.puzzle=null; moveRoom('Final'); alert('Cipher solved!');}
  else alert('Incorrect.');
}

function checkFinal(){
  const val=document.getElementById('final').value.toLowerCase();
  if(val==='freedom'){clearInterval(timerInterval);document.getElementById('game-container').classList.add('hidden');document.getElementById('victory-screen').classList.remove('hidden');victorySound.play();startConfetti();}
  else alert('Wrong code.');
}

// ----------------------------
// Timer
// ----------------------------
function updateTimer(){
  timeLeft--;
  const m=Math.floor(timeLeft/60);
  const s=timeLeft%60;
  timerEl.textContent=`Time: ${m}:${s.toString().padStart(2,'0')}`;
  if(timeLeft<=0){clearInterval(timerInterval);alert('⏰ Time’s up!');location.reload();}
}

// ----------------------------
// Confetti Animation
// ----------------------------
function startConfetti(){
  confettiCanvas.width=window.innerWidth;
  confettiCanvas.height=window.innerHeight;
  let pieces=[];
  for(let i=0;i<250;i++){
    pieces.push({x:Math.random()*confettiCanvas.width,y:Math.random()*confettiCanvas.height,r:Math.random()*6+2,d:Math.random()*50,color:`hsl(${Math.random()*360},100%,50%)`,tilt:Math.floor(Math.random()*10)-10});
  }
  let angle=0;
  function draw(){
    confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    pieces.forEach(p=>{
      confettiCtx.beginPath();
      confettiCtx.lineWidth=p.r;
      confettiCtx.strokeStyle=p.color;
      confettiCtx.moveTo(p.x+p.tilt,p.y);
      confettiCtx.lineTo(p.x+p.tilt,p.y+p.r);
      confettiCtx.stroke();
      p.tilt+=0.1;
      p.y+=Math.cos(angle+p.d)+1+p.r/2;
      if(p.y>confettiCanvas.height){p.x=Math.random()*confettiCanvas.width;p.y=-10;}
    });
    angle+=0.01;
    requestAnimationFrame(draw);
  }
  draw();
}
