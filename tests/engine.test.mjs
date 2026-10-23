import test from 'node:test';
import assert from 'node:assert/strict';
import { QuestionGenerator, wrap, formatTime, durationText, emptyProgress, normalizeProgress, recordAnswer } from '../dist/engine.mjs';
function seeded(seed=42){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
test('12-hour arithmetic crosses noon, midnight, and hour boundaries',()=>{
  assert.equal(formatTime(0),'12:00');assert.equal(formatTime(720),'12:00');
  assert.equal(formatTime(70-78),'11:52');assert.equal(formatTime(130-78),'12:52');
  assert.equal(formatTime(710+137),'2:07');assert.equal(formatTime(250-20),'3:50');
  assert.equal(wrap(-1441),719);assert.equal(durationText(128),'2 hours and 8 minutes');
});
for(const level of [1,2,3,4])test(`level ${level} generates balanced, valid, non-recent questions`,()=>{
  const generator=new QuestionGenerator(seeded(level));const recent=[];const counts={read:0,set:0,plus:0,minus:0};const minutes=new Set();
  for(let i=0;i<1200;i++){
    const q=generator.next(level);assert.equal(q.level,level);assert.ok(!recent.includes(q.key));
    recent.push(q.key);if(recent.length>32)recent.shift();counts[q.mode]++;counts[q.delta>0?'plus':'minus']++;
    assert.ok(q.base>=0&&q.base<720);assert.equal(q.answer,wrap(q.base+q.delta));minutes.add(q.base%60);
    if(level===1){assert.equal(q.base%5,0);assert.equal(q.delta,0);}
    if(level===2)assert.equal(q.delta,0);
    if(level===3){assert.ok(Math.abs(q.delta)>=5&&Math.abs(q.delta)<=55);assert.equal(Math.abs(q.delta)%5,0);}
    if(level===4)assert.ok(Math.abs(q.delta)>=1&&Math.abs(q.delta)<=179);
  }
  assert.equal(counts.read,600);assert.equal(counts.set,600);
  if(level>=3){assert.equal(counts.plus,600);assert.equal(counts.minus,600);}
  assert.equal(minutes.size,level===1?12:60);
});
test('streak badges unlock once and survive a missed answer and reload',()=>{
  const p=emptyProgress(),unlocked=[];
  for(let i=0;i<20;i++)unlocked.push(...recordAnswer(p,1,true).map(b=>b.id));
  assert.deepEqual(unlocked,['rookie','expert','master']);assert.equal(p.streak,20);assert.equal(p.best,20);
  recordAnswer(p,2,false);assert.equal(p.streak,0);assert.equal(p.total,21);assert.equal(p.correct,20);
  const loaded=normalizeProgress(JSON.parse(JSON.stringify(p)));assert.deepEqual(loaded.achievements,['rookie','expert','master']);assert.equal(loaded.levels[2].total,1);
  assert.equal(recordAnswer(loaded,1,true).length,0);assert.equal(loaded.streak,1);
});
test('malformed storage recovers to safe values',()=>{
  for(const raw of [null,42,'text',{}, {total:-4,correct:Infinity,best:'5',highestLevel:99,levels:{1:{total:3,correct:9}}}]){
    const p=normalizeProgress(raw);assert.ok(Number.isFinite(p.total));assert.ok(p.correct<=p.total);assert.ok(p.highestLevel>=1&&p.highestLevel<=4);assert.ok(p.levels[1].correct<=p.levels[1].total);
  }
});
