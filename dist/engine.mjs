// Pure learning and progress logic. Clock values are minutes in a 12-hour cycle.
export const LEVELS = [
  { id: 1, title: 'Meet the clock', subtitle: 'Five-minute times', text: 'Start with the hours and count by fives.', icon: '◷', colour: 'lavender', sample: '3:20', tag: 'A GREAT PLACE TO START' },
  { id: 2, title: 'Every minute matters', subtitle: 'Exact minutes', text: 'Look a little closer. Every tick counts!', icon: '✳', colour: 'peach', sample: '2:17', tag: 'LOOK A LITTLE CLOSER' },
  { id: 3, title: 'Time traveller', subtitle: 'Time elapsed', text: 'Hop a few minutes forward or back.', icon: '↗', colour: 'mint', sample: '+ 25 min', tag: 'MAKE A LITTLE TIME JUMP' },
  { id: 4, title: 'Clock champion', subtitle: 'Advanced time maths', text: 'Take bigger leaps with hours and minutes.', icon: '✦', colour: 'yellow', sample: '+ 1 h 45', tag: 'READY FOR A CHALLENGE?' },
];
export const BADGES = [{ id: 'rookie', title: 'Time Rookie', threshold: 5, stars: '★' }, { id: 'expert', title: 'Time Expert', threshold: 10, stars: '★★' }, { id: 'master', title: 'Time Master', threshold: 20, stars: '★★★' }];
export const wrap = value => ((Math.round(value) % 720) + 720) % 720;
export const formatTime = value => { const t = wrap(value); return `${Math.floor(t / 60) || 12}:${String(t % 60).padStart(2, '0')}`; };
export function durationText(minutes) { const h = Math.floor(minutes / 60), m = minutes % 60; return [h ? `${h} hour${h === 1 ? '' : 's'}` : '', m ? `${m} minute${m === 1 ? '' : 's'}` : ''].filter(Boolean).join(' and '); }
export const accuracy = (correct, total) => total ? Math.round(correct / total * 100) : 0;
const shuffle = (a, random) => { for (let i=a.length-1; i>0; i--) { const j=Math.floor(random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

export class QuestionGenerator {
  constructor(random = Math.random) { this.random = random; this.recent = []; this.bags = {}; }
  next(level) {
    // Balanced bags give equal practice in each mode and each math direction.
    if (!this.bags[level]?.length) this.bags[level] = shuffle(level < 3 ? ['read:0','set:0'] : ['read:1','set:1','read:-1','set:-1'], this.random);
    const [mode, direction] = this.bags[level].pop().split(':');
    let question;
    for (let attempt=0; attempt<1000; attempt++) {
      const base = level === 1 ? Math.floor(this.random()*144)*5 : Math.floor(this.random()*720);
      let delta = 0;
      if (level === 3) delta = (1 + Math.floor(this.random()*11))*5*Number(direction);
      if (level === 4) delta = (1 + Math.floor(this.random()*179))*Number(direction);
      const key = `${level}/${mode}/${base}/${delta}`;
      question = { level, mode, base, delta, answer: wrap(base+delta), key };
      if (!this.recent.includes(key)) break;
    }
    this.recent.push(question.key); this.recent = this.recent.slice(-32);
    return question;
  }
}

export function emptyProgress() { return { version: 1, streak: 0, best: 0, correct: 0, total: 0, highestLevel: 1, lastLevel: 1, achievements: [], levels: Object.fromEntries(LEVELS.map(l=>[l.id,{correct:0,total:0}])) }; }
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
export function normalizeProgress(raw) {
  const p = emptyProgress(); if (!raw || typeof raw !== 'object') return p;
  p.total=count(raw.total); p.correct=Math.min(count(raw.correct),p.total); p.best=Math.min(count(raw.best),p.correct); p.streak=Math.min(count(raw.streak),p.best);
  p.highestLevel = Math.min(4,Math.max(1,count(raw.highestLevel))); p.lastLevel=Math.min(4,Math.max(1,count(raw.lastLevel)));
  p.achievements=BADGES.filter(b=>p.best>=b.threshold).map(b=>b.id);
  for (const l of LEVELS) { const v=raw.levels?.[l.id]; const total=count(v?.total); p.levels[l.id]={total,correct:Math.min(total,count(v?.correct))}; }
  return p;
}
export function recordAnswer(progress, level, correct) {
  const old = new Set(progress.achievements);
  progress.total++; progress.levels[level].total++;
  if (correct) { progress.correct++; progress.levels[level].correct++; progress.streak++; progress.best=Math.max(progress.best,progress.streak); }
  else progress.streak=0;
  progress.achievements=BADGES.filter(b=>progress.best>=b.threshold).map(b=>b.id);
  return BADGES.filter(b=>progress.achievements.includes(b.id)&&!old.has(b.id));
}

export function readHint(time, level) {
  const t=wrap(time), hour=Math.floor(t/60)||12, minute=t%60;
  const hourHint=minute===0?`The short purple hand points to ${hour}.`:`The short purple hand has passed ${hour}, so the hour is ${hour}.`;
  return `${hourHint} ${level===1?'Count by 5 from 12 to the long orange hand.':'Count the big marks by 5, then add 1 for each small tick.'} At 12, the minutes are 00.`;
}
export function mathHint(question) {
  const n=Math.abs(question.delta), hours=Math.floor(n/60), minutes=n%60, word=question.delta>0?'forward':'back';
  return `Start at ${formatTime(question.base)}. ${hours?`Move ${word} ${durationText(hours*60)} first. `:''}${minutes?`Then count ${word} ${durationText(minutes)}. `:''}Each hour has 60 minutes. After 12 comes 1 on our clock.`;
}
