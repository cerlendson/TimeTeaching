import { LEVELS, BADGES, QuestionGenerator, emptyProgress, normalizeProgress, recordAnswer, formatTime, wrap, durationText, accuracy, readHint, mathHint } from './engine.mjs';
import { AnalogClock } from './clock.mjs';
const $=selector=>document.querySelector(selector);
// Keep this key stable across the rebrand so returning players retain their saved progress.
const STORAGE_KEY='tick-tock-club-progress-v1';
let storageAvailable=true;
let progress;
try { progress=normalizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { progress=emptyProgress(); }
const generator=new QuestionGenerator();
let currentLevel=progress.lastLevel, question=null, firstChecked=false, finished=false, currentView='home';
const gameClock=new AnalogClock($('#game-clock'),{time:0});
const levelLabels=['Count by 5s','Every minute','Time jumps','Hours & minutes'];
const levelIcons=['🐣','🔍','🚀','🏆'];
const levelDescriptions=['Read times like 3:20.','Read times like 2:17.','Move time forward or back.','Add and subtract bigger times.'];

function save() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(progress)); storageAvailable=true; }
  catch { storageAvailable=false; }
  document.body.dataset.storage=storageAvailable?'saved':'temporary';
  $('#saved-note').textContent=storageAvailable?'Progress saved on this device':'Progress is saved for this visit only';
}

function renderLevels(){
  $('#level-grid').innerHTML=LEVELS.map(level=>`<button class="level-card ${level.colour}" data-level="${level.id}" aria-label="Play level ${level.id}: ${levelLabels[level.id-1]}"><span class="level-number" aria-hidden="true">${levelIcons[level.id-1]}</span><span class="level-copy"><strong>${levelLabels[level.id-1]}</strong><span>${levelDescriptions[level.id-1]}</span></span><span class="level-arrow" aria-hidden="true">→</span></button>`).join('');
}

function updateStats(){
  $('#stat-streak').textContent=progress.streak;
  const next=BADGES.find(b=>!progress.achievements.includes(b.id));
  $('#next-badge-title').textContent=next?`Next: ${next.title}`:'You earned every badge!';
  $('#next-badge-copy').textContent=next?`${Math.max(0,next.threshold-progress.streak)} more in a row`:'Keep practising your clock skills.';
  const maximum=next?.threshold??20,current=next?Math.min(progress.streak,maximum):20;
  $('.badge-meter').setAttribute('aria-valuemax',maximum);$('.badge-meter').setAttribute('aria-valuenow',current);$('#badge-meter-fill').style.width=`${current/maximum*100}%`;
}

