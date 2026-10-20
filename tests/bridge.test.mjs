import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
const script=await fs.readFile(new URL('../browser-bridge/capture.js',import.meta.url),'utf8');
function capture(origin,document){const context={location:{origin,href:origin+'/'},document,chrome:{runtime:{onMessage:{addListener(){}}}},setInterval(){}};vm.createContext(context);vm.runInContext(script,context);return ()=>vm.runInContext('capturePlanning()',context);}
test('bridge captures only timetable lessons; personal appointment cells are excluded',()=>{
  const subject={innerText:'6b Mathematik'},topic={innerText:'6.3.3 Brüche'},note={innerText:'Lernziel: vergleichen.',getAttribute:()=>null};
  const lesson={dataset:{day:'0',hour:'3'},querySelector:s=>({'.lesson-class':subject,'.lesson-topic':topic,'.lesson-note':note})[s]};
  const grid={getClientRects:()=>[{}],querySelector:()=>({innerText:'19.10.'}),querySelectorAll:s=>s.includes('day-date')?[{innerText:'19.10.'}]:[lesson,{querySelector:()=>null,innerText:'Privater Termin'}]};
  const document={title:'KlassenFLOW',getElementById:id=>id==='grid'?grid:{value:''},querySelector:()=>({innerText:'KW 43 19. Oktober – 23. Oktober 2026'})};
  const result=capture('https://app.klassenflow.com',document)();assert.equal(result.weekStart,'2026-10-19');assert.match(result.text,/Stundenplan-Slot 3/);assert.ok(!result.text.includes('Privater Termin'));
});
test('bridge rejects a LearningView pupil popup without material roots',()=>{
  const document={getElementById:id=>id==='navbarTeachBtn'?{innerText:'Unterrichten in Klasse'}:id==='openTaskButtonWindow'?{innerText:'Pupil review',getClientRects:()=>[{}]}:null};
  assert.throws(capture('https://learningview.org',document),/Materialien/);
});

const workerScript=await fs.readFile(new URL('../browser-bridge/background.js',import.meta.url),'utf8');
function workerHarness({autoSync=true,discarded=false,wrongSource=false}={}){
  const handlers={},requests=[],messages=[],stored={};let query;
  const event=name=>({addListener(fn){handlers[name]=fn;}});
  const context={URL,Set,AbortSignal,chrome:{
    storage:{local:{async get(){return {hugoKey:'test-key',autoSync};},async set(data){Object.assign(stored,data);}},onChanged:event('changed')},
    alarms:{async get(){return {};},async create(){},async clear(){},onAlarm:event('alarm')},
    runtime:{onInstalled:event('installed'),onStartup:event('startup'),onMessage:event('message')},
    tabs:{async query(q){query=q;return [{id:1,url:'https://app.klassenflow.com/',active:false,discarded},{id:2,url:'https://learningview.org/app/#!/',active:false}];},async sendMessage(id,message){messages.push({id,message});const source=id===1?'klassenflow':'learningview';return {snapshot:{source:wrongSource?'other':source,url:id===1?'https://app.klassenflow.com/':'https://learningview.org/app/#!/',text:'Current material'}};}}
  },async fetch(url,options){requests.push({url,...options});return {ok:true,async json(){return {ok:true,capturedAt:'2026-10-20T14:00:00Z'};}};}};
  vm.createContext(context);vm.runInContext(workerScript,context);
  return {handlers,requests,messages,stored,get query(){return query;}};
}
test('alarm captures both background sources without activating or reloading tabs',async()=>{
  const h=workerHarness();await h.handlers.alarm({name:'hugo-planning-sync'});
  assert.equal(h.requests.length,2);assert.deepEqual(h.messages.map(x=>x.id),[1,2]);assert.equal(h.query.active,undefined);
  assert.equal(h.stored['syncStatus.klassenflow'].error,null);assert.equal(h.stored['syncStatus.learningview'].error,null);
});
test('background capture stops when automatic sync is disabled',async()=>{
  const h=workerHarness({autoSync:false});await h.handlers.alarm({name:'hugo-planning-sync'});assert.equal(h.requests.length,0);assert.equal(h.messages.length,0);
});
test('paused tabs are reported, other sources continue; mismatched source data never leaves browser',async()=>{
  const h=workerHarness({discarded:true});await h.handlers.alarm({name:'hugo-planning-sync'});assert.equal(h.requests.length,1);assert.match(h.stored['syncStatus.klassenflow'].error,/pausiert/);
  const mismatch=workerHarness({wrongSource:true});await mismatch.handlers.alarm({name:'hugo-planning-sync'});assert.equal(mismatch.requests.length,0);
});
