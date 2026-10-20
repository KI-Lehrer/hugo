const $=id=>document.getElementById(id);
chrome.storage.local.get(['hugoKey','autoSync']).then(s=>{$('key').value=s.hugoKey||'';$('auto').checked=s.autoSync===true;});
$('save').onclick=async()=>{
  const key=$('key').value.trim();if(!/^[a-f0-9]{64}$/.test(key)){$('status').textContent='Bitte den vollständigen Verbindungscode aus Hugo einfügen.';return;}
  await chrome.storage.local.set({hugoKey:key,autoSync:$('auto').checked});$('status').textContent='Verbindung gespeichert. Öffne KlassenFLOW oder LearningView und übernimm die Ansicht.';
};
$('sync').onclick=async()=>{
  try{
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    const result=await chrome.tabs.sendMessage(tab.id,{type:'capture'});if(result.error)throw new Error(result.error);
    const {hugoKey}=await chrome.storage.local.get('hugoKey');if(!hugoKey)throw new Error('Bitte zuerst die Verbindung speichern.');
    const response=await fetch('http://127.0.0.1:4317/bridge/sync',{method:'POST',headers:{'Content-Type':'application/json','X-Hugo-Key':hugoKey},body:JSON.stringify(result.snapshot)});
    const saved=await response.json();if(!response.ok)throw new Error(saved.error||'Übernahme fehlgeschlagen.');$('status').textContent='Ansicht an Hugo übergeben. In Hugo die Wochenübersicht öffnen.';
  }catch(error){$('status').textContent=error.message||'Bitte die Planungsseite nach der Installation neu laden.';}
};