function showView(name,focus=true){
  currentView=name;
  document.body.dataset.view=name;
  for(const view of ['home','game','progress']) $(`#${view}-view`).hidden=view!==name;
  $('#nav-home').classList.toggle('active',name!=='progress');$('#nav-progress').classList.toggle('active',name==='progress');
  for(const [id,active] of [['#nav-home',name==='home'],['#nav-progress',name==='progress']]){if(active)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');}
  if(name==='home')renderLevels();if(name==='progress')renderProgress();updateStats();
  if(focus){window.scrollTo({top:0,behavior:'instant'});$('#main').focus({preventScroll:true});}
}
function route(){const hash=location.hash;if(hash==='#progress')showView('progress');else if(hash==='#play'){if(!question)startLevel(currentLevel);else showView('game');}else showView('home',!!hash);}
function go(name){const hash=name==='game'?'#play':`#${name}`;if(location.hash===hash)showView(name);else location.hash=hash;}

function startLevel(level){
  currentLevel=Math.min(4,Math.max(1,Number(level)||1));progress.lastLevel=currentLevel;progress.highestLevel=Math.max(progress.highestLevel,currentLevel);save();
  $('#level-heading').textContent=`Level ${currentLevel}`;
  nextQuestion(false);go('game');
}
function nextQuestion(focus=true){
  $('#confetti').replaceChildren();
  question=generator.next(currentLevel);firstChecked=false;finished=false;
  for(const selector of ['#feedback','#hint-panel','#next-button','#reveal-button'])$(selector).hidden=true;
  $('#hint-button').setAttribute('aria-expanded','false');$('#hint-button').textContent='Need a hint?';
  $('#hint-button').hidden=false;$('#answer-form').hidden=false;$('#check-button').disabled=false;
  const isRead=question.mode==='read',isMath=currentLevel>=3;
  $('#read-inputs').hidden=!isRead;$('#clock-tools').hidden=isRead;$('#given-time').hidden=isRead;
  $('#answer-hour').innerHTML='<option value="">–</option>'+Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');
  const step=currentLevel===1?5:1;
  $('#answer-minute').innerHTML='<option value="">– –</option>'+Array.from({length:60/step},(_,i)=>`<option value="${i*step}">${String(i*step).padStart(2,'0')}</option>`).join('');
  $('#answer-hour').disabled=false;$('#answer-minute').disabled=false;
  if(isMath){
    $('#game-title').textContent=question.delta>0?`${durationText(question.delta)} later?`:`${durationText(-question.delta)} ago?`;
    $('#question-description').textContent=isRead?'Read the clock, then work out the new time.':'Move the hands to the new time.';
    $('#given-time').innerHTML=`<span>Start at</span> ${formatTime(question.base)}`;
  }else{
    $('#game-title').textContent=isRead?'What time is it?':'Set the clock to';
    $('#question-description').textContent=isRead?'':'Drag the hands or use + and −.';
    $('#given-time').textContent=formatTime(question.answer);
  }
  $('#question-description').hidden=isRead&&!isMath;
  // The initial set clock always differs from the solution; no accidental free answers.
  let initial=isRead||isMath?question.base:wrap(question.answer+185);
  if(initial===question.answer&&!isRead)initial=wrap(initial+60);
  gameClock.setInteractive(!isRead,step);gameClock.setTime(initial);
  if(focus){window.scrollTo({top:0,behavior:'instant'});$('#game-title').focus({preventScroll:true});}
}

function feedback(title,copy,kind){const el=$('#feedback');el.className=`feedback ${kind}`;el.replaceChildren();const strong=document.createElement('strong');strong.textContent=title;el.append(strong,document.createTextNode(copy));el.hidden=false;}
function checkAnswer(event){
  event.preventDefault();if(!question||finished)return;
  let answer=gameClock.time;
  if(question.mode==='read'){
    const h=$('#answer-hour').value,m=$('#answer-minute').value;
    if(h===''||m===''){feedback('Almost there! 🌈','Choose an hour and a minute, then check your answer.','encourage');(h===''?$('#answer-hour'):$('#answer-minute')).focus();return;}
    answer=wrap(Number(h)*60+Number(m));
  }
  const correct=answer===question.answer,practice=firstChecked;
  let unlocked=[];
  if(!firstChecked){unlocked=recordAnswer(progress,currentLevel,correct);firstChecked=true;save();updateStats();}
  if(correct){
    const messages=['Great job! 🎉','Clock Champion! 🏆','Awesome! 🌟','Look at you shine! ✨','Hooray! 🥳','Super smart! 🦉'];
    feedback(practice?'You found it!':messages[Math.floor(Math.random()*messages.length)],`The time is ${formatTime(question.answer)}.`,'success');
    finishQuestion();confetti();
    if(unlocked.length)showBadge(unlocked[0]);
    else if(!practice&&progress.streak>0&&progress.streak%5===0)$('#feedback').append(document.createTextNode(` ${progress.streak} in a row!`));
  }else{
    feedback('Oops, try again! 💪',question.mode==='read'?'Look at the short hand first.':'Move the hands and try again.','encourage');
    $('#reveal-button').hidden=false;
  }
}
function finishQuestion(){
  finished=true;$('#answer-form').hidden=true;$('#hint-button').hidden=true;$('#reveal-button').hidden=true;$('#hint-panel').hidden=true;$('#next-button').hidden=false;gameClock.setInteractive(false);gameClock.setTime(gameClock.time);$('#clock-tools').hidden=true;
  $('#next-button').focus({preventScroll:true});
}
function showHint(){
  if(!$('#hint-panel').hidden){$('#hint-panel').hidden=true;$('#hint-button').setAttribute('aria-expanded','false');$('#hint-button').textContent='Need a hint?';return;}
  let hint;
  if(currentLevel>=3)hint=mathHint(question);
  else if(question.mode==='read')hint=readHint(question.base,currentLevel);
  else {const m=question.answer%60;hint=`Put the long orange hand ${m===0?'on 12':`at minute ${m}`}. ${currentLevel===1?'Each big number is worth 5 minutes.':'Each small tick is 1 minute.'} Put the short purple hand ${m===0?'on':'past'} ${Math.floor(question.answer/60)||12}. It moves toward the next hour as the minutes pass.`;}
  $('#hint').textContent=hint;$('#hint-panel').hidden=false;$('#hint-button').setAttribute('aria-expanded','true');$('#hint-button').textContent='Hide hint';
}
function revealAnswer(){
  if(!question||finished)return;
  // Showing the answer is available only after a recorded attempt.
  if(!firstChecked)return;
  gameClock.setTime(question.answer);
  const explanation=currentLevel>=3?`${formatTime(question.base)} ${question.delta>0?'plus':'minus'} ${durationText(Math.abs(question.delta))} is ${formatTime(question.answer)}.`:readHint(question.answer,currentLevel);
  feedback(`The time is ${formatTime(question.answer)}`,explanation,'encourage');finishQuestion();
}

function renderProgress(){
  const stats=[{value:progress.streak,label:'Current streak',colour:'lavender'},{value:progress.best,label:'Best streak',colour:'yellow'}];
  $('#dashboard-stats').innerHTML=stats.map(s=>`<div class="dashboard-stat ${s.colour}"><strong>${s.value}</strong><span>${s.label}</span></div>`).join('');
  $('#badge-count').textContent=`${progress.achievements.length} OF 3`;
  $('#teacher-stats').innerHTML=`<div><strong>${progress.total?`${accuracy(progress.correct,progress.total)}%`:'—'}</strong><span>Accuracy</span></div><div><strong>${progress.correct}</strong><span>Total correct</span></div><div><strong>${progress.total}</strong><span>Questions answered</span></div>`;
  $('#achievement-grid').innerHTML=BADGES.map(b=>{const earned=progress.achievements.includes(b.id);return `<div class="achievement ${earned?'earned':''}"><div class="achievement-stars" aria-hidden="true">${b.stars}</div><h3>${b.title}</h3><p>${b.threshold} correct in a row</p><small>${earned?'✓ You earned it!':'A win to work toward'}</small></div>`;}).join('');
  $('#level-performance').innerHTML=LEVELS.map(l=>{const data=progress.levels[l.id],pct=accuracy(data.correct,data.total);return `<div class="performance-row"><div class="performance-row-title"><b>${l.id}. ${levelLabels[l.id-1]}</b><span>${data.total?`${pct}%`:'Let’s begin'}</span></div><div class="performance-track" role="meter" aria-label="Level ${l.id} accuracy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div><div class="performance-detail">${data.correct} correct · ${data.total} answered${progress.lastLevel===l.id?' · Current level':''}</div></div>`;}).join('');
  $('#highest-level').textContent=`Highest level visited: ${progress.highestLevel} · ${levelLabels[progress.highestLevel-1]}`;
  const continueButton=$('.continue-button');
  const nextLevel=progress.lastLevel<4&&progress.levels[progress.lastLevel].correct>=5?progress.lastLevel+1:null;
  continueButton.textContent=nextLevel?`Try level ${nextLevel} →`:'Keep playing →';
  if(nextLevel)continueButton.dataset.level=nextLevel;else delete continueButton.dataset.level;
}

function openLesson(level=0){
  const title=level?levelLabels[level-1]:'How to play';$('#lesson-title').textContent=title;
  const basic=`<div class="mini-legend"><span>● Purple = hours</span><span>● Orange = minutes</span></div><div class="lesson-step"><span>1</span><div><h3>Find the hour</h3><p>The short purple hand tells the hour. If it sits between two numbers, use the number it has already passed.</p></div></div><div class="lesson-step"><span>2</span><div><h3>Count the minutes</h3><p>The long orange hand tells the minutes. Start at 12 with 00. Each big number adds 5 minutes. Each small tick adds 1.</p></div></div>`;
  if(level===1)$('#lesson-content').innerHTML=basic+'<div class="lesson-example">1 → 05 &nbsp; 2 → 10 &nbsp; 3 → 15 &nbsp; 6 → 30<br>9 → 45 &nbsp; 12 → 00<br><b>Short hand past 3 + long hand on 4 = 3:20</b></div>';
  else if(level===2)$('#lesson-content').innerHTML=basic+'<div class="lesson-example">Long hand 2 small ticks after the 3?<br>15 + 2 = <b>17 minutes</b>.<br>Short hand past 2? The time is <b>2:17</b>.</div>';
  else if(level>=3)$('#lesson-content').innerHTML=`<div class="lesson-step"><span>1</span><div><h3>Find your starting time</h3><p>Read both hands, or read the digital time. One hour has 60 minutes.</p></div></div><div class="lesson-step"><span>2</span><div><h3>Pick your direction</h3><p>“Later” and “in” mean move forward. “Ago” means move backward. When you pass 12, keep going around the clock.</p></div></div><div class="lesson-step"><span>3</span><div><h3>Make small jumps</h3><p>${level===4?'Move whole hours first, then minutes.':'Jump to the next hour first, then add any minutes left.'}</p></div></div><div class="lesson-example">${level===4?'2:10 minus 1 hour = 1:10.<br>Then minus 18 minutes = <b>12:52</b>.<br>Jump back 10 minutes to 1:00, then 8 more to 12:52.':'3:50 + 20 minutes?<br>10 minutes to 4:00, then 10 more = <b>4:10</b>.<br>4:10 minus 20 minutes takes you back to <b>3:50</b>.'}</div>`;
  else $('#lesson-content').innerHTML=basic+'<div class="lesson-step"><span>3</span><div><h3>Read it. Set it. Try it!</h3><p>Pick a level and try both kinds of question. Drag either hand to set the clock. You can also use the + and − buttons, or focus a hand and use the arrow keys.</p></div></div><div class="lesson-example">Get 5, 10, or 20 answers in a row to earn a badge.<br>Need another go? Hints and practice tries are always here.<br><b>No timer. Take all the time you need.</b></div>';
  $('#lesson-dialog').showModal();
}
function showBadge(badge){$('#badge-title').textContent=`You’re a ${badge.title}!`;$('#badge-description').textContent=`${badge.threshold} correct answers in a row. You’ve earned ${badge.stars} and a new badge for your collection.`;$('.celebration-star').textContent=badge.stars;$('#badge-dialog').showModal();}
function confetti(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const holder=$('#confetti');holder.replaceChildren();const colours=['#a88bce','#ebba58','#e89971','#9dbb9b','#8fb4cd'];
  for(let i=0;i<24;i++){const piece=document.createElement('i');piece.className='confetti-piece';piece.style.cssText=`left:${Math.random()*100}%;background:${colours[i%colours.length]};--drift:${Math.random()*180-90}px;--spin:${Math.random()*700-350}deg;animation-delay:${Math.random()*.35}s;border-radius:${i%3===0?'50%':'2px'}`;holder.append(piece);}
  setTimeout(()=>holder.replaceChildren(),2400);
}

document.addEventListener('click',event=>{
  const level=event.target.closest('[data-level]');if(level){startLevel(level.dataset.level);return;}
  const adjust=event.target.closest('[data-adjust]');if(adjust&&!finished){let value=Number(adjust.dataset.adjust);if(Math.abs(value)===1)value*=currentLevel===1?5:1;gameClock.setTime(gameClock.time+value);return;}
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(action==='start'||action==='continue')startLevel(progress.lastLevel);
  if(action==='home')go('home');if(action==='help')openLesson();if(action==='lesson')openLesson(currentLevel);
  if(action==='close-dialog')$('#lesson-dialog').close();if(action==='close-badge')$('#badge-dialog').close();
  if(action==='hint')showHint();if(action==='reveal')revealAnswer();if(action==='next')nextQuestion();
});
$('#answer-form').addEventListener('submit',checkAnswer);
window.addEventListener('hashchange',route);
// Synchronize the visible dashboard when another tab saves progress.
window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY)return;try{progress=normalizeProgress(JSON.parse(event.newValue));updateStats();if(currentView==='progress')renderProgress();}catch{/* Ignore malformed data from another tab. */}});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
renderLevels();updateStats();save();route();
