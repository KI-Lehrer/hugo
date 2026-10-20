const SOURCE_URLS=['https://app.klassenflow.com/*','https://learningview.org/app/*'];
const SYNC_ALARM='hugo-planning-sync';
function sourceFor(url){
  try{const u=new URL(url);if(u.origin==='https://app.klassenflow.com')return 'klassenflow';if(u.origin==='https://learningview.org'&&u.pathname.startsWith('/app/'))return 'learningview';}catch{}
  return null;
}
async function sendSnapshot(snapshot,key,source){
  if(!source||snapshot?.source!==source||sourceFor(snapshot.url)!==source)throw new Error('Nicht erlaubte Quellseite.');
  const response=await fetch('http://127.0.0.1:4317/bridge/sync',{method:'POST',headers:{'Content-Type':'application/json','X-Hugo-Key':key},body:JSON.stringify(snapshot),signal:AbortSignal.timeout(10000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Hugo ist nicht erreichbar.');return result;
}
let syncing=false;
async function syncOpenTabs(){
  if(syncing)return;syncing=true;
  try{
    const {hugoKey,autoSync}=await chrome.storage.local.get(['hugoKey','autoSync']);
    if(!hugoKey||autoSync!==true)return;
    const tabs=await chrome.tabs.query({url:SOURCE_URLS});
    // One view per service: prefer the most recently used tab, including background tabs.
    const seen=new Set();
    for(const tab of tabs.sort((a,b)=>(b.lastAccessed||0)-(a.lastAccessed||0))){
      const source=sourceFor(tab.url);if(!source||seen.has(source))continue;seen.add(source);
      try{
        if(tab.discarded||tab.frozen)throw new Error('Tab ist pausiert. Bitte einmal öffnen.');
        const result=await chrome.tabs.sendMessage(tab.id,{type:'capture'});
        if(result?.error)throw new Error(result.error);
        const saved=await sendSnapshot(result?.snapshot,hugoKey,source);
        await chrome.storage.local.set({['syncStatus.'+source]:{capturedAt:saved.capturedAt,error:null}});
      }catch(error){await chrome.storage.local.set({['syncStatus.'+source]:{error:error.message}});}
    }
  }finally{syncing=false;}
}
async function ensureAlarm(){
  const {autoSync,hugoKey}=await chrome.storage.local.get(['autoSync','hugoKey']);
  if(autoSync===true&&hugoKey){if(!await chrome.alarms.get(SYNC_ALARM))await chrome.alarms.create(SYNC_ALARM,{periodInMinutes:1.5});}
  else await chrome.alarms.clear(SYNC_ALARM);
}
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name===SYNC_ALARM)return syncOpenTabs();});
chrome.runtime.onInstalled.addListener(()=>{void ensureAlarm();});
chrome.runtime.onStartup.addListener(()=>{void ensureAlarm();});
chrome.storage.onChanged.addListener((changes,area)=>{
  if(area==='local'&&(changes.autoSync||changes.hugoKey)){void ensureAlarm();void syncOpenTabs();}
});
void ensureAlarm();
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(message.type!=='sync')return;
  (async()=>{
    const source=sourceFor(sender.url);if(!source)throw new Error('Nicht erlaubte Quellseite.');
    const {hugoKey}=await chrome.storage.local.get('hugoKey');if(!hugoKey)throw new Error('Bitte zuerst mit Hugo verbinden.');
    return sendSnapshot(message.snapshot,hugoKey,source);
  })().then(respond,error=>respond({error:error.message}));return true;
});
