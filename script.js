const rooms = {
  Lobby: {
    bg:'https://source.unsplash.com/1600x900/?lobby,mysterious',
    description:'You wake up in a grand mysterious lobby. A door leads to the Study.',
    items:['keycard'],
    next:'Study'
  },
  Study: {
    bg:'https://source.unsplash.com/1600x900/?library,old,dim',
    description:'A dimly lit study with ancient books and a locked safe.',
    puzzle:'keypad',
    next:'Vault'
  },
  Vault: {
    bg:'https://source.unsplash.com/1600x900/?vault,metal,secret',
    description:'A cold metallic room holds a mysterious terminal.',
    puzzle:'cipher',
    next:'Final'
  },
  Final: {
    bg:'https://source.unsplash.com/1600x900/?sunrise,mystery',
    description:'You find the final door. Enter the correct code to escape.',
    puzzle:'final'
  }
};

let currentRoom='Lobby';
let timeLeft=15*60;
let inventory=[]; 
let timerInterval;

const roomEl=document.getElementById('room');
const nameEl=document.getElementById('room-name');
const timerEl=document.getElementById('timer');
const interactionEl=document.getElementById('interaction');
const inventoryEl=document.getElementById('inventory');
const musicEl=document.getElementById('bg-music');
const victorySound=document.getElementById('victory-sound');

document.getElementById('start-btn').addEventListener('click',()=>{
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-container').classList.remove('hidden');
  musicEl.play();
  startGame();
});

document.getElementById('restart-btn').addEventListener('click',()=>{
  location.reload();
});

document.getElementById('music-toggle').addEventListener('click',()=>{
  if(musicEl.paused) musicEl.play(); else musicEl.pause();
});

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

  if(room.items){
    room.items.forEach(item=>{
      const el=document.createElement('button');
      el.textContent=`Pick up ${item}`;
      el.onclick=()=>addItem(item);
      interactionEl.appendChild(el);
    });
  }

  if(room.puzzle){
    const btn=document.createElement('button');
    btn.textContent='Solve Puzzle';
    btn.onclick=()=>openPuzzle(room.puzzle);
    interactionEl.appendChild(btn);
  }

  if(room.next && !room.puzzle){
    const moveBtn=document.createElement('button');
    moveBtn.textContent=`Go to ${room.next}`;
    moveBtn.onclick=()=>moveRoom(room.next);
    interactionEl.appendChild(moveBtn);
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

function openPuzzle(type){
  interactionEl.innerHTML='';
  if(type==='keypad'){
    interactionEl.innerHTML=`<p>Enter 3-digit code to unlock:</p><input id='code' maxlength='3'><button onclick='checkKeypad()'>Enter</button>`;
  } else if(type==='cipher'){
    interactionEl.innerHTML=`<p>Decode message: "Wkh dqvzhu lv vxq" (shift 3)</p><input id='cipher'><button onclick='checkCipher()'>Enter</button>`;
  } else if(type==='final'){
    interactionEl.innerHTML=`<p>Final Code (combine clues):</p><input id='final'><button onclick='checkFinal()'>Escape!</button>`;
  }
}

function checkKeypad(){
  const val=document.getElementById('code').value;
  if(val==='123'){
    alert('Safe unlocked! Proceed to the Vault.');
    rooms.Study.puzzle=null;
    moveRoom('Vault');
  } else alert('Incorrect code.');
}

function checkCipher(){
  const val=document.getElementById('cipher').value.toLowerCase();
  if(val==='sun'){
    alert('Terminal accepted code. Proceed to Final Room.');
    rooms.Vault.puzzle=null;
    moveRoom('Final');
  } else alert('Incorrect. Try again.');
}

function checkFinal(){
  const val=document.getElementById('final').value.toLowerCase();
  if(val==='freedom'){
    clearInterval(timerInterval);
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
    victorySound.play();
  } else alert('Wrong code.');
}

function updateTimer(){
  timeLeft--;
  const minutes=Math.floor(timeLeft/60);
  const seconds=timeLeft%60;
  timerEl.textContent=`Time: ${minutes}:${seconds.toString().padStart(2,'0')}`;
  if(timeLeft<=0){
    clearInterval(timerInterval);
    alert('⏰ Time’s up! You failed to escape.');
    location.reload();
  }
}
